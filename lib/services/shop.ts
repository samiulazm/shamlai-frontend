// Shop Service - Shop settings and configuration
import { supabaseClient, STORAGE_BUCKETS } from '../supabase';

import { logger } from '../utils/logger';

import type {
  ShopSettings,
  Theme,
  Page,
  PaymentMethod,
  ShippingMethod,
  TaxRate,
} from '../types/database';
import { cacheGetOrSet, cacheDelete, CACHE_TTL, REDIS_KEYS } from '../cache/redis';

// ============================================================================

// Shop Settings
// ============================================================================

import { normalizeSubdomain } from '../utils/subdomain';
export { normalizeSubdomain };

/**
 * Check if a subdomain exists.
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const normalized = normalizeSubdomain(subdomain);
  const { data, error } = await supabaseClient
    .from('shop_settings')
    .select('id')
    .eq('subdomain', normalized)
    .limit(1);

  if (error) {
    // In many environments (e.g. before auth/RLS is fully configured) this check can
    // fail even though the subdomain is actually free. We log the error for debugging
    // but assume the subdomain is available so signup is not blocked.
    logger.warn('Failed checking subdomain existence, assuming available', error);
    return true;
  }

  return (data || []).length === 0;
}

/**
 * Generate a unique subdomain based on a preferred base.
 * If taken, appends -1, -2, ... until free.
 */
export async function generateUniqueSubdomain(preferredBase: string): Promise<string> {
  const base = normalizeSubdomain(preferredBase);
  if (await isSubdomainAvailable(base)) return base;
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (await isSubdomainAvailable(candidate)) return candidate;
  }
  // Extremely unlikely fallback
  return `${base}-${Date.now()}`;
}

/**
 * Generate a unique shop ID (UUID)
 */
export async function generateUniqueShopId(): Promise<string> {
  // Check if crypto.randomUUID is available (Node.js 16+, browsers with crypto API)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  // Generate a UUID v4 manually
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for older environments
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to UUID string format
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Resolve a user ID (shop path) by subdomain.
 * The storefront routes use user_id as the [shop] parameter.
 */
export async function getShopIdBySubdomain(subdomain: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('shop_settings')
      .select('user_id')
      .eq('subdomain', subdomain)
      .single();
    if (error) return null;
    return data?.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Resolve a subdomain by shop ID or user ID.
 * The storefront URL may use either the shop_id or user_id.
 */
export async function getSubdomainByShopId(id: string): Promise<string | null> {
  try {
    // First try by shop_id
    const { data, error } = await supabaseClient
      .from('shop_settings')
      .select('subdomain')
      .eq('shop_id', id)
      .single();

    if (!error && data?.subdomain) {
      return data.subdomain;
    }

    // If not found, try by user_id
    const result = await supabaseClient
      .from('shop_settings')
      .select('subdomain')
      .eq('user_id', id)
      .single();

    if (result.error) return null;
    return result.data?.subdomain || null;
  } catch {
    return null;
  }
}

/**
 * Get shop settings
 */
export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  return cacheGetOrSet(
    REDIS_KEYS.SHOP(shopId),
    async () => {
      try {
        const { data, error } = await supabaseClient
          .from('shop_settings')
          .select('*')
          .eq('shop_id', shopId)
          .single();

        if (error) {
          if (error?.code === 'PGRST116') return null;
          throw error;
        }

        return data;
      } catch (error: any) {
        logger.error(
          'Error fetching shop settings',
          error instanceof Error ? error : new Error(String(error)),
          { shopId }
        );
        throw error;
      }
    },
    { ttl: CACHE_TTL.SHOP }
  );
}

/**
 * Create or update shop settings
 */
export async function upsertShopSettings(
  shopId: string,
  settings: Partial<Omit<ShopSettings, 'id' | 'shop_id' | 'created_at' | 'updated_at'>>
): Promise<ShopSettings> {
  try {
    // First, try to get existing settings
    // Note: We bypass cache here to ensure we get latest DB state for updates
    const { data: existingSettings } = await supabaseClient
      .from('shop_settings')
      .select('id')
      .eq('shop_id', shopId)
      .single();

    let result: ShopSettings;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabaseClient
        .from('shop_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabaseClient
        .from('shop_settings')
        .insert([
          {
            shop_id: shopId,
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Invalidate cache
    await cacheDelete(REDIS_KEYS.SHOP(shopId));
    if (result.subdomain) {
      // Also invalidate subdomain lookup cache if it exists
      await cacheDelete(REDIS_KEYS.SHOP_BY_SUBDOMAIN(result.subdomain));
    }

    return result;
  } catch (error: any) {
    logger.error(
      'Error upserting shop settings',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Upload shop logo
 */
export async function uploadShopLogo(shopId: string, file: File): Promise<string> {
  try {
    const fileName = `logo-${shopId}-${Date.now()}.${file.name.split('.').pop()}`;

    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKETS.SHOP_ASSETS)
      .upload(fileName, file);

    if (error || !data) throw error || new Error('Upload failed');

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseClient.storage
      .from(STORAGE_BUCKETS.SHOP_ASSETS)
      .getPublicUrl(data.path);

    // Update shop settings with new logo URL
    await upsertShopSettings(shopId, { logo_url: urlData.publicUrl });

    return urlData.publicUrl;
  } catch (error: any) {
    logger.error(
      'Error uploading shop logo',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Themes
// ============================================================================

/**
 * Get active theme
 */
export async function getActiveTheme(shopId: string): Promise<Theme | null> {
  return cacheGetOrSet(
    `shop_theme:${shopId}`,
    async () => {
      try {
        const { data, error } = await supabaseClient
          .from('themes')
          .select('*')
          .eq('shop_id', shopId)
          .eq('is_active', true)
          .single();

        if (error) {
          if (error?.code === 'PGRST116') return null;
          throw error;
        }
        return data;
      } catch (error: any) {
        logger.error(
          'Error fetching active theme',
          error instanceof Error ? error : new Error(String(error)),
          { shopId }
        );
        throw error;
      }
    },
    { ttl: CACHE_TTL.SHOP }
  );
}

/**
 * Create or update theme
 */
export async function upsertTheme(
  shopId: string,
  themeData: Partial<Omit<Theme, 'id' | 'shop_id' | 'created_at' | 'updated_at'>>
): Promise<Theme> {
  let result: Theme;
  try {
    // If setting as active, deactivate other themes first
    if (themeData.is_active) {
      await supabaseClient.from('themes').update({ is_active: false }).eq('shop_id', shopId);
    }

    // Check if there's already an active theme
    // Direct DB check to avoid stale cache
    const { data: existingTheme } = await supabaseClient
      .from('themes')
      .select('id')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .single();

    if (existingTheme) {
      // Update existing theme
      const { data, error } = await supabaseClient
        .from('themes')
        .update({
          ...themeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTheme.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new theme
      const { data, error } = await supabaseClient
        .from('themes')
        .insert([
          {
            shop_id: shopId,
            ...themeData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Invalidate cache
    await cacheDelete(`shop_theme:${shopId}`);

    return result;
  } catch (error: any) {
    logger.error(
      'Error upserting theme',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Get products for a shop (Cached)
 */
export async function getProductsByShop(shopId: string): Promise<any[]> {
  return cacheGetOrSet(
    REDIS_KEYS.PRODUCT_LIST(shopId, 1), // Default to page 1 for now
    async () => {
      try {
        const { data, error } = await supabaseClient
          .from('products')
          .select(
            `
            *,
            product_images (
              id,
              image_url,
              is_primary,
              sort_order
            )
          `
          )
          .eq('shop_id', shopId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        logger.error(
          'Error fetching shop products',
          error instanceof Error ? error : new Error(String(error)),
          { shopId }
        );
        throw error;
      }
    },
    { ttl: CACHE_TTL.PRODUCT_LIST }
  );
}

// ============================================================================
// Static Pages
// ============================================================================

/**
 * Get all pages
 */
export async function getPages(shopId: string, isPublished?: boolean): Promise<Page[]> {
  const key = `shop_pages:${shopId}:${isPublished === undefined ? 'all' : isPublished}`;
  return cacheGetOrSet(
    key,
    async () => {
      try {
        let query = supabaseClient.from('pages').select('*').eq('shop_id', shopId);

        if (isPublished !== undefined) {
          query = query.eq('is_published', isPublished);
        }

        query = query.order('sort_order', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
      } catch (error: any) {
        logger.error(
          'Error fetching pages',
          error instanceof Error ? error : new Error(String(error)),
          { shopId }
        );
        throw error;
      }
    },
    { ttl: CACHE_TTL.SHOP }
  );
}

/**
 * Get page by slug
 */
export async function getPageBySlug(shopId: string, slug: string): Promise<Page | null> {
  try {
    const { data, error } = await supabaseClient
      .from('pages')
      .select('*')
      .eq('shop_id', shopId)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error?.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    logger.error(
      'Error fetching page by slug',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        slug,
      }
    );
    throw error;
  }
}

/**
 * Create page
 */
export async function createPage(
  pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>
): Promise<Page> {
  try {
    const { data, error } = await supabaseClient.from('pages').insert([pageData]).select().single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error creating page', error instanceof Error ? error : new Error(String(error)), {
      shopId: pageData.shop_id,
    });
    throw error;
  }
}

/**
 * Update page
 */
export async function updatePage(pageId: string, updates: Partial<Page>): Promise<Page> {
  try {
    const { data, error } = await supabaseClient
      .from('pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', pageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error updating page', error instanceof Error ? error : new Error(String(error)), {
      pageId,
    });
    throw error;
  }
}

/**
 * Delete page
 */
export async function deletePage(pageId: string): Promise<void> {
  try {
    const { error } = await supabaseClient.from('pages').delete().eq('id', pageId);

    if (error) throw error;
  } catch (error: any) {
    logger.error('Error deleting page', error instanceof Error ? error : new Error(String(error)), {
      pageId,
    });
    throw error;
  }
}

// ============================================================================
// Payment Methods
// ============================================================================

/**
 * Get active payment methods
 */
export async function getPaymentMethods(shopId: string): Promise<PaymentMethod[]> {
  try {
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching payment methods',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create payment method
 */
export async function createPaymentMethod(
  methodData: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>
): Promise<PaymentMethod> {
  try {
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .insert([methodData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error creating payment method',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId: methodData.shop_id,
      }
    );
    throw error;
  }
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(
  methodId: string,
  updates: Partial<PaymentMethod>
): Promise<PaymentMethod> {
  try {
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', methodId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating payment method',
      error instanceof Error ? error : new Error(String(error)),
      {
        methodId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Shipping Methods
// ============================================================================

/**
 * Get active shipping methods
 */
export async function getShippingMethods(shopId: string): Promise<ShippingMethod[]> {
  try {
    const { data, error } = await supabaseClient
      .from('shipping_methods')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching shipping methods',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create shipping method
 */
export async function createShippingMethod(
  methodData: Omit<ShippingMethod, 'id' | 'created_at' | 'updated_at'>
): Promise<ShippingMethod> {
  try {
    const { data, error } = await supabaseClient
      .from('shipping_methods')
      .insert([methodData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error creating shipping method',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId: methodData.shop_id,
      }
    );
    throw error;
  }
}

/**
 * Update shipping method
 */
export async function updateShippingMethod(
  methodId: string,
  updates: Partial<ShippingMethod>
): Promise<ShippingMethod> {
  try {
    const { data, error } = await supabaseClient
      .from('shipping_methods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', methodId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating shipping method',
      error instanceof Error ? error : new Error(String(error)),
      {
        methodId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Tax Rates
// ============================================================================

/**
 * Get tax rates
 */
export async function getTaxRates(shopId: string): Promise<TaxRate[]> {
  try {
    const { data, error } = await supabaseClient
      .from('tax_rates')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching tax rates',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create tax rate
 */
export async function createTaxRate(
  rateData: Omit<TaxRate, 'id' | 'created_at' | 'updated_at'>
): Promise<TaxRate> {
  try {
    const { data, error } = await supabaseClient
      .from('tax_rates')
      .insert([rateData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error creating tax rate',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId: rateData.shop_id,
      }
    );
    throw error;
  }
}

/**
 * Update tax rate
 */
export async function updateTaxRate(rateId: string, updates: Partial<TaxRate>): Promise<TaxRate> {
  try {
    const { data, error } = await supabaseClient
      .from('tax_rates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', rateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating tax rate',
      error instanceof Error ? error : new Error(String(error)),
      {
        rateId,
      }
    );
    throw error;
  }
}

/**
 * Calculate applicable tax for an address
 */
export async function calculateTax(
  shopId: string,
  country: string,
  state?: string,
  city?: string,
  postalCode?: string
): Promise<number> {
  try {
    const query = supabaseClient
      .from('tax_rates')
      .select('rate')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    // Try to find most specific match
    if (postalCode) {
      const { data: postalMatch } = await query
        .eq('country', country)
        .eq('postal_code', postalCode)
        .single();
      if (postalMatch) return postalMatch.rate;
    }

    if (city && state) {
      const { data: cityMatch } = await query
        .eq('country', country)
        .eq('state', state)
        .eq('city', city)
        .single();
      if (cityMatch) return cityMatch.rate;
    }

    if (state) {
      const { data: stateMatch } = await query
        .eq('country', country)
        .eq('state', state)
        .is('city', null)
        .single();
      if (stateMatch) return stateMatch.rate;
    }

    // Default to country-level tax
    const { data: countryMatch } = await query
      .eq('country', country)
      .is('state', null)
      .is('city', null)
      .is('postal_code', null)
      .single();

    return countryMatch?.rate || 0;
  } catch (error: any) {
    logger.error(
      'Error calculating tax',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        country,
        state,
        city,
        postalCode,
      }
    );
    return 0; // Default to 0 if error
  }
}

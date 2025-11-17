// Shop Service - Shop settings and configuration
import { insforgeClient, STORAGE_BUCKETS } from '../insforge';
import { logger } from '../utils/logger';
import { cacheAside, invalidateCache, CACHE_TTL, REDIS_KEYS } from '../redis';
import type {
  ShopSettings,
  Theme,
  Page,
  PaymentMethod,
  ShippingMethod,
  TaxRate,
} from '../types/database';

// ============================================================================
// Shop Settings
// ============================================================================

/**
 * Turn a name/email local-part into a DNS-safe subdomain slug.
 */
export function normalizeSubdomain(source: string): string {
  return (
    (source || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with hyphen
      .replace(/^-+|-+$/g, '') // trim hyphens
      .slice(0, 50) || // enforce max length
    'shop'
  );
}

/**
 * Check if a subdomain exists.
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const normalized = normalizeSubdomain(subdomain);
  const { data, error } = await insforgeClient.database
    .from('shop_settings')
    .select('id')
    .eq('subdomain', normalized)
    .limit(1);
  if (error) {
    logger.warn('Failed checking subdomain existence', error);
    // On error, treat as unavailable to avoid duplicates
    return false;
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
 * Generate a random shop ID with 8, 9, or 10 digits.
 * The generated number will not have leading zeros.
 */
export function generateRandomShopId(): string {
  // Random length between 8 and 10
  const length = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10

  // Generate random number with the specified length
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNum.toString();
}

/**
 * Check if a shop ID exists.
 */
export async function isShopIdAvailable(shopId: string): Promise<boolean> {
  try {
    const { data, error } = await insforgeClient.database
      .from('shop_settings')
      .select('id')
      .eq('shop_id', shopId)
      .limit(1);
    if (error) {
      logger.warn('Failed checking shop ID existence', error);
      // On error, treat as unavailable to avoid duplicates
      return false;
    }
    return (data || []).length === 0;
  } catch {
    return false;
  }
}

/**
 * Generate a unique shop ID with 8, 9, or 10 digits.
 * Keeps generating until a unique one is found (up to 100 attempts).
 * @throws {Error} If unable to generate a unique ID after maximum attempts
 */
export async function generateUniqueShopId(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const shopId = generateRandomShopId();
    if (await isShopIdAvailable(shopId)) {
      return shopId;
    }
    attempts++;
  }

  // Extremely unlikely fallback - use timestamp-based ID
  throw new Error('Unable to generate unique shop ID after maximum attempts');
}

/**
 * Resolve a shop ID by subdomain.
 * Cached for 1 hour (subdomains rarely change)
 */
export async function getShopIdBySubdomain(subdomain: string): Promise<string | null> {
  try {
    const cacheKey = REDIS_KEYS.SHOP_BY_SUBDOMAIN(subdomain);

    return await cacheAside(
      cacheKey,
      async () => {
        const { data, error } = await insforgeClient.database
          .from('shop_settings')
          .select('shop_id')
          .eq('subdomain', subdomain)
          .single();
        if (error) return null;
        return data?.shop_id || null;
      },
      CACHE_TTL.SHOP_SUBDOMAIN
    );
  } catch {
    return null;
  }
}

/**
 * Get shop settings
 * Cached for 1 hour (settings change infrequently)
 */
export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  try {
    const cacheKey = REDIS_KEYS.SHOP(shopId);

    return await cacheAside(
      cacheKey,
      async () => {
        const { data, error } = await insforgeClient.database
          .from('shop_settings')
          .select('*')
          .eq('shop_id', shopId)
          .single();

        if (error) {
          // If no settings exist, return null
          if (error?.code === 'PGRST116') {
            return null;
          }
          throw error;
        }

        return data;
      },
      CACHE_TTL.SHOP
    );
  } catch (error: any) {
    logger.error(
      'Error fetching shop settings',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create or update shop settings
 */
export async function upsertShopSettings(
  shopId: string,
  settings: Partial<Omit<ShopSettings, 'id' | 'shop_id' | 'created_at' | 'updated_at'>>
): Promise<ShopSettings> {
  try {
    // First, try to get existing settings (bypass cache for latest data)
    const { data: existingSettings } = await insforgeClient.database
      .from('shop_settings')
      .select('*')
      .eq('shop_id', shopId)
      .limit(1);

    let result: ShopSettings;

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const { data, error } = await insforgeClient.database
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
      const { data, error } = await insforgeClient.database
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

    // Invalidate caches
    await Promise.all([
      invalidateCache.shop(shopId),
      result.subdomain ? invalidateCache.shopBySubdomain(result.subdomain) : Promise.resolve(),
    ]);

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

    const { data, error } = await insforgeClient.storage
      .from(STORAGE_BUCKETS.SHOP_ASSETS)
      .upload(fileName, file);

    if (error || !data) throw error || new Error('Upload failed');

    // Update shop settings with new logo URL
    await upsertShopSettings(shopId, { logo_url: data.url });

    return data.url;
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
  try {
    const { data, error } = await insforgeClient.database
      .from('themes')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
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
      'Error fetching active theme',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create or update theme
 */
export async function upsertTheme(
  shopId: string,
  themeData: Partial<Omit<Theme, 'id' | 'shop_id' | 'created_at' | 'updated_at'>>
): Promise<Theme> {
  try {
    // If setting as active, deactivate other themes first
    if (themeData.is_active) {
      await insforgeClient.database
        .from('themes')
        .update({ is_active: false })
        .eq('shop_id', shopId);
    }

    // Check if there's already an active theme
    const existingTheme = await getActiveTheme(shopId);

    if (existingTheme) {
      // Update existing theme
      const { data, error } = await insforgeClient.database
        .from('themes')
        .update({
          ...themeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTheme.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new theme
      const { data, error } = await insforgeClient.database
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
      return data;
    }
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

// ============================================================================
// Static Pages
// ============================================================================

/**
 * Get all pages
 */
export async function getPages(shopId: string, isPublished?: boolean): Promise<Page[]> {
  try {
    let query = insforgeClient.database.from('pages').select('*').eq('shop_id', shopId);

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
      {
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Get page by slug
 */
export async function getPageBySlug(shopId: string, slug: string): Promise<Page | null> {
  try {
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
      .from('pages')
      .insert([pageData])
      .select()
      .single();

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
    const { data, error } = await insforgeClient.database
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
    const { error } = await insforgeClient.database.from('pages').delete().eq('id', pageId);

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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const { data, error } = await insforgeClient.database
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
    const query = insforgeClient.database
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

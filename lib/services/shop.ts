// Shop Service - Shop settings and configuration
import { insforgeClient, STORAGE_BUCKETS } from '../insforge';
import { logger } from '../utils/logger';
import type {
  ShopSettings,
  Theme,
  Page,
  PaymentMethod,
  ShippingMethod,
  TaxRate
} from '../types/database';

// ============================================================================
// Shop Settings
// ============================================================================

/**
 * Get shop settings
 */
export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  try {
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
  } catch (error: any) {
    logger.error('Error fetching shop settings', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    // First, try to get existing settings
    const existingSettings = await getShopSettings(shopId);
    
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await insforgeClient.database
        .from('shop_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('shop_id', shopId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new settings
      const { data, error } = await insforgeClient.database
        .from('shop_settings')
        .insert([{
          shop_id: shopId,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error: any) {
    logger.error('Error upserting shop settings', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
    throw error;
  }
}

/**
 * Upload shop logo
 */
export async function uploadShopLogo(
  shopId: string,
  file: File
): Promise<string> {
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
    logger.error('Error uploading shop logo', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    logger.error('Error fetching active theme', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
          updated_at: new Date().toISOString()
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
        .insert([{
          shop_id: shopId,
          ...themeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error: any) {
    logger.error('Error upserting theme', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    let query = insforgeClient.database
      .from('pages')
      .select('*')
      .eq('shop_id', shopId);

    if (isPublished !== undefined) {
      query = query.eq('is_published', isPublished);
    }

    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error('Error fetching pages', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
    throw error;
  }
}

/**
 * Get page by slug
 */
export async function getPageBySlug(
  shopId: string,
  slug: string
): Promise<Page | null> {
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
    logger.error('Error fetching page by slug', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      slug,
    });
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
export async function updatePage(
  pageId: string,
  updates: Partial<Page>
): Promise<Page> {
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
    const { error } = await insforgeClient.database
      .from('pages')
      .delete()
      .eq('id', pageId);

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
    logger.error('Error fetching payment methods', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    logger.error('Error creating payment method', error instanceof Error ? error : new Error(String(error)), {
      shopId: methodData.shop_id,
    });
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
    logger.error('Error updating payment method', error instanceof Error ? error : new Error(String(error)), {
      methodId,
    });
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
    logger.error('Error fetching shipping methods', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    logger.error('Error creating shipping method', error instanceof Error ? error : new Error(String(error)), {
      shopId: methodData.shop_id,
    });
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
    logger.error('Error updating shipping method', error instanceof Error ? error : new Error(String(error)), {
      methodId,
    });
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
    logger.error('Error fetching tax rates', error instanceof Error ? error : new Error(String(error)), {
      shopId,
    });
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
    logger.error('Error creating tax rate', error instanceof Error ? error : new Error(String(error)), {
      shopId: rateData.shop_id,
    });
    throw error;
  }
}

/**
 * Update tax rate
 */
export async function updateTaxRate(
  rateId: string,
  updates: Partial<TaxRate>
): Promise<TaxRate> {
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
    logger.error('Error updating tax rate', error instanceof Error ? error : new Error(String(error)), {
      rateId,
    });
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
    let query = insforgeClient.database
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
    logger.error('Error calculating tax', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      country,
      state,
      city,
      postalCode,
    });
    return 0; // Default to 0 if error
  }
}


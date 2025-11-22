/**
 * Dynamic Tax Calculation Service
 * Supports region-based and product-based tax rates
 */

import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import { BadRequestError } from '@/lib/errors/api-errors';

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // 0 to 1 (0% to 100%)
  country: string;
  province?: string;
  postalCode?: string;
  taxableCategories?: string[];
  priority: number;
  isCompound: boolean; // For cascading taxes (e.g., Canada GST + PST)
  shopId: string;
}

export interface TaxCalculation {
  taxRate: number;
  taxAmount: number;
  taxName: string;
  breakdown: Array<{
    name: string;
    rate: number;
    amount: number;
    isCompound: boolean;
  }>;
}

export interface TaxableItem {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
  taxable: boolean;
}

export interface ShippingAddress {
  country: string;
  province?: string;
  postalCode?: string;
}

/**
 * Calculate tax for an order
 */
export async function calculateTax(
  shopId: string,
  items: TaxableItem[],
  shippingAddress: ShippingAddress,
  subtotal: number
): Promise<TaxCalculation> {
  const client = getSupabaseClient();

  try {
    // Get applicable tax rates for the shipping address
    const taxRates = await getApplicableTaxRates(shopId, shippingAddress);

    if (taxRates.length === 0) {
      // No tax rates configured - return zero tax
      return {
        taxRate: 0,
        taxAmount: 0,
        taxName: 'No Tax',
        breakdown: [],
      };
    }

    // Filter items that are taxable
    const taxableItems = items.filter((item) => item.taxable);

    if (taxableItems.length === 0) {
      return {
        taxRate: 0,
        taxAmount: 0,
        taxName: 'No Taxable Items',
        breakdown: [],
      };
    }

    // Calculate tax with compound support
    const breakdown: TaxCalculation['breakdown'] = [];
    let totalTaxAmount = 0;
    let baseAmount = subtotal;

    for (const taxRate of taxRates) {
      // Check if tax rate applies to any of the items
      const applicableItems = await filterItemsByTaxRate(taxableItems, taxRate);

      if (applicableItems.length === 0) {
        continue;
      }

      // Calculate tax for these items
      const itemsSubtotal = applicableItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // For compound taxes, base amount includes previous taxes
      const taxableAmount = taxRate.isCompound ? baseAmount : itemsSubtotal;
      const taxAmount = taxableAmount * taxRate.rate;

      breakdown.push({
        name: taxRate.name,
        rate: taxRate.rate,
        amount: taxAmount,
        isCompound: taxRate.isCompound,
      });

      totalTaxAmount += taxAmount;

      // Update base for compound taxes
      if (taxRate.isCompound) {
        baseAmount += taxAmount;
      }
    }

    const effectiveTaxRate = subtotal > 0 ? totalTaxAmount / subtotal : 0;

    return {
      taxRate: effectiveTaxRate,
      taxAmount: Math.round(totalTaxAmount * 100) / 100, // Round to 2 decimals
      taxName: breakdown.length === 1 ? breakdown[0].name : 'Multiple Taxes',
      breakdown,
    };
  } catch (error) {
    logger.error(
      'Tax calculation error',
      error instanceof Error ? error : new Error(String(error)),
      { shopId, shippingAddress }
    );
    throw new BadRequestError('Failed to calculate tax');
  }
}

/**
 * Get applicable tax rates for a shipping address
 */
async function getApplicableTaxRates(
  shopId: string,
  shippingAddress: ShippingAddress
): Promise<TaxRate[]> {
  const client = getSupabaseClient();

  try {
    // Query tax rates that match the shipping address
    // Priority order: postal code > province > country
    const { data: taxRates, error } = await client
      .from('tax_rates')
      .select('*')
      .eq('shop_id', shopId)
      .eq('country', shippingAddress.country.toUpperCase())
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    if (!taxRates || taxRates.length === 0) {
      return [];
    }

    // Filter by most specific match
    const filteredRates = taxRates.filter((rate: any) => {
      // Postal code match (most specific)
      if (rate.postal_code && shippingAddress.postalCode) {
        return rate.postal_code.toLowerCase() === shippingAddress.postalCode.toLowerCase();
      }

      // Province match
      if (rate.province && shippingAddress.province) {
        return rate.province.toLowerCase() === shippingAddress.province.toLowerCase();
      }

      // Country only match (no province/postal specified in rate)
      if (!rate.province && !rate.postal_code) {
        return true;
      }

      return false;
    });

    return filteredRates.map((rate: any) => ({
      id: rate.id,
      name: rate.name,
      rate: rate.rate,
      country: rate.country,
      province: rate.province,
      postalCode: rate.postal_code,
      taxableCategories: rate.taxable_categories,
      priority: rate.priority || 0,
      isCompound: rate.is_compound || false,
      shopId: rate.shop_id,
    }));
  } catch (error) {
    logger.error(
      'Error fetching tax rates',
      error instanceof Error ? error : new Error(String(error)),
      { shopId }
    );
    return [];
  }
}

/**
 * Filter items that a tax rate applies to
 */
async function filterItemsByTaxRate(
  items: TaxableItem[],
  taxRate: TaxRate
): Promise<TaxableItem[]> {
  // If no specific categories, tax applies to all items
  if (!taxRate.taxableCategories || taxRate.taxableCategories.length === 0) {
    return items;
  }

  // Filter items by category
  return items.filter((item) => {
    if (!item.categoryId) {
      // Items without category are taxable by default
      return true;
    }

    return taxRate.taxableCategories!.includes(item.categoryId);
  });
}

/**
 * Create or update tax rate
 */
export async function createTaxRate(
  shopId: string,
  taxRateData: Omit<TaxRate, 'id' | 'shopId'>
): Promise<TaxRate> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('tax_rates')
    .insert({
      shop_id: shopId,
      name: taxRateData.name,
      rate: taxRateData.rate,
      country: taxRateData.country.toUpperCase(),
      province: taxRateData.province,
      postal_code: taxRateData.postalCode,
      taxable_categories: taxRateData.taxableCategories,
      priority: taxRateData.priority || 0,
      is_compound: taxRateData.isCompound || false,
    })
    .select()
    .single();

  if (error) {
    const errorObj =
      error instanceof Error
        ? error
        : new Error((error as any)?.message || 'Failed to create tax rate');
    logger.error('Error creating tax rate', errorObj, { shopId });
    throw new BadRequestError('Failed to create tax rate');
  }

  return {
    id: data.id,
    name: data.name,
    rate: data.rate,
    country: data.country,
    province: data.province,
    postalCode: data.postal_code,
    taxableCategories: data.taxable_categories,
    priority: data.priority,
    isCompound: data.is_compound,
    shopId: data.shop_id,
  };
}

/**
 * Get tax rates for a shop
 */
export async function getTaxRates(shopId: string): Promise<TaxRate[]> {
  const client = getSupabaseClient();

  const { data: taxRates, error } = await client
    .from('tax_rates')
    .select('*')
    .eq('shop_id', shopId)
    .order('priority', { ascending: false });

  if (error) {
    const errorObj =
      error instanceof Error
        ? error
        : new Error((error as any)?.message || 'Failed to fetch tax rates');
    logger.error('Error fetching tax rates', errorObj, { shopId });
    throw new BadRequestError('Failed to fetch tax rates');
  }

  return (taxRates || []).map((rate: any) => ({
    id: rate.id,
    name: rate.name,
    rate: rate.rate,
    country: rate.country,
    province: rate.province,
    postalCode: rate.postal_code,
    taxableCategories: rate.taxable_categories,
    priority: rate.priority || 0,
    isCompound: rate.is_compound || false,
    shopId: rate.shop_id,
  }));
}

/**
 * Delete tax rate
 */
export async function deleteTaxRate(shopId: string, taxRateId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('tax_rates')
    .delete()
    .eq('id', taxRateId)
    .eq('shop_id', shopId);

  if (error) {
    const errorObj =
      error instanceof Error
        ? error
        : new Error((error as any)?.message || 'Failed to delete tax rate');
    logger.error('Error deleting tax rate', errorObj, { taxRateId });
    throw new BadRequestError('Failed to delete tax rate');
  }
}

/**
 * Common tax rate presets
 */
export const TAX_PRESETS = {
  // Bangladesh
  BD_VAT: {
    name: 'VAT',
    rate: 0.15, // 15%
    country: 'BD',
    priority: 0,
    isCompound: false,
  },

  // United States (example states)
  US_CA_SALES_TAX: {
    name: 'California Sales Tax',
    rate: 0.0725, // 7.25%
    country: 'US',
    province: 'CA',
    priority: 0,
    isCompound: false,
  },

  US_NY_SALES_TAX: {
    name: 'New York Sales Tax',
    rate: 0.04, // 4%
    country: 'US',
    province: 'NY',
    priority: 0,
    isCompound: false,
  },

  // Canada (compound taxes)
  CA_GST: {
    name: 'GST',
    rate: 0.05, // 5%
    country: 'CA',
    priority: 1,
    isCompound: false,
  },

  CA_BC_PST: {
    name: 'BC PST',
    rate: 0.07, // 7%
    country: 'CA',
    province: 'BC',
    priority: 0,
    isCompound: true, // Applied on top of GST
  },

  // European Union
  EU_STANDARD_VAT: {
    name: 'EU VAT',
    rate: 0.2, // 20% (varies by country)
    country: 'EU',
    priority: 0,
    isCompound: false,
  },
} as const;

// Global Search Service
// Search across products, orders, customers, and more
import { supabaseClient } from '../supabase';
import { logger } from '../utils/logger';

export interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'category' | 'promo';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  types?: Array<'product' | 'order' | 'customer' | 'category' | 'promo'>;
  limit?: number;
  shopId: string;
}

/**
 * Perform global search across multiple entity types
 */
export async function globalSearch(
  query: string,
  options: SearchOptions
): Promise<{ results: SearchResult[]; error: any }> {
  try {
    if (!query || query.trim().length < 2) {
      return { results: [], error: null };
    }

    const searchQuery = query.trim().toLowerCase();
    const types = options.types || ['product', 'order', 'customer', 'category', 'promo'];
    const limit = options.limit || 50;
    const results: SearchResult[] = [];

    // Search Products
    if (types.includes('product')) {
      const { data: products, error: productError } = await supabaseClient
        .from('products')
        .select('id, name, sku, price, description, images')
        .eq('shop_id', options.shopId)
        .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      if (!productError && products) {
        results.push(
          ...products.map((p) => ({
            id: p.id,
            type: 'product' as const,
            title: p.name,
            subtitle: `SKU: ${p.sku || 'N/A'} • ৳${p.price}`,
            description: p.description?.substring(0, 100),
            url: `/products/${p.id}`,
            imageUrl: p.images?.[0],
            metadata: { price: p.price, sku: p.sku },
          }))
        );
      }
    }

    // Search Orders
    if (types.includes('order')) {
      const { data: orders, error: orderError } = await supabaseClient
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, total_amount, status')
        .eq('shop_id', options.shopId)
        .or(
          `order_number.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`
        )
        .limit(limit);

      if (!orderError && orders) {
        results.push(
          ...orders.map((o) => ({
            id: o.id,
            type: 'order' as const,
            title: `Order #${o.order_number}`,
            subtitle: `${o.customer_name} • ৳${o.total_amount}`,
            description: `Status: ${o.status} • ${o.customer_phone}`,
            url: `/orders/${o.id}`,
            metadata: { status: o.status, total: o.total_amount },
          }))
        );
      }
    }

    // Search Customers
    if (types.includes('customer')) {
      const { data: customers, error: customerError } = await supabaseClient
        .from('customers')
        .select('id, name, email, phone, total_orders')
        .eq('shop_id', options.shopId)
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(limit);

      if (!customerError && customers) {
        results.push(
          ...customers.map((c) => ({
            id: c.id,
            type: 'customer' as const,
            title: c.name,
            subtitle: `${c.email || c.phone}`,
            description: `${c.total_orders || 0} orders`,
            url: `/customers?search=${c.id}`,
            metadata: { totalOrders: c.total_orders },
          }))
        );
      }
    }

    // Search Categories
    if (types.includes('category')) {
      const { data: categories, error: categoryError } = await supabaseClient
        .from('categories')
        .select('id, name, description, product_count')
        .eq('shop_id', options.shopId)
        .ilike('name', `%${searchQuery}%`)
        .limit(limit);

      if (!categoryError && categories) {
        results.push(
          ...categories.map((c) => ({
            id: c.id,
            type: 'category' as const,
            title: c.name,
            subtitle: `${c.product_count || 0} products`,
            description: c.description?.substring(0, 100),
            url: `/categories?id=${c.id}`,
            metadata: { productCount: c.product_count },
          }))
        );
      }
    }

    // Search Promo Codes
    if (types.includes('promo')) {
      const { data: promos, error: promoError } = await supabaseClient
        .from('discount_codes')
        .select('id, code, discount_type, discount_value, description')
        .eq('shop_id', options.shopId)
        .or(`code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      if (!promoError && promos) {
        results.push(
          ...promos.map((p) => ({
            id: p.id,
            type: 'promo' as const,
            title: p.code,
            subtitle: `${p.discount_type === 'percentage' ? `${p.discount_value}%` : `৳${p.discount_value}`} off`,
            description: p.description?.substring(0, 100),
            url: `/promos?id=${p.id}`,
            metadata: { type: p.discount_type, value: p.discount_value },
          }))
        );
      }
    }

    // Sort results by relevance (exact matches first)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery;
      const bExact = b.title.toLowerCase() === searchQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.title.toLowerCase().startsWith(searchQuery);
      const bStarts = b.title.toLowerCase().startsWith(searchQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    });

    return { results: sortedResults, error: null };
  } catch (err) {
    logger.error('Global search error', err instanceof Error ? err : new Error(String(err)));
    return { results: [], error: err };
  }
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  query: string,
  shopId: string,
  limit: number = 5
): Promise<{ suggestions: string[]; error: any }> {
  try {
    if (!query || query.trim().length < 2) {
      return { suggestions: [], error: null };
    }

    const searchQuery = query.trim().toLowerCase();
    const suggestions: string[] = [];

    // Get product name suggestions
    const { data: products } = await supabaseClient
      .from('products')
      .select('name')
      .eq('shop_id', shopId)
      .ilike('name', `%${searchQuery}%`)
      .limit(limit);

    if (products) {
      suggestions.push(...products.map((p) => p.name));
    }

    // Get unique suggestions
    return { suggestions: [...new Set(suggestions)].slice(0, limit), error: null };
  } catch (err) {
    logger.error('Search suggestions error', err instanceof Error ? err : new Error(String(err)));
    return { suggestions: [], error: err };
  }
}

/**
 * Log search query for analytics
 */
export async function logSearch(query: string, shopId: string, resultCount: number): Promise<void> {
  try {
    await supabaseClient.from('search_logs').insert({
      shop_id: shopId,
      query,
      result_count: resultCount,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Don't throw error, just log it
    logger.warn('Failed to log search', err instanceof Error ? err : new Error(String(err)));
  }
}

export default {
  globalSearch,
  getSearchSuggestions,
  logSearch,
};

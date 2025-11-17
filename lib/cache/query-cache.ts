/**
 * Query Cache Utilities
 *
 * Provides caching wrappers for common database queries
 */

import { cacheGetOrSet, cacheDelete, cacheDeletePattern } from './redis';

// Cache TTL configurations (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 1800, // 30 minutes - for rarely changing data
  VERY_LONG: 3600, // 1 hour - for static data
} as const;

// Cache key prefixes
export const CachePrefix = {
  PRODUCT: 'product:',
  PRODUCTS_LIST: 'products:list:',
  ORDER: 'order:',
  ORDERS_LIST: 'orders:list:',
  CUSTOMER: 'customer:',
  CUSTOMERS_LIST: 'customers:list:',
  CART: 'cart:',
  SHOP_SETTINGS: 'shop:settings:',
  ANALYTICS: 'analytics:',
  INVENTORY: 'inventory:',
} as const;

/**
 * Cache a single product
 */
export async function cacheProduct<T>(productId: string, fetchFn: () => Promise<T>): Promise<T> {
  const key = `${CachePrefix.PRODUCT}${productId}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.MEDIUM });
}

/**
 * Cache products list (with filters)
 */
export async function cacheProductsList<T>(
  shopId: string,
  filters: Record<string, any>,
  fetchFn: () => Promise<T>
): Promise<T> {
  const filterKey = JSON.stringify(filters);
  const key = `${CachePrefix.PRODUCTS_LIST}${shopId}:${filterKey}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.SHORT });
}

/**
 * Cache a single order
 */
export async function cacheOrder<T>(orderId: string, fetchFn: () => Promise<T>): Promise<T> {
  const key = `${CachePrefix.ORDER}${orderId}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.MEDIUM });
}

/**
 * Cache orders list (with filters)
 */
export async function cacheOrdersList<T>(
  shopId: string,
  filters: Record<string, any>,
  fetchFn: () => Promise<T>
): Promise<T> {
  const filterKey = JSON.stringify(filters);
  const key = `${CachePrefix.ORDERS_LIST}${shopId}:${filterKey}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.SHORT });
}

/**
 * Cache customer data
 */
export async function cacheCustomer<T>(customerId: string, fetchFn: () => Promise<T>): Promise<T> {
  const key = `${CachePrefix.CUSTOMER}${customerId}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.MEDIUM });
}

/**
 * Cache customers list
 */
export async function cacheCustomersList<T>(
  shopId: string,
  filters: Record<string, any>,
  fetchFn: () => Promise<T>
): Promise<T> {
  const filterKey = JSON.stringify(filters);
  const key = `${CachePrefix.CUSTOMERS_LIST}${shopId}:${filterKey}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.MEDIUM });
}

/**
 * Cache cart data
 */
export async function cacheCart<T>(cartId: string, fetchFn: () => Promise<T>): Promise<T> {
  const key = `${CachePrefix.CART}${cartId}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.SHORT });
}

/**
 * Cache shop settings
 */
export async function cacheShopSettings<T>(shopId: string, fetchFn: () => Promise<T>): Promise<T> {
  const key = `${CachePrefix.SHOP_SETTINGS}${shopId}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.VERY_LONG });
}

/**
 * Cache analytics data
 */
export async function cacheAnalytics<T>(
  shopId: string,
  metricName: string,
  filters: Record<string, any>,
  fetchFn: () => Promise<T>
): Promise<T> {
  const filterKey = JSON.stringify(filters);
  const key = `${CachePrefix.ANALYTICS}${shopId}:${metricName}:${filterKey}`;
  return cacheGetOrSet(key, fetchFn, { ttl: CacheTTL.MEDIUM });
}

/**
 * Invalidate product cache
 */
export async function invalidateProductCache(productId: string): Promise<void> {
  await cacheDelete(`${CachePrefix.PRODUCT}${productId}`);
  // Also invalidate all product lists
  await cacheDeletePattern(`${CachePrefix.PRODUCTS_LIST}*`);
}

/**
 * Invalidate order cache
 */
export async function invalidateOrderCache(orderId: string, shopId?: string): Promise<void> {
  await cacheDelete(`${CachePrefix.ORDER}${orderId}`);
  // Invalidate order lists for this shop
  if (shopId) {
    await cacheDeletePattern(`${CachePrefix.ORDERS_LIST}${shopId}:*`);
  }
}

/**
 * Invalidate customer cache
 */
export async function invalidateCustomerCache(customerId: string, shopId?: string): Promise<void> {
  await cacheDelete(`${CachePrefix.CUSTOMER}${customerId}`);
  // Invalidate customer lists for this shop
  if (shopId) {
    await cacheDeletePattern(`${CachePrefix.CUSTOMERS_LIST}${shopId}:*`);
  }
}

/**
 * Invalidate cart cache
 */
export async function invalidateCartCache(cartId: string): Promise<void> {
  await cacheDelete(`${CachePrefix.CART}${cartId}`);
}

/**
 * Invalidate shop settings cache
 */
export async function invalidateShopSettingsCache(shopId: string): Promise<void> {
  await cacheDelete(`${CachePrefix.SHOP_SETTINGS}${shopId}`);
}

/**
 * Invalidate all analytics cache for a shop
 */
export async function invalidateAnalyticsCache(shopId: string): Promise<void> {
  await cacheDeletePattern(`${CachePrefix.ANALYTICS}${shopId}:*`);
}

/**
 * Invalidate all cache for a shop
 */
export async function invalidateShopCache(shopId: string): Promise<void> {
  await Promise.all([
    cacheDeletePattern(`${CachePrefix.PRODUCTS_LIST}${shopId}:*`),
    cacheDeletePattern(`${CachePrefix.ORDERS_LIST}${shopId}:*`),
    cacheDeletePattern(`${CachePrefix.CUSTOMERS_LIST}${shopId}:*`),
    cacheDeletePattern(`${CachePrefix.ANALYTICS}${shopId}:*`),
    invalidateShopSettingsCache(shopId),
  ]);
}

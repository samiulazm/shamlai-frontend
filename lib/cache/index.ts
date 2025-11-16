/**
 * Cache Module Index
 *
 * Re-exports all cache utilities for easy importing
 */

export {
  initializeRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheClear,
  cacheGetOrSet,
  getCacheStats,
  resetCacheStats,
  isRedisConnected,
  closeRedis,
  type CacheOptions,
  type CacheStats,
} from './redis';

export {
  CacheTTL,
  CachePrefix,
  cacheProduct,
  cacheProductsList,
  cacheOrder,
  cacheOrdersList,
  cacheCustomer,
  cacheCustomersList,
  cacheCart,
  cacheShopSettings,
  cacheAnalytics,
  invalidateProductCache,
  invalidateOrderCache,
  invalidateCustomerCache,
  invalidateCartCache,
  invalidateShopSettingsCache,
  invalidateAnalyticsCache,
  invalidateShopCache,
} from './query-cache';

/**
 * Redis Cache Constants
 *
 * These constants can be imported anywhere (client or server).
 * The actual caching implementation is in redis.ts and is server-only.
 */

/**
 * Redis key prefixes for organization
 */
export const REDIS_KEYS = {
  // Rate limiting
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  RATE_LIMIT_API: (ip: string, endpoint: string) => `rate_limit:api:${ip}:${endpoint}`,

  // Caching
  PRODUCT: (id: string) => `cache:product:${id}`,
  PRODUCT_LIST: (shopId: string, page: number) => `cache:products:${shopId}:page:${page}`,
  SHOP: (id: string) => `cache:shop:${id}`,
  SHOP_BY_SUBDOMAIN: (subdomain: string) => `cache:shop:subdomain:${subdomain}`,
  CART: (id: string) => `cache:cart:${id}`,
  ORDER: (id: string) => `cache:order:${id}`,

  // Session data
  SESSION: (userId: string) => `session:${userId}`,

  // Analytics
  ANALYTICS_COUNTER: (metric: string, date: string) => `analytics:${metric}:${date}`,
} as const;

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CACHE_TTL = {
  PRODUCT: 5 * 60, // 5 minutes
  PRODUCT_LIST: 3 * 60, // 3 minutes
  SHOP: 30 * 60, // 30 minutes
  CART: 60 * 60, // 1 hour
  ORDER: 10 * 60, // 10 minutes
  SESSION: 24 * 60 * 60, // 24 hours
  RATE_LIMIT: 60, // 1 minute
} as const;

// Types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300 = 5 minutes)
  prefix?: string; // Cache key prefix
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
}

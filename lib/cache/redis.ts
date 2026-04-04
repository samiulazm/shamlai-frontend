/**
 * Redis Cache Implementation
 *
 * Provides a caching layer for database queries to improve performance.
 * Falls back gracefully to no-cache mode if Redis is unavailable.
 *
 * NOTE: This module uses ioredis which is server-only. The webpack config
 * in next.config.mjs excludes it from client bundles.
 */

import { Redis } from 'ioredis';
import { getIoredisConnectionOptions } from '../redis/ioredis-options';

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
  SHOP: 60 * 60, // 1 hour
  SHOP_SUBDOMAIN: 60 * 60, // 1 hour
  CART: 24 * 60 * 60, // 24 hours
  ORDER: 30 * 60, // 30 minutes
  RATE_LIMIT: 60, // 1 minute
  SESSION: 7 * 24 * 60 * 60, // 7 days
} as const;

// Cache configuration
const DEFAULT_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'shamlai:';

// Redis client instance
let redisClient: Redis | null = null;
let isRedisAvailable = false;

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

/**
 * Initialize Redis connection
 */
export function initializeRedis(): void {
  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('Redis cache disabled: REDIS_URL not configured');
      return;
    }

    redisClient = new Redis(redisUrl, {
      ...getIoredisConnectionOptions(),
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    // Event handlers
    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (error: Error) => {
      console.error('Redis error:', error.message);
      isRedisAvailable = false;
      stats.errors++;
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed');
      isRedisAvailable = false;
    });

    // Connect to Redis
    redisClient.connect().catch((error: Error) => {
      console.error('Failed to connect to Redis:', error.message);
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    redisClient = null;
    isRedisAvailable = false;
  }
}

/**
 * Generate cache key
 */
function getCacheKey(key: string, prefix?: string): string {
  const finalPrefix = prefix || CACHE_PREFIX;
  return `${finalPrefix}${key}`;
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string, options?: CacheOptions): Promise<T | null> {
  if (!redisClient || !isRedisAvailable) {
    stats.misses++;
    return null;
  }

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      stats.hits++;
      return JSON.parse(cached) as T;
    }

    stats.misses++;
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    stats.errors++;
    stats.misses++;
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
  if (!redisClient || !isRedisAvailable) {
    return false;
  }

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const ttl = options?.ttl || DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    await redisClient.setex(cacheKey, ttl, serialized);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    stats.errors++;
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string, options?: CacheOptions): Promise<boolean> {
  if (!redisClient || !isRedisAvailable) {
    return false;
  }

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    stats.errors++;
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function cacheDeletePattern(pattern: string, options?: CacheOptions): Promise<number> {
  if (!redisClient || !isRedisAvailable) {
    return 0;
  }

  try {
    const cachePattern = getCacheKey(pattern, options?.prefix);
    const keys = await redisClient.keys(cachePattern);

    if (keys.length === 0) {
      return 0;
    }

    await redisClient.del(...keys);
    return keys.length;
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    stats.errors++;
    return 0;
  }
}

/**
 * Clear all cache
 */
export async function cacheClear(): Promise<boolean> {
  if (!redisClient || !isRedisAvailable) {
    return false;
  }

  try {
    await redisClient.flushdb();
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    stats.errors++;
    return false;
  }
}

/**
 * Get or set cache (fetch pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (fire and forget)
  cacheSet(key, data, options).catch((error) => {
    console.error('Background cache set failed:', error);
  });

  return data;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? (stats.hits / total) * 100 : 0;

  return {
    hits: stats.hits,
    misses: stats.misses,
    errors: stats.errors,
    hitRate: Math.round(hitRate * 100) / 100,
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.errors = 0;
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}

// Initialize Redis on module load (server-side only)
if (typeof window === 'undefined') {
  initializeRedis();
}

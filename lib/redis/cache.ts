/**
 * Redis Caching Utilities
 * Provides high-level caching functions with automatic serialization
 */

import { getRedisClient, CACHE_TTL, isRedisAvailable } from './client';

/**
 * Generic cache get with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const redis = await getRedisClient();
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    // Handle both string and already-parsed objects
    return typeof cached === 'string' ? JSON.parse(cached) : cached;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Generic cache set with automatic JSON serialization
 */
export async function setCached(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = await getRedisClient();
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }

    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = await getRedisClient();
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const redis = await getRedisClient();
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.error(`Cache pattern delete error for pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Cache-aside pattern: Get from cache or execute function and cache result
 */
export async function cacheAside<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.PRODUCT
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetchFunction();

  // Store in cache for next time (don't await - fire and forget)
  setCached(key, data, ttlSeconds).catch((err) => {
    console.error('Failed to cache data:', err);
  });

  return data;
}

/**
 * Get multiple cached values at once
 */
export async function getCachedMultiple<T>(keys: string[]): Promise<(T | null)[]> {
  if (!isRedisAvailable() || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const redis = await getRedisClient();
    const values = await redis.mget(...keys);

    return values.map((val) => {
      if (!val) return null;
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return null;
      }
    });
  } catch (error) {
    console.error('Cache mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Increment a counter in cache (useful for analytics)
 */
export async function incrementCounter(key: string, ttlSeconds?: number): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const redis = await getRedisClient();
    const newValue = await redis.incr(key);

    // Set TTL on first increment
    if (newValue === 1 && ttlSeconds) {
      await redis.expire(key, ttlSeconds);
    }

    return typeof newValue === 'number' ? newValue : parseInt(String(newValue));
  } catch (error) {
    console.error(`Counter increment error for key ${key}:`, error);
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function existsInCache(key: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = await getRedisClient();
    const exists = await redis.exists(key);
    return exists > 0;
  } catch (error) {
    console.error(`Cache exists check error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function getTTL(key: string): Promise<number> {
  if (!isRedisAvailable()) {
    return -1;
  }

  try {
    const redis = await getRedisClient();
    const ttl = await redis.ttl(key);
    return typeof ttl === 'number' ? ttl : parseInt(String(ttl));
  } catch (error) {
    console.error(`TTL check error for key ${key}:`, error);
    return -1;
  }
}

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  product: (productId: string) => deleteCached(`cache:product:${productId}`),
  productList: (shopId: string) => deleteCachedPattern(`cache:products:${shopId}:*`),
  shop: (shopId: string) => deleteCached(`cache:shop:${shopId}`),
  shopBySubdomain: (subdomain: string) => deleteCached(`cache:shop:subdomain:${subdomain}`),
  cart: (cartId: string) => deleteCached(`cache:cart:${cartId}`),
  order: (orderId: string) => deleteCached(`cache:order:${orderId}`),
  all: () => deleteCachedPattern('cache:*'),
};

/**
 * Redis Client Configuration
 * Supports both Upstash Redis (serverless) and standard Redis
 *
 * IMPORTANT: This module uses dynamic imports to prevent server-only
 * packages (ioredis) from being bundled in client-side code.
 */

import type { Redis } from '@upstash/redis';
import type IORedis from 'ioredis';

// Redis client instance (singleton)
let redisClient: Redis | IORedis | null = null;

/**
 * Get or create Redis client
 * Automatically detects Upstash vs standard Redis based on env vars
 *
 * NOTE: This function uses dynamic imports to avoid importing ioredis
 * at the module level, which would break client-side builds.
 */
export async function getRedisClient(): Promise<Redis | IORedis> {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Redis client cannot be used on the client side');
  }

  if (redisClient) {
    return redisClient;
  }

  // Option 1: Upstash Redis (recommended for serverless/Vercel)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis: UpstashRedis } = await import('@upstash/redis');
    redisClient = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Redis client initialized (Upstash)');
    return redisClient;
  }

  // Option 2: Standard Redis connection string
  if (process.env.REDIS_URL) {
    const IORedisModule = await import('ioredis');
    const IORedisConstructor = IORedisModule.default;

    redisClient = new IORedisConstructor(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected (Standard Redis)');
    });

    return redisClient;
  }

  // No Redis configured - throw error in production, warn in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Redis not configured. Set UPSTASH_REDIS_REST_URL/TOKEN or REDIS_URL environment variables.'
    );
  }

  console.warn('⚠️  Redis not configured. Caching disabled in development mode.');
  // Return a mock client for development
  return createMockRedisClient();
}

/**
 * Mock Redis client for development when Redis is not available
 */
function createMockRedisClient(): any {
  const store = new Map<string, any>();

  return {
    get: async (key: string) => {
      const value = store.get(key);
      return value !== undefined ? JSON.stringify(value) : null;
    },
    set: async (key: string, value: any, options?: any) => {
      store.set(key, typeof value === 'string' ? JSON.parse(value) : value);
      if (options?.ex) {
        setTimeout(() => store.delete(key), options.ex * 1000);
      }
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    incr: async (key: string) => {
      const current = store.get(key) || 0;
      store.set(key, current + 1);
      return current + 1;
    },
    expire: async (key: string, seconds: number) => {
      setTimeout(() => store.delete(key), seconds * 1000);
      return 1;
    },
    ttl: async () => -1,
    exists: async (key: string) => (store.has(key) ? 1 : 0),
    keys: async (pattern: string) => {
      // Simple pattern matching for development
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return Array.from(store.keys()).filter((k) => regex.test(k));
    },
    mget: async (...keys: string[]) => {
      return keys.map((key) => {
        const value = store.get(key);
        return value !== undefined ? JSON.stringify(value) : null;
      });
    },
    pipeline: () => ({
      get: () => ({}),
      set: () => ({}),
      exec: async () => [],
    }),
  };
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL);
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && 'disconnect' in redisClient) {
    await (redisClient as IORedis).disconnect();
    redisClient = null;
    console.log('Redis connection closed');
  }
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

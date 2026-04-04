/**
 * Redis Client Configuration
 * Supports both Upstash Redis (serverless) and standard Redis
 *
 * IMPORTANT: This module uses dynamic imports to prevent server-only
 * packages (ioredis) from being bundled in client-side code.
 */

import type { Redis } from '@upstash/redis';
import type IORedis from 'ioredis';
import { REDIS_KEYS, CACHE_TTL } from '../cache/redis';
import { getIoredisConnectionOptions } from './ioredis-options';

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

  // Option 2: Standard Redis / Render Key Value (redis:// or rediss:// + ioredis)
  if (process.env.REDIS_URL) {
    const IORedisModule = await import('ioredis');
    const IORedisConstructor = IORedisModule.default;

    redisClient = new IORedisConstructor(process.env.REDIS_URL, getIoredisConnectionOptions());

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis client connected (REDIS_URL / ioredis)');
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
export { REDIS_KEYS, CACHE_TTL };

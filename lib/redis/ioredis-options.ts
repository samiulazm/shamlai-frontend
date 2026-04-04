import type { RedisOptions } from 'ioredis';

/**
 * Connection options for ioredis against Render managed Redis / Key Value and other
 * Redis-compatible hosts. Render typically provides `rediss://` (TLS) URLs.
 *
 * @see https://render.com/docs/redis
 */
export function getIoredisConnectionOptions(): RedisOptions {
  const url = process.env.REDIS_URL || '';
  const useTls =
    url.startsWith('rediss://') ||
    process.env.REDIS_TLS === '1' ||
    process.env.REDIS_TLS === 'true';

  return {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    connectTimeout: 15000,
    // Hosted Redis (incl. Render Key Value) sometimes misbehaves with READY checks
    enableReadyCheck: false,
    ...(useTls && {
      tls: {
        rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    }),
  };
}

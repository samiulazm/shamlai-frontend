/**
 * Redis-based Rate Limiter
 * Replaces in-memory rate limiting for scalability across multiple instances
 */

import { getRedisClient, REDIS_KEYS, isRedisAvailable } from './client';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional custom identifier (defaults to IP address)
   */
  identifier?: string;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Current request count in the window
   */
  current: number;

  /**
   * Maximum requests allowed
   */
  limit: number;

  /**
   * Remaining requests in the window
   */
  remaining: number;

  /**
   * Time until the window resets (in seconds)
   */
  resetIn: number;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // General API requests
  API_DEFAULT: {
    limit: 100,
    windowSeconds: 60, // 100 requests per minute
  },
  // Authentication endpoints (stricter)
  AUTH: {
    limit: 5,
    windowSeconds: 60, // 5 requests per minute
  },
  // Checkout/payment endpoints (very strict)
  CHECKOUT: {
    limit: 10,
    windowSeconds: 300, // 10 requests per 5 minutes
  },
  // Product listing (more lenient)
  PRODUCT_LIST: {
    limit: 200,
    windowSeconds: 60, // 200 requests per minute
  },
  // Cart operations
  CART: {
    limit: 50,
    windowSeconds: 60, // 50 requests per minute
  },
} as const;

/**
 * Check rate limit using sliding window algorithm
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // If Redis is not available, allow all requests (fail open)
  if (!isRedisAvailable()) {
    console.warn('Rate limiting disabled: Redis not available');
    return {
      allowed: true,
      current: 0,
      limit: config.limit,
      remaining: config.limit,
      resetIn: 0,
    };
  }

  try {
    const redis = getRedisClient();
    const key = REDIS_KEYS.RATE_LIMIT(identifier);

    // Increment the counter
    const current = await redis.incr(key);
    const currentNum = typeof current === 'number' ? current : parseInt(String(current));

    // Set expiration on first request
    if (currentNum === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    // Get remaining TTL
    const ttl = await redis.ttl(key);
    const ttlNum = typeof ttl === 'number' ? ttl : parseInt(String(ttl));
    const resetIn = ttlNum > 0 ? ttlNum : config.windowSeconds;

    const allowed = currentNum <= config.limit;
    const remaining = Math.max(0, config.limit - currentNum);

    return {
      allowed,
      current: currentNum,
      limit: config.limit,
      remaining,
      resetIn,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow the request if there's an error
    return {
      allowed: true,
      current: 0,
      limit: config.limit,
      remaining: config.limit,
      resetIn: 0,
    };
  }
}

/**
 * Rate limit middleware helper for API routes
 */
export async function rateLimitAPI(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): Promise<RateLimitResult> {
  const key = `${identifier}:${endpoint}`;
  return checkRateLimit(key, config);
}

/**
 * Get rate limit info without incrementing
 */
export async function getRateLimitInfo(identifier: string): Promise<{
  current: number;
  ttl: number;
} | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const redis = getRedisClient();
    const key = REDIS_KEYS.RATE_LIMIT(identifier);

    const current = await redis.get(key);
    const ttl = await redis.ttl(key);

    return {
      current: current ? parseInt(String(current)) : 0,
      ttl: typeof ttl === 'number' ? ttl : parseInt(String(ttl)),
    };
  } catch (error) {
    console.error('Rate limit info error:', error);
    return null;
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const redis = getRedisClient();
    const key = REDIS_KEYS.RATE_LIMIT(identifier);
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return false;
  }
}

/**
 * Get client IP from request headers (works with proxies/load balancers)
 */
export function getClientIP(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to a placeholder (should rarely happen)
  return 'unknown';
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Date.now() + result.resetIn * 1000),
    'Retry-After': String(result.resetIn),
  };
}

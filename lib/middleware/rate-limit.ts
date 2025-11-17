/**
 * Rate Limiting Middleware for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/redis/rate-limiter';

/**
 * Apply rate limiting to API route handler
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT,
  identifier?: string
): Promise<NextResponse | null> {
  // Get client identifier (IP address by default)
  const clientIP = identifier || getClientIP(request.headers);

  // Check rate limit
  const result = await checkRateLimit(clientIP, config);

  // If rate limited, return 429 response
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
        limit: result.limit,
        remaining: 0,
        resetIn: result.resetIn,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  // Request allowed - return null to continue
  return null;
}

/**
 * Rate limit helper for different endpoint types
 */
export const rateLimitEndpoint = {
  /**
   * Rate limit for authentication endpoints (stricter)
   */
  auth: (request: NextRequest) => withRateLimit(request, RATE_LIMITS.AUTH),

  /**
   * Rate limit for checkout/payment endpoints (very strict)
   */
  checkout: (request: NextRequest) => withRateLimit(request, RATE_LIMITS.CHECKOUT),

  /**
   * Rate limit for product listing endpoints (more lenient)
   */
  products: (request: NextRequest) => withRateLimit(request, RATE_LIMITS.PRODUCT_LIST),

  /**
   * Rate limit for cart operations
   */
  cart: (request: NextRequest) => withRateLimit(request, RATE_LIMITS.CART),

  /**
   * Default API rate limit
   */
  default: (request: NextRequest) => withRateLimit(request, RATE_LIMITS.API_DEFAULT),
};

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetIn: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn * 1000));

  return response;
}

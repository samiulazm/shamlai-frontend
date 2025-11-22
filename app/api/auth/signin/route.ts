import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { validateBody } from '@/lib/validation/validator';
import { signinSchema } from '@/lib/validation/schemas';
import { withErrorHandler, UnauthorizedError } from '@/lib/errors/api-errors';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { rateLimitEndpoint } from '@/lib/middleware/rate-limit';
import { auditAuthEvent, AuditAction } from '@/lib/services/audit';
import { getClientIP } from '@/lib/redis/rate-limiter';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client for server-side use (no mixed content issues here)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || '');

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting (5 requests per minute)
  const rateLimitResponse = await rateLimitEndpoint.auth(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const { email, password, rememberMe } = await validateBody(request, signinSchema);

  // Use the Supabase SDK directly (server-side, no mixed content issues)
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data) {
    // Audit failed login attempt
    const ip = getClientIP(request.headers);
    const errorMessage = error
      ? error instanceof Error
        ? error.message
        : String(error)
      : 'Unknown error';
    await auditAuthEvent(AuditAction.FAILED_LOGIN, 'unknown', email, {
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      reason: errorMessage,
    });

    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    logger.warn('Failed signin attempt', errorObj, {
      email,
      ip,
    });

    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // Audit successful login
  const ip = getClientIP(request.headers);
  await auditAuthEvent(AuditAction.LOGIN, data.user.id, email, {
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  logger.info('User signin successful', { email, userId: data.user.id });

  // Create response with user data
  const response = NextResponse.json(data, { status: 200 });

  // Set access token in cookie with SECURE settings
  if (data?.session?.access_token) {
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days if remember me, else 7 days

    response.cookies.set('supabase_access_token', data.session.access_token, {
      httpOnly: true, // SECURITY FIX: Prevent XSS attacks by making cookie inaccessible to JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: cookieMaxAge,
      path: '/',
    });
  }

  return response;
});

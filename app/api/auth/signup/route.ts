import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { validateBody } from '@/lib/validation/validator';
import { signupSchema } from '@/lib/validation/schemas';
import { withErrorHandler, ConflictError, BadRequestError } from '@/lib/errors/api-errors';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { rateLimitEndpoint } from '@/lib/middleware/rate-limit';
import { getClientIP } from '@/lib/redis/rate-limiter';

// Use fallback pattern consistent with lib/supabase.ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.INSFORGE_SERVICE_ROLE_KEY;

// Create Supabase client for server-side use
const supabaseClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY) : null;
// Create admin client with service role key (bypasses RLS and email confirmation)
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.auth(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check if Supabase client is available
  if (!supabaseClient) {
    throw new Error('Supabase client is not configured');
  }

  // Validate request body
  const { email, password, shopName, phone } = await validateBody(request, signupSchema);

  // Try to use admin client for auto-confirmed signup if available
  let data, error;

  if (supabaseAdmin) {
    // Use admin client to create user with email auto-confirmed
    const signupResult = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        shopName: shopName || undefined,
        phone: phone || undefined,
      },
    });

    if (signupResult.error) {
      error = signupResult.error;
    } else {
      // Now sign in the user to get a session
      const signInResult = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      data = signInResult.data;
      error = signInResult.error;
    }
  } else {
    // Fallback to regular signup (will require email confirmation if enabled)
    const signupResult = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          shopName: shopName || undefined,
          phone: phone || undefined,
        },
      },
    });

    data = signupResult.data;
    error = signupResult.error;
  }

  if (error) {
    const ip = getClientIP(request.headers);
    const errorObj =
      error instanceof Error ? error : new Error((error as any)?.message || 'Unknown error');
    logger.warn('Signup failed', errorObj, {
      email,
      ip,
    });

    // Handle specific error cases
    if (
      error.message?.includes('already registered') ||
      error.message?.includes('already exists') ||
      error.message?.includes('already been registered')
    ) {
      throw new ConflictError(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    throw new BadRequestError(error.message || 'Failed to create account');
  }

  if (!data?.user) {
    throw new BadRequestError('Failed to create account');
  }

  // Check if we have a session (required for immediate login)
  if (!data.session) {
    throw new BadRequestError(
      'Email confirmation is required. Please check your email and confirm your account, then try logging in.'
    );
  }

  // Validate session has access token
  if (!data.session.access_token) {
    throw new BadRequestError('Failed to generate access token. Please try again.');
  }

  logger.info('User signup successful', { email, userId: data.user.id });

  // Transform response to match frontend expectations
  const response = {
    user: data.user,
    session: data.session,
    accessToken: data.session.access_token,
  };

  return NextResponse.json(response, { status: 201 });
});

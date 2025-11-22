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

// Create Supabase client for server-side use
const supabaseClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY) : null;

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

  // Use Supabase SDK to sign up the user
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        shopName: shopName || undefined,
        phone: phone || undefined,
      },
    },
  });

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
      error.message?.includes('already exists')
    ) {
      throw new ConflictError(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    throw new BadRequestError(error.message || 'Failed to create account');
  }

  if (!data?.user) {
    throw new BadRequestError('Failed to create account');
  }

  logger.info('User signup successful', { email, userId: data.user.id });
  return NextResponse.json(data, { status: 201 });
});

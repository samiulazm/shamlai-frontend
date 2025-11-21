import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { validateBody } from '@/lib/validation/validator';
import { signupSchema } from '@/lib/validation/schemas';
import { withErrorHandler, ConflictError, BadRequestError } from '@/lib/errors/api-errors';
import { ERROR_MESSAGES } from '@/lib/errors/error-messages';
import { rateLimitEndpoint } from '@/lib/middleware/rate-limit';
import { getClientIP } from '@/lib/redis/rate-limiter';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitEndpoint.auth(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const { email, password, shopName, phone } = await validateBody(request, signupSchema);

  // Proxy the signup request to InsForge backend
  const response = await fetch(`${INSFORGE_URL}/api/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(INSFORGE_ANON_KEY && { Authorization: `Bearer ${INSFORGE_ANON_KEY}` }),
    },
    body: JSON.stringify({
      email,
      password,
      phone,
      metadata: shopName ? { shopName } : undefined,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const ip = getClientIP(request.headers);
    logger.warn('Signup failed', {
      status: response.status,
      email,
      ip,
      error: data.error || data.message,
    });

    // Handle specific error cases
    if (response.status === 409 || data.error?.includes('already exists')) {
      throw new ConflictError(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    throw new BadRequestError(data.error || data.message || 'Failed to create account');
  }

  logger.info('User signup successful', { email, userId: data.user?.id });
  return NextResponse.json(data, { status: 201 });
});

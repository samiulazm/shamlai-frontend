import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

// Create InsForge client for server-side use (no mixed content issues here)
const insforgeClient = createClient({
  baseUrl: INSFORGE_URL,
  ...(INSFORGE_ANON_KEY && { anonKey: INSFORGE_ANON_KEY }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Use the InsForge SDK directly (server-side, no mixed content issues)
    const { data, error } = await insforgeClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Signin failed', error instanceof Error ? error : new Error(String(error)), {
        email,
        errorMessage: error.message,
      });

      // Return appropriate error message
      let errorMessage = error.message || 'Invalid credentials';
      if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
        errorMessage = 'NOT_FOUND';
      }

      return NextResponse.json({ error: errorMessage }, { status: (error as any).status || 401 });
    }

    logger.info('User signin successful', { email });

    // Create response with user data
    const response = NextResponse.json(data, { status: 200 });

    // Set access token in cookie so it can be used for subsequent requests
    if (data?.accessToken) {
      response.cookies.set('insforge_access_token', data.accessToken, {
        httpOnly: false, // Allow client-side JavaScript to read it if needed
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    logger.error('Signin API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error.message || 'An error occurred during signin' },
      { status: 500 }
    );
  }
}

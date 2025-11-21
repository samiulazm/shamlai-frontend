import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  'http://119.40.88.49:7130';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

// Create Supabase client for server-side use
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || '');

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie, Authorization header, or query parameter
    const accessToken =
      request.cookies.get('supabase_access_token')?.value ||
      request.cookies.get('insforge_access_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('token');

    if (!accessToken) {
      // Return 401 but don't log as error - this is expected for unauthenticated users
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Decode JWT token to extract user information
    // JWT structure: header.payload.signature
    try {
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode the payload (base64url)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }

      // Extract user info from payload
      const user = {
        id: payload.sub || payload.userId || payload.user_id,
        email: payload.email,
        role: payload.role || 'authenticated',
      };

      if (!user.id) {
        throw new Error('No user ID in token');
      }

      // Return user data in the same format as SDK's getCurrentUser
      return NextResponse.json(
        {
          user,
          profile: {
            role: payload.role || 'merchant',
          },
        },
        { status: 200 }
      );
    } catch (decodeError: any) {
      logger.error(
        'Token decode failed',
        decodeError instanceof Error ? decodeError : new Error(String(decodeError))
      );
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error: any) {
    logger.error('Get user API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

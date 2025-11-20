import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

// Create InsForge client for server-side use
const insforgeClient = createClient({
  baseUrl: INSFORGE_URL,
  ...(INSFORGE_ANON_KEY && { anonKey: INSFORGE_ANON_KEY }),
});

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie, Authorization header, or query parameter
    const accessToken =
      request.cookies.get('insforge_access_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '') ||
      request.nextUrl.searchParams.get('token');

    if (!accessToken) {
      // Return 401 but don't log as error - this is expected for unauthenticated users
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Make a direct HTTP request to the backend to verify the token
    // This is more reliable than using SDK's getCurrentUser which expects an established session
    const response = await fetch(`${INSFORGE_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error(
        'Get user failed',
        new Error(`Backend returned ${response.status}: ${response.statusText}`)
      );
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await response.json();

    if (!data?.user) {
      logger.error('Get user failed', new Error('No user data in response'));
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    logger.error('Get user API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

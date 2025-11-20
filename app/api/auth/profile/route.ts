import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, ...otherFields } = body;

    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Proxy the profile update request to InsForge backend
    const response = await fetch(`${INSFORGE_URL}/api/auth/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        ...(INSFORGE_ANON_KEY && { 'X-InsForge-Anon-Key': INSFORGE_ANON_KEY }),
      },
      body: JSON.stringify({
        nickname,
        ...otherFields,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Profile update failed', new Error(data.error || 'Unknown error'), {
        status: response.status,
      });
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to update profile' },
        { status: response.status }
      );
    }

    logger.info('Profile updated successfully');
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    logger.error('Profile API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error.message || 'An error occurred during profile update' },
      { status: 500 }
    );
  }
}

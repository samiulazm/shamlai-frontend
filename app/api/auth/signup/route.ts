import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Signup failed', new Error(data.error || 'Unknown error'), {
        status: response.status,
        email,
      });
      return NextResponse.json(
        { error: data.error || data.message || 'Failed to create account' },
        { status: response.status }
      );
    }

    logger.info('User signup successful', { email });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    logger.error('Signup API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error.message || 'An error occurred during signup' },
      { status: 500 }
    );
  }
}

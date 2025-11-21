import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_INSFORGE_URL ||
  'http://119.40.88.49:7130';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, ...otherFields } = body;

    // Get auth token from request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create authenticated Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || '', {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Update user metadata (Supabase stores user metadata in auth.users.raw_user_meta_data)
    const { data: user, error } = await supabaseClient.auth.updateUser({
      data: {
        nickname: nickname || undefined,
        ...otherFields,
      },
    });

    if (error) {
      logger.error(
        'Profile update failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          error: error.message,
        }
      );
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: error.status || 500 }
      );
    }

    logger.info('Profile updated successfully', { userId: user.user?.id });
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    logger.error('Profile API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error.message || 'An error occurred during profile update' },
      { status: 500 }
    );
  }
}

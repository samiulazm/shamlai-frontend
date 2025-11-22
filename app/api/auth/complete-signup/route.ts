import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Complete user signup by creating shop settings
 * This endpoint should be called AFTER user account creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, shopName, subdomain, email, accessToken } = body;

    // Validate required fields
    if (!userId || !subdomain || !email || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subdomain, email, accessToken' },
        { status: 400 }
      );
    }

    // Create authenticated client
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    // Check if shop settings already exist for this user
    const { data: existingShop } = await supabaseClient
      .from('shop_settings')
      .select('shop_id')
      .eq('user_id', userId)
      .single();

    if (existingShop) {
      logger.info('Shop already exists for user', { userId, shopId: existingShop.shop_id });
      return NextResponse.json(
        {
          success: true,
          shopId: existingShop.shop_id,
          message: 'Shop already exists',
        },
        { status: 200 }
      );
    }

    // Generate unique shop ID (UUID format)
    const shopId = crypto.randomUUID();

    // Create shop settings in a single transaction
    const { data: newShop, error: shopError } = await supabaseClient
      .from('shop_settings')
      .insert([
        {
          user_id: userId,
          shop_id: shopId,
          shop_name: shopName || 'My Shop',
          shop_username: subdomain,
          subdomain: subdomain,
          shop_email: email,
          currency: 'USD',
          timezone: 'UTC',
          weight_unit: 'kg',
          enable_reviews: true,
          enable_wishlists: true,
          enable_guest_checkout: true,
        },
      ])
      .select()
      .single();

    if (shopError) {
      logger.error('Failed to create shop settings', shopError, {
        userId,
        subdomain,
      });
      return NextResponse.json(
        {
          error: 'Failed to create shop settings',
          details: shopError.message,
        },
        { status: 500 }
      );
    }

    // Update user metadata (Supabase stores user metadata in auth.users.raw_user_meta_data)
    try {
      await supabaseClient.auth.updateUser({
        data: {
          nickname: shopName || email.split('@')[0],
          role: 'merchant',
        },
      });
    } catch (profileError) {
      // Non-critical error - log but don't fail
      logger.warn(
        'Failed to update user metadata',
        profileError instanceof Error ? profileError : new Error(String(profileError)),
        { userId }
      );
    }

    logger.info('Shop created successfully', {
      userId,
      shopId,
      subdomain,
    });

    return NextResponse.json(
      {
        success: true,
        shopId,
        shop: newShop,
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error(
      'Complete signup API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: error.message || 'An error occurred during shop creation' },
      { status: 500 }
    );
  }
}

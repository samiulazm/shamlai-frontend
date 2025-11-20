import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@insforge/sdk';

const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL || 'http://119.40.88.49:7130';
const INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

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
    const insforgeClient = createClient({
      baseUrl: INSFORGE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check if shop settings already exist for this user
    const { data: existingShop } = await insforgeClient.database
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
    const { data: newShop, error: shopError } = await insforgeClient.database
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

    // Set user profile
    try {
      await insforgeClient.auth.setProfile({
        nickname: shopName || email.split('@')[0],
        role: 'merchant',
      });
    } catch (profileError) {
      // Non-critical error - log but don't fail
      logger.warn(
        'Failed to set user profile',
        { userId },
        profileError instanceof Error ? profileError : new Error(String(profileError))
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

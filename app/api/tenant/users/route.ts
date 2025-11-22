/**
 * API Route: /api/tenant/users
 * Get all users in a shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopUsers, ensureShopAccess } from '@/lib/services/tenant';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shopId from query params
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    // Ensure user has access to this shop
    await ensureShopAccess(user.id, shopId);

    // Get shop users
    const users = await getShopUsers(shopId);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    logger.error('GET /api/tenant/users failed', { error });
    return NextResponse.json(
      { error: error.message || 'Failed to get shop users' },
      { status: 500 }
    );
  }
}

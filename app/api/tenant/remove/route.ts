/**
 * API Route: /api/tenant/remove
 * Remove a user from a shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { removeUserFromShop, ensurePermission } from '@/lib/services/tenant';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const RemoveUserSchema = z.object({
  shop_id: z.string().uuid(),
  user_id: z.string().uuid()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = RemoveUserSchema.parse(body);

    // Ensure user has permission to remove users
    await ensurePermission(user.id, validatedData.shop_id, 'settings.write');

    // Remove user
    const success = await removeUserFromShop(
      {
        shop_id: validatedData.shop_id,
        user_id: validatedData.user_id
      },
      user.id
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User removed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('POST /api/tenant/remove failed', { error });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove user' },
      { status: 500 }
    );
  }
}

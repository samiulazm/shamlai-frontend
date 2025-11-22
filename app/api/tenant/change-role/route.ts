/**
 * API Route: /api/tenant/change-role
 * Change a user's role in a shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { changeUserRole, ensurePermission } from '@/lib/services/tenant';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const ChangeRoleSchema = z.object({
  shop_id: z.string().uuid(),
  user_id: z.string().uuid(),
  new_role: z.enum([
    'shop_owner',
    'shop_manager',
    'shop_staff',
    'accountant',
    'inventory_manager',
    'customer_support',
    'read_only'
  ])
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
    const validatedData = ChangeRoleSchema.parse(body);

    // Ensure user has permission to change roles
    await ensurePermission(user.id, validatedData.shop_id, 'settings.write');

    // Change role
    const success = await changeUserRole(
      {
        shop_id: validatedData.shop_id,
        user_id: validatedData.user_id,
        new_role: validatedData.new_role
      },
      user.id
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to change user role' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User role changed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('POST /api/tenant/change-role failed', { error });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to change user role' },
      { status: 500 }
    );
  }
}

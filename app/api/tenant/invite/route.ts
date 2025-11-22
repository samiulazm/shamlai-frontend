/**
 * API Route: /api/tenant/invite
 * Invite a user to a shop
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inviteUserToShop, ensurePermission } from '@/lib/services/tenant';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const InviteUserSchema = z.object({
  shop_id: z.string().uuid(),
  user_email: z.string().email(),
  role: z.enum([
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
    const validatedData = InviteUserSchema.parse(body);

    // Ensure user has permission to invite users
    await ensurePermission(user.id, validatedData.shop_id, 'settings.write');

    // Invite user
    const invitationId = await inviteUserToShop(
      {
        shop_id: validatedData.shop_id,
        user_email: validatedData.user_email,
        role: validatedData.role
      },
      user.id
    );

    return NextResponse.json(
      {
        message: 'User invited successfully',
        invitation_id: invitationId
      },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('POST /api/tenant/invite failed', { error });

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    );
  }
}

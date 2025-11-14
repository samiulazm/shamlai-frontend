import { NextRequest, NextResponse } from 'next/server';
import { createRefund } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';
import { insforgeClient } from '@/lib/insforge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Verify user has permission to refund this order
    const { data: { user } } = await insforgeClient.auth.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order to verify ownership
    const { data: order, error: orderError } = await insforgeClient.database
      .from('orders')
      .select('shop_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.shop_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create refund
    const { refund, error } = await createRefund(orderId, amount);

    if (error || !refund) {
      logger.error('Refund creation failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Refund creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    });
  } catch (error) {
    logger.error('Refund API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

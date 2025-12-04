import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { getOrderById } from '@/lib/services/orders';
import { updateOrderWithWorkflow } from '@/lib/services/order-workflows';
import { logger } from '@/lib/utils/logger';

/**
 * Get single order
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    const order = await getOrderById(id);

    // Check authorization (either shop owner or customer)
    if (data?.user) {
      const user = data.user;
      if (order.shop_id !== user.id && order.customer?.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // For guest orders, they need the order number to access
      const orderNumber = request.nextUrl.searchParams.get('orderNumber');
      if (orderNumber !== order.order_number) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    logger.error('Get order error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get order' }, { status: 500 });
  }
}

/**
 * Update order status
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Get current user
    const { data } = await supabaseClient.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    // Verify ownership
    const { data: order } = await supabaseClient
      .from('orders')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!order || order.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, comment, trackingNumber, courierName } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await updateOrderWithWorkflow(id, status, {
      comment,
      userId: user.id,
      trackingNumber,
      courierName,
      notifyCustomer: true,
    });

    logger.info('Order status updated', { orderId: id, status });

    return NextResponse.json({ success: true, order: result.order });
  } catch (error) {
    logger.error('Update order error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

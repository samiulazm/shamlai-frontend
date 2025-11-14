import { NextRequest, NextResponse } from 'next/server';
import { insforgeClient } from '@/lib/insforge';
import { createShipment, CourierType } from '@/lib/services/courier';
import { updateOrderWithWorkflow } from '@/lib/services/order-workflows';
import { logger } from '@/lib/utils/logger';

/**
 * Create courier shipment for an order
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data } = await insforgeClient.auth.getCurrentUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    const body = await request.json();
    const { orderId, courier, weight, notes } = body;

    if (!orderId || !courier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get order with details
    const { data: order, error: orderError } = await insforgeClient.database
      .from('orders')
      .select(`
        *,
        items:order_items(
          quantity,
          price,
          product:products(name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    if (order.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create shipment
    const shipmentParams = {
      orderNumber: order.order_number,
      customerName: `${order.customer_first_name} ${order.customer_last_name}`,
      customerPhone: order.customer_phone || '',
      customerAddress: {
        street: order.shipping_street || '',
        city: order.shipping_city || '',
        state: order.shipping_state,
        zip: order.shipping_zip,
        country: order.shipping_country || 'BD',
      },
      items: order.items?.map((item: any) => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
      })) || [],
      totalAmount: parseFloat(order.total.toString()),
      weight,
      notes,
    };

    const result = await createShipment(courier as CourierType, shipmentParams);

    if (!result.success) {
      logger.error('Shipment creation failed', new Error(result.error));
      return NextResponse.json({ error: result.error || 'Failed to create shipment' }, { status: 500 });
    }

    // Update order with tracking info
    await updateOrderWithWorkflow(orderId, 'shipped', {
      trackingNumber: result.trackingNumber,
      courierName: courier,
      comment: `Shipment created with ${courier}`,
      userId: user.id,
      notifyCustomer: true,
    });

    logger.info('Courier shipment created', {
      orderId,
      courier,
      trackingNumber: result.trackingNumber,
    });

    return NextResponse.json({
      success: true,
      trackingNumber: result.trackingNumber,
      consignmentId: result.consignmentId,
    });
  } catch (error) {
    logger.error('Courier shipment API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

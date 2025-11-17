import { NextRequest, NextResponse } from 'next/server';
import { createPaymentGateway } from '@/lib/services/payment-gateway';
import { createClient } from '@/lib/insforge';

/**
 * POST /api/payments/initiate
 * Initiate a mobile wallet payment
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentMethodId, paymentMethod } = await request.json();

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, paymentMethod' },
        { status: 400 }
      );
    }

    const insforge = createClient();

    // Get order details with customer information
    const { data: order, error: orderError } = await insforge
      .from('orders')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[Payment Initiate] Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Validate payment method
    const validMethods = ['bkash', 'nagad', 'rocket', 'card'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Initialize payment gateway
    const gateway = createPaymentGateway(order.shop_id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get customer details
    const customerName = order.customers?.name || order.shipping_name || 'Guest';
    const customerEmail = order.customers?.email || 'guest@shamlai.com';
    const customerPhone = order.customers?.phone || order.shipping_phone || '';

    // Initiate payment
    const result = await gateway.initiatePayment({
      orderId: order.id,
      amount: parseFloat(order.total_amount),
      currency: order.currency || 'BDT',
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      successUrl: `${baseUrl}/api/payments/success`,
      failUrl: `${baseUrl}/api/payments/fail`,
      cancelUrl: `${baseUrl}/api/payments/cancel`,
      productName: `Order #${order.order_number}`,
      productCategory: 'E-commerce',
    });

    if (!result.success) {
      console.error('[Payment Initiate] Gateway error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to initiate payment' },
        { status: 400 }
      );
    }

    // Store transaction record
    const { error: txnError } = await insforge
      .from('mobile_wallet_transactions')
      .insert({
        order_id: orderId,
        payment_method_id: paymentMethodId,
        wallet_type: paymentMethod,
        transaction_id: result.transactionId,
        amount: order.total_amount,
        currency: order.currency || 'BDT',
        status: 'pending',
        customer_phone: customerPhone,
        gateway_response: {
          sessionKey: result.sessionKey,
          initiatedAt: new Date().toISOString(),
        },
      });

    if (txnError) {
      console.error('[Payment Initiate] Failed to store transaction:', txnError);
      // Continue anyway as payment was initiated
    }

    // Update order status to pending payment
    await insforge
      .from('orders')
      .update({ payment_status: 'pending' })
      .eq('id', orderId);

    console.log('[Payment Initiate] Success:', {
      orderId,
      transactionId: result.transactionId,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      gatewayUrl: result.gatewayUrl,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error('[Payment Initiate] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

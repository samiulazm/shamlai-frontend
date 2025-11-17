import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge';
import { createPaymentGateway } from '@/lib/services/payment-gateway';

/**
 * POST /api/payments/ipn
 * Instant Payment Notification (IPN) from SSLCOMMERZ
 *
 * IPN is sent by the payment gateway independently of user redirects
 * This ensures we capture payment status even if user closes browser
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const tranId = data.tran_id as string;
    const valId = data.val_id as string;
    const status = data.status as string;
    const amount = data.amount as string;
    const bankTranId = data.bank_tran_id as string;

    console.log('[Payment IPN] Received IPN:', {
      tranId,
      valId,
      status,
      amount,
    });

    if (!tranId || !valId) {
      console.error('[Payment IPN] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insforge = createClient();

    // Validate payment with gateway (important for security)
    const gateway = createPaymentGateway();
    const validation = await gateway.validatePayment(valId);

    if (!validation.isValid) {
      console.error('[Payment IPN] Validation failed:', validation.error);
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      );
    }

    // Get transaction details
    const { data: transaction } = await insforge
      .from('mobile_wallet_transactions')
      .select('order_id, status')
      .eq('transaction_id', tranId)
      .single();

    if (!transaction) {
      console.error('[Payment IPN] Transaction not found:', tranId);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only process if not already completed (prevent duplicate processing)
    if (transaction.status === 'completed') {
      console.log('[Payment IPN] Transaction already completed, skipping');
      return NextResponse.json({ message: 'Already processed' });
    }

    // Update transaction
    await insforge
      .from('mobile_wallet_transactions')
      .update({
        status: 'completed',
        gateway_transaction_id: bankTranId,
        gateway_response: {
          ipnData: data,
          validation,
          processedAt: new Date().toISOString(),
        },
        completed_at: new Date().toISOString(),
      })
      .eq('transaction_id', tranId);

    // Update order
    await insforge
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date().toISOString(),
      })
      .eq('id', transaction.order_id);

    // Create status history
    await insforge.from('order_status_history').insert({
      order_id: transaction.order_id,
      status: 'processing',
      notes: `Payment confirmed via IPN. Transaction ID: ${bankTranId}`,
    });

    console.log('[Payment IPN] Payment processed successfully:', {
      orderId: transaction.order_id,
      transactionId: tranId,
    });

    // Return success response to gateway
    return NextResponse.json({
      success: true,
      message: 'IPN processed successfully',
    });
  } catch (error) {
    console.error('[Payment IPN] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

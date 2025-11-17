import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge';
import { createPaymentGateway } from '@/lib/services/payment-gateway';

/**
 * POST /api/payments/success
 * Handle successful payment callback from SSLCOMMERZ
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const tranId = data.tran_id as string;
    const valId = data.val_id as string;
    const amount = data.amount as string;
    const bankTranId = data.bank_tran_id as string;
    const cardType = data.card_type as string;
    const status = data.status as string;

    console.log('[Payment Success] Received callback:', {
      tranId,
      valId,
      amount,
      status,
      cardType,
    });

    if (!tranId || !valId) {
      console.error('[Payment Success] Missing transaction IDs');
      return NextResponse.redirect(
        new URL('/payment/failed?error=invalid_callback', request.url)
      );
    }

    const insforge = createClient();

    // Validate payment with gateway
    const gateway = createPaymentGateway();
    const validation = await gateway.validatePayment(valId);

    if (!validation.isValid) {
      console.error('[Payment Success] Validation failed:', validation.error);

      // Update transaction as failed
      await insforge
        .from('mobile_wallet_transactions')
        .update({
          status: 'failed',
          gateway_response: {
            error: 'Validation failed',
            validationResponse: validation,
            callbackData: data,
          },
        })
        .eq('transaction_id', tranId);

      return NextResponse.redirect(
        new URL('/payment/failed?error=validation_failed', request.url)
      );
    }

    // Get transaction details
    const { data: transaction } = await insforge
      .from('mobile_wallet_transactions')
      .select('*, orders!inner(*)')
      .eq('transaction_id', tranId)
      .single();

    if (!transaction) {
      console.error('[Payment Success] Transaction not found:', tranId);
      return NextResponse.redirect(
        new URL('/payment/failed?error=transaction_not_found', request.url)
      );
    }

    // Update transaction status
    const { error: txnUpdateError } = await insforge
      .from('mobile_wallet_transactions')
      .update({
        status: 'completed',
        gateway_transaction_id: bankTranId,
        gateway_response: {
          ...transaction.gateway_response,
          validation,
          callbackData: data,
          completedAt: new Date().toISOString(),
        },
        completed_at: new Date().toISOString(),
      })
      .eq('transaction_id', tranId);

    if (txnUpdateError) {
      console.error('[Payment Success] Failed to update transaction:', txnUpdateError);
    }

    // Update order status
    const { error: orderUpdateError } = await insforge
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        paid_at: new Date().toISOString(),
      })
      .eq('id', transaction.order_id);

    if (orderUpdateError) {
      console.error('[Payment Success] Failed to update order:', orderUpdateError);
    }

    // Create order status history entry
    await insforge.from('order_status_history').insert({
      order_id: transaction.order_id,
      status: 'processing',
      notes: `Payment completed via ${transaction.wallet_type}. Transaction ID: ${bankTranId}`,
    });

    console.log('[Payment Success] Payment processed successfully:', {
      orderId: transaction.order_id,
      transactionId: tranId,
      amount: validation.amount,
    });

    // Redirect to success page
    const successUrl = new URL('/payment/success', request.url);
    successUrl.searchParams.set('order_id', transaction.order_id);
    successUrl.searchParams.set('amount', amount);
    successUrl.searchParams.set('transaction_id', bankTranId);

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('[Payment Success] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=internal_error', request.url)
    );
  }
}

/**
 * GET /api/payments/success
 * Handle GET redirects (some gateways use GET instead of POST)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const data: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  // Convert to FormData and process like POST
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Create a new request with FormData
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  });

  return POST(newRequest);
}

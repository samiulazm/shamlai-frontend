import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge';

/**
 * POST /api/payments/fail
 * Handle failed payment callback from SSLCOMMERZ
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const tranId = data.tran_id as string;
    const status = data.status as string;
    const errorReason = data.error as string;

    console.log('[Payment Fail] Received callback:', {
      tranId,
      status,
      errorReason,
    });

    if (!tranId) {
      return NextResponse.redirect(
        new URL('/payment/failed?error=invalid_callback', request.url)
      );
    }

    const insforge = createClient();

    // Get transaction details
    const { data: transaction } = await insforge
      .from('mobile_wallet_transactions')
      .select('order_id')
      .eq('transaction_id', tranId)
      .single();

    // Update transaction status
    await insforge
      .from('mobile_wallet_transactions')
      .update({
        status: 'failed',
        gateway_response: {
          failureReason: errorReason,
          callbackData: data,
          failedAt: new Date().toISOString(),
        },
      })
      .eq('transaction_id', tranId);

    // Update order status
    if (transaction) {
      await insforge
        .from('orders')
        .update({
          payment_status: 'failed',
        })
        .eq('id', transaction.order_id);

      // Create order status history entry
      await insforge.from('order_status_history').insert({
        order_id: transaction.order_id,
        status: 'pending',
        notes: `Payment failed: ${errorReason || 'Unknown error'}`,
      });
    }

    console.log('[Payment Fail] Payment marked as failed:', {
      tranId,
      errorReason,
    });

    // Redirect to failure page
    const failUrl = new URL('/payment/failed', request.url);
    failUrl.searchParams.set('reason', errorReason || 'Payment failed');
    failUrl.searchParams.set('transaction_id', tranId);

    return NextResponse.redirect(failUrl);
  } catch (error) {
    console.error('[Payment Fail] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?error=internal_error', request.url)
    );
  }
}

/**
 * GET /api/payments/fail
 * Handle GET redirects
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const formData = new FormData();

  searchParams.forEach((value, key) => {
    formData.append(key, value);
  });

  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  });

  return POST(newRequest);
}

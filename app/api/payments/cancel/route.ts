import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge';

/**
 * POST /api/payments/cancel
 * Handle cancelled payment callback from SSLCOMMERZ
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const tranId = data.tran_id as string;

    console.log('[Payment Cancel] User cancelled payment:', { tranId });

    if (!tranId) {
      return NextResponse.redirect(
        new URL('/cart?error=payment_cancelled', request.url)
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
          cancelled: true,
          cancelledAt: new Date().toISOString(),
          callbackData: data,
        },
      })
      .eq('transaction_id', tranId);

    // Update order status back to pending
    if (transaction) {
      await insforge
        .from('orders')
        .update({
          payment_status: 'pending',
        })
        .eq('id', transaction.order_id);

      // Create order status history entry
      await insforge.from('order_status_history').insert({
        order_id: transaction.order_id,
        status: 'pending',
        notes: 'Payment cancelled by user',
      });
    }

    console.log('[Payment Cancel] Transaction marked as cancelled');

    // Redirect back to cart or checkout
    const cancelUrl = new URL('/checkout', request.url);
    cancelUrl.searchParams.set('message', 'Payment was cancelled. Please try again.');
    if (transaction) {
      cancelUrl.searchParams.set('order_id', transaction.order_id);
    }

    return NextResponse.redirect(cancelUrl);
  } catch (error) {
    console.error('[Payment Cancel] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=internal_error', request.url)
    );
  }
}

/**
 * GET /api/payments/cancel
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

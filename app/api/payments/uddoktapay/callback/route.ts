/**
 * uddoktaPay Payment Callback API
 * Handles redirect callbacks from uddoktaPay after payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoice_id');
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('status');

    if (!invoiceId || !orderId) {
      logger.error('Missing required callback parameters', {
        invoiceId,
        orderId,
      });

      return NextResponse.redirect(
        new URL(`/payment/failed?error=missing_parameters`, request.url)
      );
    }

    logger.info('Processing payment callback', {
      invoiceId,
      orderId,
      status,
    });

    // Verify payment with uddoktaPay
    const verification = await verifyPayment({
      invoiceId,
      provider: 'uddoktapay',
    });

    if (!verification.verified) {
      logger.error('Payment verification failed', {
        invoiceId,
        orderId,
      });

      return NextResponse.redirect(
        new URL(
          `/payment/failed?order_id=${orderId}&error=verification_failed`,
          request.url
        )
      );
    }

    // Redirect based on payment status
    if (verification.status === 'paid') {
      logger.info('Payment verified as successful', {
        invoiceId,
        orderId,
      });

      // Extract shop_id from the callback or order
      const shopId = searchParams.get('shop_id');
      const redirectUrl = shopId
        ? `/${shopId}/payment/success?order_id=${orderId}`
        : `/payment/success?order_id=${orderId}`;

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else if (verification.status === 'pending') {
      logger.info('Payment is pending', {
        invoiceId,
        orderId,
      });

      const shopId = searchParams.get('shop_id');
      const redirectUrl = shopId
        ? `/${shopId}/payment/pending?order_id=${orderId}`
        : `/payment/pending?order_id=${orderId}`;

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      logger.warn('Payment verification returned failed status', {
        invoiceId,
        orderId,
        status: verification.status,
      });

      return NextResponse.redirect(
        new URL(`/payment/failed?order_id=${orderId}`, request.url)
      );
    }
  } catch (error) {
    logger.error('Error in payment callback API', error);

    const orderId = request.nextUrl.searchParams.get('order_id');
    return NextResponse.redirect(
      new URL(
        `/payment/failed?order_id=${orderId || 'unknown'}&error=internal_error`,
        request.url
      )
    );
  }
}

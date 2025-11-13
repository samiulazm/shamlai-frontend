import { NextRequest, NextResponse } from 'next/server';
import { processPayment } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentMethodId, amount, currency, customerEmail } = body;

    // Validate required fields
    if (!orderId || !paymentMethodId || !amount || !currency || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process payment
    const { paymentIntent, error } = await processPayment({
      orderId,
      paymentMethodId,
      amount,
      currency,
      customerEmail,
    });

    if (error || !paymentIntent) {
      logger.error('Payment processing failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    logger.error('Payment intent API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

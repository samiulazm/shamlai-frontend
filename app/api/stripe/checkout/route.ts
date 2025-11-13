import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency, customerEmail } = body;

    // Validate required fields
    if (!orderId || !amount || !currency || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create checkout session
    const { session, error } = await createCheckoutSession({
      orderId,
      amount,
      currency,
      customerEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/order/${orderId}?payment=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=cancelled`,
    });

    if (error || !session) {
      logger.error('Failed to create checkout session', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Checkout API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handleWebhookEvent } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';

// Force dynamic rendering for webhook endpoints
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Verify webhook signature
    const { event, error: verifyError } = verifyWebhookSignature(body, signature);

    if (verifyError || !event) {
      logger.error(
        'Webhook signature verification failed',
        verifyError instanceof Error ? verifyError : new Error(String(verifyError))
      );
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    const { success, error: handlerError } = await handleWebhookEvent(event);

    if (!success) {
      logger.error(
        'Webhook event handler failed',
        handlerError instanceof Error ? handlerError : new Error(String(handlerError))
      );
      return NextResponse.json({ error: 'Event handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

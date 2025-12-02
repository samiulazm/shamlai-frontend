/**
 * uddoktaPay Webhook API
 * Handles server-to-server webhook notifications from uddoktaPay
 */

import { NextRequest, NextResponse } from 'next/server';
import { processUddoktapayWebhook } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';
import type { UddoktapayWebhookPayload } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const payload: UddoktapayWebhookPayload = await request.json();

    logger.info('Received uddoktaPay webhook', {
      invoiceId: payload.invoice_id,
      status: payload.status,
      orderId: payload.metadata?.order_id,
    });

    // Validate webhook payload
    if (!payload.invoice_id || !payload.metadata?.order_id) {
      logger.error('Invalid webhook payload', {
        payload,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload',
        },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature if uddoktaPay provides one
    // const signature = request.headers.get('x-uddoktapay-signature');
    // if (!verifyWebhookSignature(JSON.stringify(payload), signature, apiKey)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    // Process webhook
    const result = await processUddoktapayWebhook(payload);

    if (!result.success) {
      logger.error('Webhook processing failed', {
        invoiceId: payload.invoice_id,
        error: result.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      );
    }

    logger.info('Webhook processed successfully', {
      invoiceId: payload.invoice_id,
      orderId: payload.metadata.order_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error in webhook API', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-uddoktapay-signature',
    },
  });
}

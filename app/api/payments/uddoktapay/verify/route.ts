/**
 * uddoktaPay Payment Verification API
 * Verifies payment status with uddoktaPay
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: invoiceId',
        },
        { status: 400 }
      );
    }

    logger.info('Verifying payment', { invoiceId });

    // Verify payment with uddoktaPay
    const verification = await verifyPayment({
      invoiceId,
      provider: 'uddoktapay',
    });

    if (!verification.verified) {
      logger.error('Payment verification failed', { invoiceId });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed',
        },
        { status: 400 }
      );
    }

    logger.info('Payment verified successfully', {
      invoiceId,
      status: verification.status,
    });

    return NextResponse.json({
      success: true,
      status: verification.status,
      metadata: verification.metadata,
    });
  } catch (error) {
    logger.error('Error in payment verification API', error);

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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

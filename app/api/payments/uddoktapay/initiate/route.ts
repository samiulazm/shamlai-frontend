/**
 * uddoktaPay Payment Initiation API
 * Initiates a payment session with uddoktaPay
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/services/payment';
import { logger } from '@/lib/utils/logger';
import type { PaymentInitiationRequest } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { orderId, amount, customerName, customerEmail, currency } = body;

    if (!orderId || !amount || !customerName || !customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: orderId, amount, customerName, customerEmail',
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount',
        },
        { status: 400 }
      );
    }

    // Create payment initiation request
    const paymentRequest: PaymentInitiationRequest = {
      orderId,
      amount,
      currency: currency || 'BDT',
      customerName,
      customerEmail,
      customerPhone: body.customerPhone,
      provider: 'uddoktapay',
      metadata: body.metadata,
    };

    // Initiate payment
    const response = await initiatePayment(paymentRequest);

    if (!response.success) {
      logger.error('Payment initiation failed', {
        orderId,
        error: response.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: response.error || 'Failed to initiate payment',
        },
        { status: 400 }
      );
    }

    logger.info('Payment initiated successfully', {
      orderId,
      paymentId: response.paymentId,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: response.paymentUrl,
      paymentId: response.paymentId,
      message: response.message,
    });
  } catch (error) {
    logger.error('Error in payment initiation API', error);

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

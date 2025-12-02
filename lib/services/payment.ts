/**
 * Payment Service
 * Handles payment processing for all payment gateways
 */

import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import {
  PaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentCallbackData,
  PaymentRefundRequest,
  PaymentRefundResponse,
  UddoktapayWebhookPayload,
} from '@/lib/types/payment';
import {
  initiatePayment as initiateUddoktapayPayment,
  createPaymentRequest,
  verifyPayment as verifyUddoktapayPayment,
  processWebhookPayload,
  isUddoktapayEnabled,
} from '@/lib/utils/uddoktapay';
import type { Payment, PaymentStatus } from '@/lib/types/database';

/**
 * Initiate a payment session
 */
export async function initiatePayment(
  request: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> {
  try {
    logger.info('Initiating payment', {
      orderId: request.orderId,
      provider: request.provider,
      amount: request.amount,
    });

    // Route to appropriate payment gateway
    switch (request.provider) {
      case 'uddoktapay':
        return await initiateUddoktapayPaymentSession(request);

      case 'cod':
        // Cash on delivery doesn't need payment initiation
        return {
          success: true,
          provider: 'cod',
          message: 'Cash on Delivery selected',
        };

      default:
        return {
          success: false,
          provider: request.provider,
          error: `Payment provider ${request.provider} is not supported yet`,
        };
    }
  } catch (error) {
    logger.error('Payment initiation error', error);
    return {
      success: false,
      provider: request.provider,
      error: 'Failed to initiate payment',
    };
  }
}

/**
 * Initiate uddoktaPay payment session
 */
async function initiateUddoktapayPaymentSession(
  request: PaymentInitiationRequest
): Promise<PaymentInitiationResponse> {
  if (!isUddoktapayEnabled()) {
    return {
      success: false,
      provider: 'uddoktapay',
      error: 'uddoktaPay is not enabled',
    };
  }

  // Get order details
  const { data: order } = await supabaseClient
    .from('orders')
    .select('*, shop_id')
    .eq('id', request.orderId)
    .single();

  if (!order) {
    return {
      success: false,
      provider: 'uddoktapay',
      error: 'Order not found',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shopId = order.shop_id;

  // Create payment request
  const paymentRequest = createPaymentRequest({
    orderId: request.orderId,
    amount: request.amount,
    customerName: request.customerName,
    customerEmail: request.customerEmail,
    shopId,
    customerId: request.metadata?.customerId,
    successUrl: `${appUrl}/${shopId}/payment/success?order_id=${request.orderId}`,
    cancelUrl: `${appUrl}/${shopId}/payment/cancel?order_id=${request.orderId}`,
  });

  // Initiate payment with uddoktaPay
  const response = await initiateUddoktapayPayment(paymentRequest);

  if (!response.status || !response.payment_url) {
    return {
      success: false,
      provider: 'uddoktapay',
      error: response.error || response.message,
    };
  }

  // Create payment record in database
  await createPaymentRecord({
    orderId: request.orderId,
    amount: request.amount,
    currency: request.currency,
    provider: 'uddoktapay',
    transactionId: response.invoice_id,
    status: 'pending',
  });

  return {
    success: true,
    provider: 'uddoktapay',
    paymentUrl: response.payment_url,
    paymentId: response.invoice_id,
    message: response.message,
  };
}

/**
 * Create payment record in database
 */
export async function createPaymentRecord(params: {
  orderId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  transactionId?: string;
  status: PaymentStatus;
  metadata?: any;
}): Promise<Payment | null> {
  try {
    const { data, error } = await supabaseClient
      .from('payments')
      .insert({
        order_id: params.orderId,
        amount: params.amount,
        currency: params.currency,
        payment_provider: params.provider,
        transaction_id: params.transactionId,
        status: params.status,
        provider_response: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create payment record', error);
      return null;
    }

    logger.info('Payment record created', { paymentId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating payment record', error);
    return null;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(params: {
  orderId: string;
  transactionId: string;
  status: PaymentStatus;
  metadata?: any;
}): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('payments')
      .update({
        status: params.status,
        transaction_id: params.transactionId,
        provider_response: params.metadata || {},
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', params.orderId);

    if (error) {
      logger.error('Failed to update payment status', error);
      return false;
    }

    logger.info('Payment status updated', {
      orderId: params.orderId,
      status: params.status,
    });

    return true;
  } catch (error) {
    logger.error('Error updating payment status', error);
    return false;
  }
}

/**
 * Update order payment status
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      logger.error('Failed to update order payment status', error);
      return false;
    }

    logger.info('Order payment status updated', { orderId, paymentStatus });
    return true;
  } catch (error) {
    logger.error('Error updating order payment status', error);
    return false;
  }
}

/**
 * Process payment callback
 */
export async function processPaymentCallback(
  callbackData: PaymentCallbackData
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Processing payment callback', {
      orderId: callbackData.orderId,
      status: callbackData.status,
    });

    // Update payment record
    await updatePaymentStatus({
      orderId: callbackData.orderId,
      transactionId: callbackData.transactionId,
      status: callbackData.status,
      metadata: callbackData.metadata,
    });

    // Update order payment status
    await updateOrderPaymentStatus(callbackData.orderId, callbackData.status);

    // If payment is successful, update order status
    if (callbackData.status === 'paid') {
      await supabaseClient
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .eq('id', callbackData.orderId);

      logger.info('Order confirmed after successful payment', {
        orderId: callbackData.orderId,
      });
    }

    return {
      success: true,
      message: 'Payment processed successfully',
    };
  } catch (error) {
    logger.error('Error processing payment callback', error);
    return {
      success: false,
      message: 'Failed to process payment callback',
    };
  }
}

/**
 * Process uddoktaPay webhook
 */
export async function processUddoktapayWebhook(
  payload: UddoktapayWebhookPayload
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info('Processing uddoktaPay webhook', {
      invoiceId: payload.invoice_id,
      status: payload.status,
    });

    const processedData = processWebhookPayload(payload);

    await processPaymentCallback({
      orderId: processedData.orderId,
      transactionId: processedData.transactionId,
      status: processedData.status,
      amount: processedData.amount,
      provider: 'uddoktapay',
      metadata: {
        payment_method: payload.payment_method,
        sender_number: payload.sender_number,
        date: payload.date,
        ...processedData.metadata,
      },
    });

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  } catch (error) {
    logger.error('Error processing uddoktaPay webhook', error);
    return {
      success: false,
      message: 'Failed to process webhook',
    };
  }
}

/**
 * Verify payment with gateway
 */
export async function verifyPayment(params: {
  invoiceId: string;
  provider: PaymentProvider;
}): Promise<{ verified: boolean; status?: PaymentStatus; metadata?: any }> {
  try {
    if (params.provider === 'uddoktapay') {
      const verification = await verifyUddoktapayPayment(params.invoiceId);

      if (!verification.status) {
        return { verified: false };
      }

      const status = verification.status_code
        ? verification.status_code === 'COMPLETED'
          ? 'paid'
          : verification.status_code === 'PENDING'
            ? 'pending'
            : 'failed'
        : 'pending';

      return {
        verified: true,
        status,
        metadata: verification,
      };
    }

    return { verified: false };
  } catch (error) {
    logger.error('Error verifying payment', error);
    return { verified: false };
  }
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      logger.error('Failed to get payment', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error getting payment', error);
    return null;
  }
}

/**
 * Process refund (placeholder - implement based on gateway support)
 */
export async function processRefund(
  request: PaymentRefundRequest
): Promise<PaymentRefundResponse> {
  try {
    logger.info('Processing refund', request);

    // For now, just update the payment status
    // In production, integrate with payment gateway refund API
    await updatePaymentStatus({
      orderId: request.orderId,
      transactionId: request.paymentId,
      status: 'refunded',
      metadata: { reason: request.reason },
    });

    await updateOrderPaymentStatus(request.orderId, 'refunded');

    return {
      success: true,
      status: 'refunded',
      message: 'Refund processed successfully',
    };
  } catch (error) {
    logger.error('Error processing refund', error);
    return {
      success: false,
      status: 'failed',
      message: 'Failed to process refund',
    };
  }
}

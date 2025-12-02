/**
 * uddoktaPay Utility Functions
 * Helper functions for uddoktaPay payment gateway integration
 */

import crypto from 'crypto';
import {
  UddoktapayConfig,
  UddoktapayPaymentRequest,
  UddoktapayPaymentResponse,
  UddoktapayWebhookPayload,
  UddoktapayVerificationResponse,
  UddoktapayErrorCode,
} from '@/lib/types/payment';
import { logger } from './logger';

/**
 * Get uddoktaPay configuration from environment variables
 */
export function getUddoktapayConfig(): UddoktapayConfig {
  const apiKey = process.env.UDDOKTAPAY_API_KEY;
  const apiUrl = process.env.UDDOKTAPAY_API_URL || 'https://sandbox.uddoktapay.com/api/checkout-v2';
  const webhookUrl =
    process.env.UDDOKTAPAY_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/uddoktapay/webhook`;
  const enabled = process.env.NEXT_PUBLIC_UDDOKTAPAY_ENABLED === 'true';

  if (!apiKey) {
    logger.warn('uddoktaPay API key not configured');
  }

  return {
    apiKey: apiKey || '',
    apiUrl,
    webhookUrl,
    enabled,
  };
}

/**
 * Check if uddoktaPay is enabled and configured
 */
export function isUddoktapayEnabled(): boolean {
  const config = getUddoktapayConfig();
  return config.enabled && !!config.apiKey;
}

/**
 * Format amount for uddoktaPay (BDT with 2 decimal places)
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parse amount from uddoktaPay response
 */
export function parseAmount(amountString: string): number {
  return parseFloat(amountString);
}

/**
 * Generate signature for webhook verification
 * Note: Update this based on uddoktaPay's actual signature algorithm
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Create payment request payload
 */
export function createPaymentRequest(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  shopId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}): UddoktapayPaymentRequest {
  const config = getUddoktapayConfig();

  return {
    full_name: params.customerName,
    email: params.customerEmail,
    amount: formatAmount(params.amount),
    metadata: {
      order_id: params.orderId,
      customer_id: params.customerId,
      shop_id: params.shopId,
    },
    redirect_url: params.successUrl,
    return_type: 'GET',
    cancel_url: params.cancelUrl,
    webhook_url: config.webhookUrl,
  };
}

/**
 * Initiate payment with uddoktaPay
 */
export async function initiatePayment(
  request: UddoktapayPaymentRequest
): Promise<UddoktapayPaymentResponse> {
  const config = getUddoktapayConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error('uddoktaPay is not enabled or configured');
  }

  try {
    logger.info('Initiating uddoktaPay payment', {
      amount: request.amount,
      orderId: request.metadata.order_id,
    });

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': config.apiKey,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('uddoktaPay payment initiation failed', {
        status: response.status,
        data,
      });

      return {
        status: false,
        message: data.message || 'Payment initiation failed',
        error: data.error || UddoktapayErrorCode.PAYMENT_FAILED,
      };
    }

    logger.info('uddoktaPay payment initiated successfully', {
      invoiceId: data.invoice_id,
      orderId: request.metadata.order_id,
    });

    return {
      status: true,
      message: data.message || 'Payment initiated successfully',
      payment_url: data.payment_url,
      invoice_id: data.invoice_id,
    };
  } catch (error) {
    logger.error('uddoktaPay payment initiation error', error);

    return {
      status: false,
      message: 'Network error during payment initiation',
      error: UddoktapayErrorCode.NETWORK_ERROR,
    };
  }
}

/**
 * Verify payment status with uddoktaPay
 */
export async function verifyPayment(invoiceId: string): Promise<UddoktapayVerificationResponse> {
  const config = getUddoktapayConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error('uddoktaPay is not enabled or configured');
  }

  try {
    logger.info('Verifying uddoktaPay payment', { invoiceId });

    const verifyUrl = `${config.apiUrl.replace('/checkout-v2', '/verify-payment')}`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': config.apiKey,
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('uddoktaPay payment verification failed', {
        status: response.status,
        data,
      });

      return {
        status: false,
      };
    }

    logger.info('uddoktaPay payment verified successfully', {
      invoiceId,
      status: data.status,
    });

    return data;
  } catch (error) {
    logger.error('uddoktaPay payment verification error', error);

    return {
      status: false,
    };
  }
}

/**
 * Process webhook payload
 */
export function processWebhookPayload(payload: UddoktapayWebhookPayload): {
  orderId: string;
  transactionId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  metadata: any;
} {
  let status: 'paid' | 'pending' | 'failed';

  switch (payload.status) {
    case 'COMPLETED':
      status = 'paid';
      break;
    case 'PENDING':
      status = 'pending';
      break;
    case 'ERROR':
    default:
      status = 'failed';
      break;
  }

  return {
    orderId: payload.metadata.order_id,
    transactionId: payload.transaction_id,
    amount: parseAmount(payload.charged_amount),
    status,
    metadata: payload.metadata,
  };
}

/**
 * Format currency for display (BDT)
 */
export function formatCurrency(amount: number): string {
  return `৳${amount.toFixed(2)}`;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0',
    };
  }

  // uddoktaPay minimum amount (adjust as needed)
  const minAmount = 10;
  if (amount < minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ৳${minAmount}`,
    };
  }

  // uddoktaPay maximum amount (adjust as needed)
  const maxAmount = 500000;
  if (amount > maxAmount) {
    return {
      valid: false,
      error: `Maximum amount is ৳${maxAmount}`,
    };
  }

  return { valid: true };
}

/**
 * Get payment method icon/logo
 */
export function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    bkash: '💳',
    nagad: '💰',
    rocket: '🚀',
    upay: '💵',
    card: '💳',
    default: '💸',
  };

  return icons[method.toLowerCase()] || icons.default;
}

/**
 * Map uddoktaPay status to our payment status
 */
export function mapPaymentStatus(
  uddoktapayStatus: 'COMPLETED' | 'PENDING' | 'ERROR' | 'CANCELLED'
): 'paid' | 'pending' | 'failed' {
  switch (uddoktapayStatus) {
    case 'COMPLETED':
      return 'paid';
    case 'PENDING':
      return 'pending';
    case 'ERROR':
    case 'CANCELLED':
    default:
      return 'failed';
  }
}

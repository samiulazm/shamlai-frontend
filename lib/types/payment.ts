/**
 * Payment Types and Interfaces
 * Centralized payment-related type definitions for all payment gateways
 */

import { PaymentStatus } from './database';

// ============================================================================
// uddoktaPay Types
// ============================================================================

/**
 * uddoktaPay Configuration
 */
export interface UddoktapayConfig {
  apiKey: string;
  apiUrl: string;
  webhookUrl: string;
  enabled: boolean;
}

/**
 * uddoktaPay Payment Request Payload
 */
export interface UddoktapayPaymentRequest {
  full_name: string;
  email: string;
  amount: string; // Amount in BDT
  metadata: {
    order_id: string;
    customer_id?: string;
    shop_id: string;
    [key: string]: any;
  };
  redirect_url: string;
  return_type: 'GET' | 'POST';
  cancel_url: string;
  webhook_url: string;
}

/**
 * uddoktaPay Payment Initiation Response
 */
export interface UddoktapayPaymentResponse {
  status: boolean;
  message: string;
  payment_url?: string;
  invoice_id?: string;
  error?: string;
}

/**
 * uddoktaPay Webhook Payload
 */
export interface UddoktapayWebhookPayload {
  invoice_id: string;
  payment_method: string;
  payment_method_logo: string;
  sender_number: string;
  transaction_id: string;
  date: string;
  charged_amount: string;
  due_amount: string;
  full_name: string;
  email: string;
  metadata: {
    order_id: string;
    customer_id?: string;
    shop_id: string;
    [key: string]: any;
  };
  status: 'COMPLETED' | 'PENDING' | 'ERROR';
  payment_processor_response: any;
}

/**
 * uddoktaPay Verification Response
 */
export interface UddoktapayVerificationResponse {
  status: boolean;
  metadata?: {
    order_id: string;
    customer_id?: string;
    shop_id: string;
    [key: string]: any;
  };
  payment_method?: string;
  transaction_id?: string;
  amount?: string;
  full_name?: string;
  email?: string;
  date?: string;
  status_code?: 'COMPLETED' | 'PENDING' | 'ERROR' | 'CANCELLED';
}

// ============================================================================
// Generic Payment Types
// ============================================================================

/**
 * Payment Gateway Provider
 */
export type PaymentProvider = 'uddoktapay' | 'stripe' | 'cod' | 'bkash' | 'nagad' | 'sslcommerz';

/**
 * Payment Initiation Request (Generic)
 */
export interface PaymentInitiationRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
}

/**
 * Payment Initiation Response (Generic)
 */
export interface PaymentInitiationResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  provider: PaymentProvider;
  error?: string;
  message?: string;
}

/**
 * Payment Callback Data
 */
export interface PaymentCallbackData {
  orderId: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
}

/**
 * Payment Refund Request
 */
export interface PaymentRefundRequest {
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  provider: PaymentProvider;
}

/**
 * Payment Refund Response
 */
export interface PaymentRefundResponse {
  success: boolean;
  refundId?: string;
  status: 'refunded' | 'failed' | 'pending';
  message: string;
}

/**
 * Payment Method Configuration (for shop settings)
 */
export interface PaymentMethodConfig {
  id: string;
  provider: PaymentProvider;
  name: string;
  description?: string;
  enabled: boolean;
  settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Payment Error
 */
export interface PaymentError {
  code: string;
  message: string;
  provider: PaymentProvider;
  details?: any;
}

/**
 * uddoktaPay Error Codes
 */
export enum UddoktapayErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_METADATA = 'INVALID_METADATA',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

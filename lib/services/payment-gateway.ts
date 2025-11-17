/**
 * Payment Gateway Service for Bangladesh Mobile Wallets
 * Supports: bKash, Nagad, Rocket via SSLCOMMERZ
 */

export interface PaymentGatewayConfig {
  storeId: string;
  storePassword: string;
  apiUrl: string;
  environment: 'sandbox' | 'production';
}

export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'card';
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  productName?: string;
  productCategory?: string;
}

export interface PaymentResponse {
  success: boolean;
  gatewayUrl?: string;
  transactionId?: string;
  sessionKey?: string;
  error?: string;
  errorDetails?: any;
}

export interface ValidationResponse {
  isValid: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  bankTransactionId?: string;
  status?: string;
  error?: string;
}

export interface RefundRequest {
  bankTransactionId: string;
  amount: number;
  reason: string;
  refundId?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  message?: string;
  error?: string;
}

/**
 * SSLCOMMERZ Payment Gateway Service
 * Documentation: https://developer.sslcommerz.com/
 */
export class SSLCommerzService {
  private config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  /**
   * Initiate a payment session
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<PaymentResponse> {
    try {
      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        total_amount: request.amount.toFixed(2),
        currency: request.currency,
        tran_id: request.orderId,
        success_url: request.successUrl,
        fail_url: request.failUrl,
        cancel_url: request.cancelUrl,
        ipn_url: request.successUrl.replace('/success', '/ipn'), // Instant Payment Notification

        // Customer info
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_phone: request.customerPhone,
        cus_add1: 'N/A',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',

        // Shipping info (required by SSLCOMMERZ)
        shipping_method: 'NO',
        num_of_item: 1,
        product_name: request.productName || `Order #${request.orderId}`,
        product_category: request.productCategory || 'E-commerce',
        product_profile: 'general',

        // Mobile wallet specific configuration
        ...(request.paymentMethod !== 'card' && {
          emi_option: 0,
        }),
      };

      console.log('[PaymentGateway] Initiating payment:', {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const response = await fetch(`${this.config.apiUrl}/gwprocess/v4/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload as any).toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[PaymentGateway] Initiation response:', {
        status: data.status,
        sessionKey: data.sessionkey ? '***' : undefined,
      });

      if (data.status === 'SUCCESS' && data.GatewayPageURL) {
        return {
          success: true,
          gatewayUrl: data.GatewayPageURL,
          transactionId: data.tran_id,
          sessionKey: data.sessionkey,
        };
      }

      return {
        success: false,
        error: data.failedreason || 'Payment initiation failed',
        errorDetails: data,
      };
    } catch (error) {
      console.error('[PaymentGateway] Initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorDetails: error,
      };
    }
  }

  /**
   * Validate payment after customer returns from gateway
   */
  async validatePayment(validationId: string): Promise<ValidationResponse> {
    try {
      const url = `${this.config.apiUrl}/validator/api/validationserverAPI.php`;
      const params = new URLSearchParams({
        val_id: validationId,
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        format: 'json',
      });

      console.log('[PaymentGateway] Validating payment:', { validationId });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[PaymentGateway] Validation response:', {
        status: data.status,
        amount: data.amount,
      });

      const isValid =
        data.status === 'VALID' ||
        data.status === 'VALIDATED' ||
        data.status === 'SUCCESS';

      return {
        isValid,
        transactionId: data.tran_id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        bankTransactionId: data.bank_tran_id,
        status: data.status,
      };
    } catch (error) {
      console.error('[PaymentGateway] Validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Process refund for a transaction
   */
  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      const refundId = request.refundId || `REF-${Date.now()}`;

      const payload = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        bank_tran_id: request.bankTransactionId,
        refund_amount: request.amount.toFixed(2),
        refund_remarks: request.reason,
        refe_id: refundId,
        format: 'json',
      };

      console.log('[PaymentGateway] Processing refund:', {
        bankTransactionId: request.bankTransactionId,
        amount: request.amount,
        refundId,
      });

      const response = await fetch(
        `${this.config.apiUrl}/validator/api/merchantTransIDvalidationAPI.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(payload as any).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[PaymentGateway] Refund response:', { status: data.status });

      if (data.status === 'success' || data.status === 'SUCCESS') {
        return {
          success: true,
          refundId,
          message: data.message || 'Refund processed successfully',
        };
      }

      return {
        success: false,
        error: data.errorReason || 'Refund failed',
      };
    } catch (error) {
      console.error('[PaymentGateway] Refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed',
      };
    }
  }

  /**
   * Get transaction details by transaction ID
   */
  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const url = `${this.config.apiUrl}/validator/api/merchantTransIDvalidationAPI.php`;
      const params = new URLSearchParams({
        tran_id: transactionId,
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        format: 'json',
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[PaymentGateway] Status check error:', error);
      return null;
    }
  }

  /**
   * Get allowed payment methods based on wallet type
   */
  private getAllowedBins(method: string): string {
    const bins: Record<string, string> = {
      bkash: 'bkash',
      nagad: 'nagad',
      rocket: 'rocket',
    };
    return bins[method] || '';
  }
}

/**
 * Factory function to create payment gateway instance
 */
export function createPaymentGateway(
  shopId?: string,
  customConfig?: Partial<PaymentGatewayConfig>
): SSLCommerzService {
  const config: PaymentGatewayConfig = {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    apiUrl:
      process.env.SSLCOMMERZ_API_URL || 'https://sandbox.sslcommerz.com',
    environment: (process.env.SSLCOMMERZ_ENV as 'sandbox' | 'production') || 'sandbox',
    ...customConfig,
  };

  // Validate configuration
  if (!config.storeId || !config.storePassword) {
    console.warn(
      '[PaymentGateway] Missing SSLCOMMERZ credentials. Please configure environment variables.'
    );
  }

  return new SSLCommerzService(config);
}

/**
 * Utility function to format Bangladesh phone numbers
 */
export function formatBDPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If starts with 0, replace with +880
  if (cleaned.startsWith('0')) {
    cleaned = '+880' + cleaned.substring(1);
  }

  // If doesn't start with +880, add it
  if (!cleaned.startsWith('+880')) {
    cleaned = '+880' + cleaned;
  }

  return cleaned;
}

/**
 * Calculate transaction fee for mobile wallets
 */
export function calculateTransactionFee(
  amount: number,
  walletType: 'bkash' | 'nagad' | 'rocket' | 'card'
): number {
  const feePercentages: Record<string, number> = {
    bkash: 1.8, // 1.8% for bKash
    nagad: 1.5, // 1.5% for Nagad
    rocket: 1.8, // 1.8% for Rocket
    card: 2.5, // 2.5% for cards
  };

  const feePercentage = feePercentages[walletType] || 0;
  return (amount * feePercentage) / 100;
}

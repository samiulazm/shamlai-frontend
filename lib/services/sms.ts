import { logger } from '@/lib/utils/logger';

// BulkSMSBD API Configuration
const BULKSMSBD_API_URL = 'http://bulksmsbd.net/api/smsapi';
const BULKSMSBD_BALANCE_API_URL = 'http://bulksmsbd.net/api/getBalanceApi';

// Lazy-load BulkSMSBD configuration to support testing with environment variables
function getBulkSMSConfig() {
  return {
    apiKey: process.env.BULKSMSBD_API_KEY,
    senderId: process.env.BULKSMSBD_SENDER_ID,
  };
}

// BulkSMSBD API Response Codes
const SMS_RESPONSE_CODES: Record<string, string> = {
  '202': 'SMS Submitted Successfully',
  '1002': 'Sender ID not correct/sender ID is disabled',
  '1003': 'Please Required all fields/Contact Your System Administrator',
  '1005': 'Internal Error',
  '1006': 'Balance Validity Not Available',
  '1007': 'Balance Insufficient',
  '1011': 'User ID not found',
  '1012': 'Masking SMS must be sent in Bengali',
  '1013': 'Sender ID has not found Gateway by api key',
  '1014': 'Sender Type Name not found using this sender by api key',
  '1015': 'Sender ID has not found Any Valid Gateway by api key',
  '1016': 'Sender Type Name Active Price Info not found by this sender id',
  '1017': 'Sender Type Name Price Info not found by this sender id',
  '1018': 'The Owner of this (username) Account is disabled',
  '1019': 'The (sender type name) Price of this (username) Account is disabled',
  '1020': 'The parent of this account is not found',
  '1021': 'The parent active (sender type name) price of this account is not found',
};

export interface SendSMSParams {
  to: string;
  message: string;
}

export interface SMSResponse {
  success: boolean;
  data?: {
    code: string;
    message: string;
  };
  error?: any;
}

/**
 * Format phone number for Bangladesh (ensure it starts with 880)
 */
function formatBangladeshiPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with +880, remove the +
  if (phone.startsWith('+880')) {
    cleaned = cleaned;
  }
  // If it starts with 880, keep it
  else if (cleaned.startsWith('880')) {
    cleaned = cleaned;
  }
  // If it starts with 01, add 88 prefix
  else if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  // If it starts with 1, add 880 prefix
  else if (cleaned.startsWith('1')) {
    cleaned = '880' + cleaned;
  }

  return cleaned;
}

/**
 * Send SMS using BulkSMSBD API
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  try {
    const config = getBulkSMSConfig();

    if (!config.apiKey || !config.senderId) {
      logger.warn('BulkSMSBD not configured, skipping SMS');
      return {
        success: false,
        error: new Error('SMS service not configured'),
      };
    }

    // Format phone number for Bangladesh
    const formattedNumber = formatBangladeshiPhoneNumber(params.to);

    // Build API URL with query parameters
    const apiUrl = new URL(BULKSMSBD_API_URL);
    apiUrl.searchParams.append('api_key', config.apiKey);
    apiUrl.searchParams.append('type', 'text');
    apiUrl.searchParams.append('number', formattedNumber);
    apiUrl.searchParams.append('senderid', config.senderId);
    apiUrl.searchParams.append('message', params.message);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
    });

    const responseText = await response.text();

    // BulkSMSBD returns a numeric code as response
    const code = responseText.trim();
    const isSuccess = code === '202';

    if (isSuccess) {
      logger.info('SMS sent successfully', {
        to: formattedNumber,
        code,
      });
      return {
        success: true,
        data: {
          code,
          message: SMS_RESPONSE_CODES[code] || 'SMS Submitted Successfully',
        },
      };
    } else {
      const errorMessage = SMS_RESPONSE_CODES[code] || `Unknown error code: ${code}`;
      logger.error('Failed to send SMS', new Error(errorMessage));
      return {
        success: false,
        error: new Error(errorMessage),
        data: {
          code,
          message: errorMessage,
        },
      };
    }
  } catch (error) {
    logger.error('Failed to send SMS', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error,
    };
  }
}

/**
 * Check SMS credit balance
 */
export async function checkSMSBalance(): Promise<{
  success: boolean;
  balance?: number;
  error?: any;
}> {
  try {
    const config = getBulkSMSConfig();

    if (!config.apiKey) {
      return {
        success: false,
        error: new Error('SMS service not configured'),
      };
    }

    const apiUrl = new URL(BULKSMSBD_BALANCE_API_URL);
    apiUrl.searchParams.append('api_key', config.apiKey);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
    });

    const balance = parseFloat(await response.text());

    return {
      success: true,
      balance,
    };
  } catch (error) {
    logger.error(
      'Failed to check SMS balance',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      success: false,
      error,
    };
  }
}

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSMS(
  phone: string,
  orderNumber: string,
  total: number,
  shopName: string
): Promise<SMSResponse> {
  const message = `${shopName}: Your order #${orderNumber} has been confirmed! Total: ${total.toFixed(2)} BDT. You will receive a tracking number soon. Thank you for your order!`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send shipment notification SMS
 */
export async function sendShipmentNotificationSMS(
  phone: string,
  orderNumber: string,
  trackingNumber: string,
  courier: string,
  trackingUrl: string
): Promise<SMSResponse> {
  const message = `Your order #${orderNumber} has shipped! Tracking: ${trackingNumber} via ${courier}. Track: ${trackingUrl}`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send delivery notification SMS
 */
export async function sendDeliveryNotificationSMS(
  phone: string,
  orderNumber: string,
  shopName: string
): Promise<SMSResponse> {
  const message = `${shopName}: Your order #${orderNumber} has been delivered! We hope you enjoy your purchase. Thank you for shopping with us!`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send order status update SMS
 */
export async function sendOrderStatusUpdateSMS(
  phone: string,
  orderNumber: string,
  status: string,
  shopName: string
): Promise<SMSResponse> {
  const statusMessages: Record<string, string> = {
    processing: 'is being processed',
    shipped: 'has been shipped',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled',
    refunded: 'has been refunded',
  };

  const statusText = statusMessages[status] || `status updated to ${status}`;
  const message = `${shopName}: Your order #${orderNumber} ${statusText}. Thank you!`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send OTP verification SMS
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<SMSResponse> {
  const message = `Your Shamlai verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send promotional SMS (with opt-out message)
 */
export async function sendPromotionalSMS(
  phone: string,
  message: string,
  shopName: string
): Promise<SMSResponse> {
  const fullMessage = `${shopName}: ${message}\n\nReply STOP to opt-out.`;

  return await sendSMS({ to: phone, message: fullMessage });
}

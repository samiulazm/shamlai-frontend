import twilio from 'twilio';
import { logger } from '@/lib/utils/logger';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSParams {
  to: string;
  message: string;
}

/**
 * Send SMS notification
 */
export async function sendSMS(params: SendSMSParams) {
  try {
    if (!client || !fromNumber) {
      logger.warn('Twilio not configured, skipping SMS');
      return { success: false, error: new Error('SMS service not configured') };
    }

    // Format phone number (ensure it starts with +)
    const toNumber = params.to.startsWith('+') ? params.to : `+${params.to}`;

    const message = await client.messages.create({
      body: params.message,
      from: fromNumber,
      to: toNumber,
    });

    logger.info('SMS sent successfully', { to: params.to, sid: message.sid });
    return { success: true, data: message };
  } catch (error) {
    logger.error('Failed to send SMS', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
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
) {
  const message = `${shopName}: Your order #${orderNumber} has been confirmed! Total: $${total.toFixed(2)}. You will receive a tracking number soon. Thank you for your order!`;

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
) {
  const message = `Your order #${orderNumber} has shipped! Tracking: ${trackingNumber} via ${courier}. Track here: ${trackingUrl}`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send delivery notification SMS
 */
export async function sendDeliveryNotificationSMS(
  phone: string,
  orderNumber: string,
  shopName: string
) {
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
) {
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
export async function sendOTPSMS(phone: string, otp: string) {
  const message = `Your Shamlai verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

  return await sendSMS({ to: phone, message });
}

/**
 * Send promotional SMS (with opt-out message)
 */
export async function sendPromotionalSMS(phone: string, message: string, shopName: string) {
  const fullMessage = `${shopName}: ${message}\n\nReply STOP to opt-out.`;

  return await sendSMS({ to: phone, message: fullMessage });
}

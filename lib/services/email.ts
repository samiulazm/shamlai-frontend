import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Shamlai <noreply@shamlai.com>';

export interface OrderConfirmationEmailParams {
  to: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shopName: string;
  shopEmail: string;
  trackingUrl?: string;
}

export interface ShipmentNotificationParams {
  to: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl: string;
  courier: string;
  shopName: string;
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
  shopName: string;
  dashboardUrl: string;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(params: OrderConfirmationEmailParams) {
  try {
    const itemsHtml = params.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4f46e5; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
          </div>

          <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.customerName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your order has been confirmed and will be shipped soon.
            </p>

            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order Number</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #111827;">${params.orderNumber}</p>
            </div>

            <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #111827;">Order Details</h2>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px; text-align: left; font-size: 14px; color: #6b7280;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 14px; color: #6b7280;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 14px; color: #6b7280;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0;">Subtotal:</td>
                  <td style="padding: 5px 0; text-align: right;">$${params.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Shipping:</td>
                  <td style="padding: 5px 0; text-align: right;">$${params.shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Tax:</td>
                  <td style="padding: 5px 0; text-align: right;">$${params.tax.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 600; font-size: 16px; border-top: 1px solid #e5e7eb;">
                  <td style="padding: 10px 0;">Total:</td>
                  <td style="padding: 10px 0; text-align: right;">$${params.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #111827;">Shipping Address</h2>
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 14px;">
              <p style="margin: 0; line-height: 1.6;">
                ${params.shippingAddress.name}<br>
                ${params.shippingAddress.street}<br>
                ${params.shippingAddress.city}, ${params.shippingAddress.state} ${params.shippingAddress.zip}<br>
                ${params.shippingAddress.country}
              </p>
            </div>

            ${
              params.trackingUrl
                ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.trackingUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                  Track Your Order
                </a>
              </div>
            `
                : ''
            }

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If you have any questions, please contact us at
              <a href="mailto:${params.shopEmail}" style="color: #4f46e5; text-decoration: none;">${params.shopEmail}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Thank you for shopping with ${params.shopName}!
            </p>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${params.shopName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Order Confirmation - ${params.orderNumber}`,
      html,
    });

    if (error) {
      logger.error('Failed to send order confirmation email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.info('Order confirmation email sent', { orderId: params.orderId, emailId: data?.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Email service error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

/**
 * Send shipment notification email
 */
export async function sendShipmentNotificationEmail(params: ShipmentNotificationParams) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Order Has Shipped</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">📦 Your Order Has Shipped!</h1>
          </div>

          <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.customerName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your order <strong>${params.orderNumber}</strong> has been shipped and is on its way to you.
            </p>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Tracking Number</p>
              <p style="margin: 0; font-size: 20px; font-weight: 600; color: #111827; font-family: monospace;">${params.trackingNumber}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Courier: ${params.courier}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.trackingUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                Track Your Package
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              You can track your package using the link above or directly on the ${params.courier} website.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Thank you for shopping with ${params.shopName}!
            </p>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${params.shopName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Your Order Has Shipped - ${params.orderNumber}`,
      html,
    });

    if (error) {
      logger.error('Failed to send shipment notification email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.info('Shipment notification email sent', { orderId: params.orderId, emailId: data?.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Email service error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

/**
 * Send welcome email to new merchants
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Shamlai</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4f46e5; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to Shamlai!</h1>
          </div>

          <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.name},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Welcome to Shamlai! We're excited to have you onboard. Your online shop <strong>${params.shopName}</strong> is ready to go.
            </p>

            <h2 style="font-size: 18px; margin: 30px 0 15px 0; color: #111827;">🚀 Quick Start Guide</h2>

            <div style="margin: 20px 0;">
              <div style="padding: 15px; border-left: 3px solid #4f46e5; background: #f9fafb; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">1. Add Your Products</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Start by adding products to your catalog with images and descriptions.</p>
              </div>

              <div style="padding: 15px; border-left: 3px solid #4f46e5; background: #f9fafb; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">2. Customize Your Store</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Make your store unique with custom themes and branding.</p>
              </div>

              <div style="padding: 15px; border-left: 3px solid #4f46e5; background: #f9fafb; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">3. Set Up Delivery</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Connect RedX or Pathao for automated delivery management.</p>
              </div>

              <div style="padding: 15px; border-left: 3px solid #4f46e5; background: #f9fafb;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">4. Go Live!</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Share your storefront link and start receiving orders.</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.dashboardUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              If you have any questions, our support team is here to help. Just reply to this email!
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Happy selling!<br>
              The Shamlai Team
            </p>
          </div>

          <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Shamlai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Welcome to Shamlai - ${params.shopName}`,
      html,
    });

    if (error) {
      logger.error('Failed to send welcome email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.info('Welcome email sent', { to: params.to, emailId: data?.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Email service error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h1 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">Reset Your Password</h1>

            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              This link will expire in 1 hour for security reasons.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your Password - Shamlai',
      html,
    });

    if (error) {
      logger.error('Failed to send password reset email', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error };
    }

    logger.info('Password reset email sent', { to, emailId: data?.id });
    return { success: true, data };
  } catch (error) {
    logger.error('Email service error', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error };
  }
}

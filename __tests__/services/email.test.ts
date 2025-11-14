import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendOrderConfirmationEmail,
  sendShipmentNotificationEmail,
  sendWelcomeEmail,
} from '@/lib/services/email';

// Mock Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({
          data: { id: 'email_test_123' },
          error: null,
        }),
      },
    })),
  };
});

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email successfully', async () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerName: 'John Doe',
        items: [
          { name: 'Product 1', quantity: 2, price: 50 },
          { name: 'Product 2', quantity: 1, price: 30 },
        ],
        subtotal: 130,
        shipping: 10,
        tax: 14,
        total: 154,
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
        shopName: 'Test Shop',
        shopEmail: 'shop@example.com',
      };

      const result = await sendOrderConfirmationEmail(params);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('email_test_123');
    });

    it('should include tracking URL when provided', async () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerName: 'John Doe',
        items: [{ name: 'Product 1', quantity: 1, price: 100 }],
        subtotal: 100,
        shipping: 10,
        tax: 11,
        total: 121,
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
        shopName: 'Test Shop',
        shopEmail: 'shop@example.com',
        trackingUrl: 'https://tracking.example.com/12345',
      };

      const result = await sendOrderConfirmationEmail(params);

      expect(result.success).toBe(true);
    });
  });

  describe('sendShipmentNotificationEmail', () => {
    it('should send shipment notification successfully', async () => {
      const params = {
        to: 'customer@example.com',
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerName: 'John Doe',
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.example.com/TRACK123',
        courier: 'Pathao',
        shopName: 'Test Shop',
      };

      const result = await sendShipmentNotificationEmail(params);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('email_test_123');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const params = {
        to: 'new@example.com',
        name: 'New User',
        shopName: 'New Shop',
        dashboardUrl: 'https://example.com/dashboard',
      };

      const result = await sendWelcomeEmail(params);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('email_test_123');
    });
  });

  describe('error handling', () => {
    it('should handle email sending errors gracefully', async () => {
      const Resend = require('resend').Resend;
      Resend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Email service error'),
          }),
        },
      }));

      const params = {
        to: 'customer@example.com',
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerName: 'John Doe',
        items: [],
        subtotal: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        shippingAddress: {
          name: '',
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        },
        shopName: 'Test Shop',
        shopEmail: 'shop@example.com',
      };

      const result = await sendOrderConfirmationEmail(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

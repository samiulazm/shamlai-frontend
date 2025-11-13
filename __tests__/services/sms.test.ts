import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendSMS,
  sendOrderConfirmationSMS,
  sendShipmentNotificationSMS,
  sendDeliveryNotificationSMS,
} from '@/lib/services/sms';

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM_test_123',
        status: 'sent',
      }),
    },
  }));
});

describe('SMS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variables
    process.env.TWILIO_ACCOUNT_SID = 'AC_test_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      const result = await sendSMS({
        to: '+15559876543',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.data?.sid).toBe('SM_test_123');
    });

    it('should format phone number with + prefix', async () => {
      const result = await sendSMS({
        to: '15559876543', // Without +
        message: 'Test message',
      });

      expect(result.success).toBe(true);
    });

    it('should handle missing Twilio configuration', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;

      const result = await sendSMS({
        to: '+15559876543',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendOrderConfirmationSMS', () => {
    it('should send order confirmation SMS', async () => {
      const result = await sendOrderConfirmationSMS(
        '+15559876543',
        'ORD-12345',
        150.00,
        'Test Shop'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendShipmentNotificationSMS', () => {
    it('should send shipment notification SMS', async () => {
      const result = await sendShipmentNotificationSMS(
        '+15559876543',
        'ORD-12345',
        'TRACK123',
        'Pathao',
        'https://tracking.example.com/TRACK123'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendDeliveryNotificationSMS', () => {
    it('should send delivery notification SMS', async () => {
      const result = await sendDeliveryNotificationSMS(
        '+15559876543',
        'ORD-12345',
        'Test Shop'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle Twilio API errors', async () => {
      const twilio = require('twilio');
      twilio.mockImplementation(() => ({
        messages: {
          create: jest.fn().mockRejectedValue(new Error('Twilio API error')),
        },
      }));

      const result = await sendSMS({
        to: '+15559876543',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

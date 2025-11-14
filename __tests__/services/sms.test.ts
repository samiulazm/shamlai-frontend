/**
 * @jest-environment node
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

import {
  sendSMS,
  sendOrderConfirmationSMS,
  sendShipmentNotificationSMS,
  sendDeliveryNotificationSMS,
  checkSMSBalance,
} from '@/lib/services/sms';

describe('SMS Service (BulkSMSBD)', () => {
  beforeEach(() => {
    // Clear all mocks
    mockFetch.mockClear();
    mockFetch.mockReset();
    // Set environment variables
    process.env.BULKSMSBD_API_KEY = 'test_api_key_123';
    process.env.BULKSMSBD_SENDER_ID = '01712345678';
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      // Mock successful response (BulkSMSBD returns "202" for success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      const result = await sendSMS({
        to: '01812345678',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.data?.code).toBe('202');
      expect(result.data?.message).toBe('SMS Submitted Successfully');
    });

    it('should format Bangladesh phone numbers correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      await sendSMS({
        to: '01812345678', // Should be converted to 8801812345678
        message: 'Test message',
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('number=8801812345678');
    });

    it('should handle phone numbers with +880 prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      await sendSMS({
        to: '+8801812345678',
        message: 'Test message',
      });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('number=8801812345678');
    });

    it('should handle missing BulkSMSBD configuration', async () => {
      delete process.env.BULKSMSBD_API_KEY;

      const result = await sendSMS({
        to: '01812345678',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle API errors', async () => {
      // Mock error response - insufficient balance
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '1007',
      } as Response);

      const result = await sendSMS({
        to: '01812345678',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.data?.code).toBe('1007');
      expect(result.data?.message).toContain('Balance Insufficient');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendSMS({
        to: '01812345678',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkSMSBalance', () => {
    it('should check SMS balance successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '150.50',
      } as Response);

      const result = await checkSMSBalance();

      expect(result.success).toBe(true);
      expect(result.balance).toBe(150.5);
    });

    it('should handle balance check errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const result = await checkSMSBalance();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendOrderConfirmationSMS', () => {
    it('should send order confirmation SMS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      const result = await sendOrderConfirmationSMS(
        '01812345678',
        'ORD-12345',
        1500.0,
        'Test Shop'
      );

      expect(result.success).toBe(true);
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('ORD-12345');
      expect(callUrl).toContain('1500.00');
      expect(callUrl).toContain('Test+Shop');
    });
  });

  describe('sendShipmentNotificationSMS', () => {
    it('should send shipment notification SMS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      const result = await sendShipmentNotificationSMS(
        '01812345678',
        'ORD-12345',
        'TRACK123',
        'Pathao',
        'https://tracking.example.com/TRACK123'
      );

      expect(result.success).toBe(true);
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('TRACK123');
      expect(callUrl).toContain('Pathao');
    });
  });

  describe('sendDeliveryNotificationSMS', () => {
    it('should send delivery notification SMS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '202',
      } as Response);

      const result = await sendDeliveryNotificationSMS('01812345678', 'ORD-12345', 'Test Shop');

      expect(result.success).toBe(true);
      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('delivered');
    });
  });
});

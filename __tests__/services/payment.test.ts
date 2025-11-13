import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createCheckoutSession, processPayment, createRefund } from '@/lib/services/payment';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
        }),
      },
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        client_secret: 'pi_test_123_secret_123',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 'rf_test_123',
        status: 'succeeded',
      }),
    },
  }));
});

// Mock InsForge
jest.mock('@/lib/insforge', () => ({
  insforgeClient: {
    database: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { transaction_id: 'pi_test_123', amount: 100 },
          error: null,
        }),
      }),
    },
  },
}));

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a Stripe checkout session successfully', async () => {
      const params = {
        orderId: 'order_123',
        amount: 100,
        currency: 'USD',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const { session, error } = await createCheckoutSession(params);

      expect(session).toBeDefined();
      expect(session?.id).toBe('cs_test_123');
      expect(session?.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(error).toBeNull();
    });

    it('should handle errors when creating checkout session', async () => {
      // Mock Stripe to throw error
      const Stripe = require('stripe');
      Stripe.mockImplementation(() => ({
        checkout: {
          sessions: {
            create: jest.fn().mockRejectedValue(new Error('Stripe API error')),
          },
        },
      }));

      const params = {
        orderId: 'order_123',
        amount: 100,
        currency: 'USD',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const { session, error } = await createCheckoutSession(params);

      expect(session).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const params = {
        orderId: 'order_123',
        paymentMethodId: 'pm_test_123',
        amount: 100,
        currency: 'USD',
        customerEmail: 'test@example.com',
      };

      const { paymentIntent, error } = await processPayment(params);

      expect(paymentIntent).toBeDefined();
      expect(paymentIntent?.id).toBe('pi_test_123');
      expect(paymentIntent?.status).toBe('succeeded');
      expect(error).toBeNull();
    });
  });

  describe('createRefund', () => {
    it('should create a refund successfully', async () => {
      const { refund, error } = await createRefund('order_123');

      expect(refund).toBeDefined();
      expect(refund?.id).toBe('rf_test_123');
      expect(error).toBeNull();
    });

    it('should handle partial refund', async () => {
      const { refund, error } = await createRefund('order_123', 50);

      expect(refund).toBeDefined();
      expect(error).toBeNull();
    });
  });
});

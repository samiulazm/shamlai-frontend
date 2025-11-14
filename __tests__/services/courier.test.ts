import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createShipment,
  trackShipment,
  createPathaoShipment,
  createRedXShipment,
} from '@/lib/services/courier';

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Courier Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variables
    process.env.PATHAO_CLIENT_ID = 'test_client_id';
    process.env.PATHAO_CLIENT_SECRET = 'test_client_secret';
    process.env.PATHAO_STORE_ID = 'test_store_id';
    process.env.REDX_API_KEY = 'test_api_key';
  });

  const mockShipmentParams = {
    orderNumber: 'ORD-12345',
    customerName: 'John Doe',
    customerPhone: '+8801234567890',
    customerAddress: {
      street: '123 Main St',
      city: 'Dhaka',
      state: 'Dhaka',
      zip: '1000',
      country: 'BD',
    },
    items: [{ name: 'Product 1', quantity: 2, price: 1000 }],
    totalAmount: 2000,
    weight: 1,
  };

  describe('Pathao Integration', () => {
    it('should create Pathao shipment successfully', async () => {
      // Mock token request
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token', expires_in: 3600 }),
        } as Response)
        // Mock shipment creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            type: 'success',
            data: { consignment_id: 'PATH123', invoice_id: 'INV123' },
          }),
        } as Response);

      const result = await createPathaoShipment(mockShipmentParams);

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toBe('PATH123');
      expect(result.consignmentId).toBe('PATH123');
    });

    it('should handle Pathao API errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token', expires_in: 3600 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ type: 'error', message: 'Invalid address' }),
        } as Response);

      const result = await createPathaoShipment(mockShipmentParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('RedX Integration', () => {
    it('should create RedX shipment successfully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          tracking_id: 'REDX123',
        }),
      } as Response);

      const result = await createRedXShipment(mockShipmentParams);

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toBe('REDX123');
    });

    it('should handle RedX API errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'API error' }),
      } as Response);

      const result = await createRedXShipment(mockShipmentParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Generic Interface', () => {
    it('should route to correct courier service', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token', expires_in: 3600 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            type: 'success',
            data: { consignment_id: 'PATH123', invoice_id: 'INV123' },
          }),
        } as Response);

      const result = await createShipment('pathao', mockShipmentParams);

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toBe('PATH123');
    });

    it('should handle invalid courier type', async () => {
      const result = await createShipment('invalid' as any, mockShipmentParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid courier type');
    });
  });

  describe('Tracking', () => {
    it('should track Pathao shipment', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test_token', expires_in: 3600 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              order_status: 'delivered',
              order_logs: [
                { status: 'delivered', timestamp: '2025-01-13T10:00:00Z' },
              ],
            },
          }),
        } as Response);

      const result = await trackShipment('pathao', 'PATH123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('delivered');
    });

    it('should track RedX shipment', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          current_status: 'in_transit',
          tracking_history: [],
        }),
      } as Response);

      const result = await trackShipment('redx', 'REDX123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('in_transit');
    });
  });
});

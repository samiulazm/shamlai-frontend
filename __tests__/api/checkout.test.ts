import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/insforge');
jest.mock('@/lib/services/order-workflows');
jest.mock('@/lib/services/orders');

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create order successfully', async () => {
    const requestBody = {
      shopId: 'shop_123',
      customerEmail: 'customer@example.com',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerPhone: '+15551234567',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      items: [
        {
          productId: 'prod_123',
          quantity: 2,
        },
      ],
      paymentMethod: 'cod',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.order).toBeDefined();
  });

  it('should validate required fields', async () => {
    const requestBody = {
      shopId: 'shop_123',
      // Missing required fields
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should handle insufficient stock', async () => {
    const requestBody = {
      shopId: 'shop_123',
      customerEmail: 'customer@example.com',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      items: [
        {
          productId: 'prod_out_of_stock',
          quantity: 100,
        },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Insufficient stock');
  });

  it('should apply discount codes correctly', async () => {
    const requestBody = {
      shopId: 'shop_123',
      customerEmail: 'customer@example.com',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      items: [
        {
          productId: 'prod_123',
          quantity: 1,
        },
      ],
      discountCode: 'SAVE10',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

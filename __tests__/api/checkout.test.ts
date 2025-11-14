import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/insforge', () => {
  const mockProducts = {
    prod_123: {
      id: 'prod_123',
      name: 'Test Product',
      stock_quantity: 10,
      price: 100,
      sku: 'SKU123',
      image_url: 'image.png',
    },
    prod_out_of_stock: {
      id: 'prod_out_of_stock',
      name: 'Out of Stock',
      stock_quantity: 0,
      price: 50,
      sku: 'SKU-OUT',
      image_url: 'image.png',
    },
  };

  function buildQuery(table: string) {
    const filters: Record<string, any> = {};
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn((field: string, value: any) => {
        filters[field] = value;
        return builder;
      }),
      single: jest.fn(async () => {
        switch (table) {
          case 'products':
            return { data: mockProducts[filters.id] || null };
          case 'shipping_methods':
            return { data: { cost: 15 } };
          case 'discount_codes':
            if ((filters.code || '').toUpperCase() === 'SAVE10') {
              return {
                data: {
                  id: 'discount_123',
                  code: 'SAVE10',
                  discount_type: 'percentage',
                  discount_value: 10,
                  usage_limit: null,
                  usage_count: 0,
                  minimum_purchase: 0,
                },
              };
            }
            return { data: null };
          case 'product_variants':
            return { data: { price: 120 } };
          default:
            return { data: null };
        }
      }),
      update: jest.fn(() => ({
        eq: jest.fn(async () => ({ data: null })),
      })),
    };
    return builder;
  }

  return {
    insforgeClient: {
      database: {
        from: (table: string) => buildQuery(table),
      },
    },
  };
});

jest.mock('@/lib/services/order-workflows', () => ({
  processNewOrder: jest.fn(async (_orderData, _items) => ({
    success: true,
    order: {
      id: 'order_123',
      order_number: 'ORD-123',
      total: _orderData.total,
      status: 'pending',
    },
  })),
}));

jest.mock('@/lib/services/orders', () => ({
  getOrCreateCustomer: jest.fn(async (_shopId, email, firstName, lastName, phone) => ({
    id: 'customer_123',
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
  })),
}));

type CheckoutRouteModule = typeof import('@/app/api/checkout/route');
let POST: CheckoutRouteModule['POST'];

beforeAll(async () => {
  ({ POST } = await import('@/app/api/checkout/route'));
});

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

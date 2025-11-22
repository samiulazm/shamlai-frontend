import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase', () => {
  const mockProducts = {
    prod_123: {
      id: 'prod_123',
      name: 'Test Product',
      stock_quantity: 10,
      price: 100,
      sku: 'SKU123',
      image_url: 'image.png',
      track_inventory: true,
      category_id: 'cat_123',
      taxable: true,
    },
    prod_out_of_stock: {
      id: 'prod_out_of_stock',
      name: 'Out of Stock',
      stock_quantity: 0,
      price: 50,
      sku: 'SKU-OUT',
      image_url: 'image.png',
      track_inventory: true,
      category_id: 'cat_123',
      taxable: true,
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

  const mockClient = {
    from: (table: string) => buildQuery(table),
    auth: {
      setAccessToken: jest.fn(),
      getCurrentUser: jest.fn(),
    },
  };

  return {
    supabaseClient: mockClient,
    getSupabaseClient: jest.fn(() => mockClient),
  };
});

jest.mock('@/lib/services/order-workflows', () => ({
  processNewOrder: jest.fn(async (_orderData: any, _items: any) => ({
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

jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(async () => ({
    id: 'user_123',
    email: 'test@example.com',
    role: 'shop_owner',
    shopIds: ['shop_123'],
    permissions: ['order:create', 'order:read'],
  })),
}));

jest.mock('@/lib/services/tax', () => ({
  calculateTax: jest.fn(async () => ({
    taxRate: 0.1,
    taxAmount: 10,
    taxName: 'Sales Tax',
    breakdown: [{ name: 'Sales Tax', rate: 0.1, amount: 10, isCompound: false }],
  })),
}));

jest.mock('@/lib/services/audit', () => ({
  auditOrderChange: jest.fn(async () => {}),
  AuditAction: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  },
}));

jest.mock('@/lib/database/transaction', () => ({
  acquireLock: jest.fn(async () => async () => {}), // Returns a release function
  withRetry: jest.fn(async (fn: any) => fn()), // Just execute the function
}));

jest.mock('@/lib/validation/validator', () => ({
  validateBody: jest.fn(async (request: any, schema: any) => {
    const body = await request.json();
    // Basic validation - check for required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      const error = new Error('Missing required fields');
      (error as any).statusCode = 400;
      throw error;
    }
    if (!body.shippingAddress) {
      const error = new Error('Missing required fields');
      (error as any).statusCode = 400;
      throw error;
    }
    // Return validated body with proper structure
    return {
      ...body,
      shippingAddress: body.shippingAddress,
      items: body.items,
      shippingMethodId: body.shippingMethodId || '00000000-0000-0000-0000-000000000001',
      paymentMethodId: body.paymentMethodId || '00000000-0000-0000-0000-000000000002',
    };
  }),
}));

jest.mock('@/lib/middleware/rate-limit', () => ({
  rateLimitEndpoint: {
    checkout: jest.fn(async () => null), // No rate limit response
  },
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
      customerEmail: 'customer@example.com',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '+15551234567',
      },
      items: [
        {
          productId: 'prod_123',
          quantity: 2,
        },
      ],
      shippingMethodId: '00000000-0000-0000-0000-000000000001',
      paymentMethodId: '00000000-0000-0000-0000-000000000002',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.order).toBeDefined();
  });

  it('should validate required fields', async () => {
    const requestBody = {
      // Missing required fields
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.message || data.error).toBeDefined();
  });

  it('should handle insufficient stock', async () => {
    const requestBody = {
      customerEmail: 'customer@example.com',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '+15551234567',
      },
      items: [
        {
          productId: 'prod_out_of_stock',
          quantity: 100,
        },
      ],
      shippingMethodId: '00000000-0000-0000-0000-000000000001',
      paymentMethodId: '00000000-0000-0000-0000-000000000002',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    // Handle both old error format and new structured format
    const errorText = JSON.stringify(data);
    expect(errorText).toContain('Insufficient stock');
  });

  it('should apply discount codes correctly', async () => {
    const requestBody = {
      customerEmail: 'customer@example.com',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '+15551234567',
      },
      items: [
        {
          productId: 'prod_123',
          quantity: 1,
        },
      ],
      discountCode: 'SAVE10',
      shippingMethodId: '00000000-0000-0000-0000-000000000001',
      paymentMethodId: '00000000-0000-0000-0000-000000000002',
    };

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

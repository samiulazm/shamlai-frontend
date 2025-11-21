// Order Service - Comprehensive order management functions
import { supabaseClient, executeWithRetry } from '../supabase';
import { logger } from '../utils/logger';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  Customer,
  PaginatedResponse,
  QueryFilters,
} from '../types/database';
import { updateInventory } from './products';

// ============================================================================
// Order CRUD Operations
// ============================================================================

/**
 * Get all orders with filtering and pagination
 */
export async function getOrders(
  shopId: string,
  filters?: QueryFilters & {
    status?: OrderStatus;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    deliveryMethod?: string;
  }
): Promise<PaginatedResponse<Order>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient.from('orders').select('*', { count: 'exact' }).eq('shop_id', shopId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.deliveryMethod) {
      query = query.eq('delivery_method', filters.deliveryMethod);
    }
    if (filters?.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
      );
    }

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortBy, sortOrder);

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    };
  } catch (error: any) {
    logger.error(
      'Error fetching orders',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        filters,
      }
    );
    throw error;
  }
}

/**
 * Get a single order by ID with items
 */
export async function getOrderById(orderId: string): Promise<
  Order & {
    items?: OrderItem[];
    customer?: Customer;
  }
> {
  try {
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    if (!order) throw new Error('Order not found');

    // Fetch order items and customer
    const [itemsResult, customerResult] = await Promise.all([
      supabaseClient.from('order_items').select('*').eq('order_id', orderId),

      supabaseClient.from('customers').select('*').eq('id', order.customer_id).single(),
    ]);

    return {
      ...order,
      items: itemsResult.data || [],
      customer: customerResult.data || undefined,
    };
  } catch (error: any) {
    logger.error(
      'Error fetching order',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderId,
      }
    );
    throw error;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<
  Order & {
    items?: OrderItem[];
  }
> {
  try {
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;
    if (!order) throw new Error('Order not found');

    return await getOrderById(order.id);
  } catch (error: any) {
    logger.error(
      'Error fetching order by number',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderNumber,
      }
    );
    throw error;
  }
}

/**
 * Create a new order
 */
export async function createOrder(
  orderData: Omit<OrderInsert, 'order_number'>,
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]
): Promise<Order> {
  try {
    // Generate unique order number using timestamp and random bytes
    // Using crypto.getRandomValues for better randomness than Math.random()
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(6);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    }
    const randomStr = Array.from(randomBytes)
      .map((b) => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 9)
      .toUpperCase();
    const orderNumber = `ORD-${timestamp}-${randomStr}`;

    // Create order with retry logic for reliability
    const { data: order, error: orderError } = await executeWithRetry(async () => {
      const result = await supabaseClient
        .from('orders')
        .insert([{ ...orderData, order_number: orderNumber }])
        .select()
        .single();
      return result;
    });

    if (orderError || !order) throw orderError || new Error('Failed to create order');

    // Create order items with retry logic
    const orderItems = items.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await executeWithRetry(async () => {
      const result = await supabaseClient.from('order_items').insert(orderItems);
      return result;
    });

    if (itemsError) throw itemsError;

    // Update inventory for each item
    for (const item of items) {
      await updateInventory(
        item.product_id,
        -item.quantity, // Negative for sale
        item.variant_id,
        `Order ${orderNumber}`,
        'sale',
        order.id
      );
    }

    // Update customer stats
    await updateCustomerStats(order.customer_id);

    return order;
  } catch (error: any) {
    logger.error(
      'Error creating order',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId: orderData.shop_id,
      }
    );
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  comment?: string,
  notifyCustomer: boolean = true,
  userId?: string
): Promise<Order> {
  try {
    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Set status-specific timestamps
    if (newStatus === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    }
    if (newStatus === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    }
    if (newStatus === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }

    // Update order with retry logic
    const { data: order, error } = await executeWithRetry(async () => {
      const result = await supabaseClient
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();
      return result;
    });

    if (error || !order) throw error || new Error('Failed to update order');

    // Log status change with retry logic
    await executeWithRetry(async () => {
      const result = await supabaseClient.from('order_status_history').insert([
        {
          order_id: orderId,
          status: newStatus,
          comment,
          notify_customer: notifyCustomer,
          created_by: userId,
        },
      ]);
      return result;
    });

    return order;
  } catch (error: any) {
    logger.error(
      'Error updating order status',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderId,
        status,
      }
    );
    throw error;
  }
}

/**
 * Update order
 */
export async function updateOrder(orderId: string, updates: OrderUpdate): Promise<Order> {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating order',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderId,
      }
    );
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  userId?: string
): Promise<Order> {
  try {
    // Get order items to restore inventory
    const { data: items } = await supabaseClient
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    // Restore inventory for each item
    if (items) {
      for (const item of items) {
        await updateInventory(
          item.product_id,
          item.quantity, // Positive to restore
          item.variant_id,
          `Order cancelled: ${reason}`,
          'return',
          orderId
        );
      }
    }

    // Update order status
    const order = await updateOrderStatus(orderId, 'cancelled', reason, true, userId);

    // Update order cancellation details
    return await updateOrder(orderId, {
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    });
  } catch (error: any) {
    logger.error(
      'Error cancelling order',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderId,
        reason,
      }
    );
    throw error;
  }
}

/**
 * Get order status history
 */
export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
  try {
    const { data, error } = await supabaseClient
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching order status history',
      error instanceof Error ? error : new Error(String(error)),
      {
        orderId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Customer Functions
// ============================================================================

/**
 * Get or create customer
 */
export async function getOrCreateCustomer(
  shopId: string,
  email: string,
  firstName: string,
  lastName: string,
  phone?: string,
  userId?: string
): Promise<Customer> {
  try {
    // Try to find existing customer
    const { data: existing } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .eq('email', email)
      .single();

    if (existing) {
      return existing;
    }

    // Create new customer
    const { data: customer, error } = await supabaseClient
      .from('customers')
      .insert([
        {
          shop_id: shopId,
          user_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          accepts_marketing: false,
          total_orders: 0,
          total_spent: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return customer;
  } catch (error: any) {
    logger.error(
      'Error getting or creating customer',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        email,
      }
    );
    throw error;
  }
}

/**
 * Update customer statistics
 */
async function updateCustomerStats(customerId: string): Promise<void> {
  try {
    // Get all completed orders for this customer
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('total, status')
      .eq('customer_id', customerId)
      .in('status', ['delivered', 'shipped', 'processing']);

    if (orders) {
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

      await supabaseClient
        .from('customers')
        .update({
          total_orders: totalOrders,
          total_spent: totalSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }
  } catch (error: any) {
    logger.error(
      'Error updating customer stats',
      error instanceof Error ? error : new Error(String(error)),
      {
        customerId,
      }
    );
    // Don't throw, this is a background task
  }
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(
  customerId: string,
  filters?: QueryFilters
): Promise<PaginatedResponse<Order>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('customer_id', customerId);

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortBy, sortOrder);

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    };
  } catch (error: any) {
    logger.error(
      'Error fetching customer orders',
      error instanceof Error ? error : new Error(String(error)),
      {
        customerId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Analytics & Reports
// ============================================================================

/**
 * Get order statistics for a shop
 */
export async function getOrderStats(
  shopId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}> {
  try {
    let query = supabaseClient.from('orders').select('*').eq('shop_id', shopId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const totalRevenue =
      orders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus: Record<OrderStatus, number> = {
      pending: 0,
      rts: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      pending_return: 0,
      returned: 0,
      partial: 0,
      cancelled: 0,
      pending_cancel: 0,
      preorder: 0,
      lost: 0,
      refunded: 0,
    };

    orders?.forEach((order) => {
      const status = order.status as OrderStatus;
      if (status in ordersByStatus) {
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
    };
  } catch (error: any) {
    const { logger } = await import('../utils/logger');
    logger.error(
      'Error fetching order stats',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

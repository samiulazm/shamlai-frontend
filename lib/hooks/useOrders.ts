// React hooks for order operations
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Order, OrderStatus, PaginatedResponse, QueryFilters, OrderInsert, OrderItem } from '../types/database';
import * as orderService from '../services/orders';

/**
 * Custom hook to create stable reference for filters
 */
function useStableFilters(filters?: QueryFilters) {
  const filtersRef = useRef<string>('');
  const currentFilters = JSON.stringify(filters || {});

  if (filtersRef.current !== currentFilters) {
    filtersRef.current = currentFilters;
  }

  return filtersRef.current;
}

/**
 * Hook to fetch orders with pagination and filtering
 */
export function useOrders(shopId: string, filters?: QueryFilters) {
  const [orders, setOrders] = useState<PaginatedResponse<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stableFilters = useStableFilters(filters);

  useEffect(() => {
    let mounted = true;

    async function fetchOrders() {
      try {
        setLoading(true);
        const data = await orderService.getOrders(shopId, filters);
        if (mounted) {
          setOrders(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch orders');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, [shopId, stableFilters]);

  return { orders, loading, error };
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(orderId);
        if (mounted) {
          setOrder(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch order');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      fetchOrder();
    }

    return () => {
      mounted = false;
    };
  }, [orderId]);

  return { order, loading, error };
}

/**
 * Hook to fetch order statistics
 */
interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export function useOrderStats(shopId: string, startDate?: string, endDate?: string) {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        const data = await orderService.getOrderStats(shopId, startDate, endDate);
        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch stats');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [shopId, startDate, endDate]);

  return { stats, loading, error };
}

/**
 * Hook for order mutations
 */
export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: Omit<OrderInsert, 'order_number'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]) => {
    try {
      setLoading(true);
      setError(null);
      const order = await orderService.createOrder(orderData, items);
      setLoading(false);
      return order;
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      setLoading(false);
      throw err;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    comment?: string,
    notifyCustomer?: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);
      const order = await orderService.updateOrderStatus(orderId, status, comment, notifyCustomer);
      setLoading(false);
      return order;
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
      setLoading(false);
      throw err;
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      const order = await orderService.cancelOrder(orderId, reason);
      setLoading(false);
      return order;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
      setLoading(false);
      throw err;
    }
  };

  return {
    createOrder,
    updateOrderStatus,
    cancelOrder,
    loading,
    error
  };
}






'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseClient, OrderService } from '@/lib';
import type { Order, OrderStatus } from '@/lib/types/database';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderTable from '@/components/orders/OrderTable';

export default function AllOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      setShopId(user.id);
      const ordersData = await OrderService.getOrders(user.id, {
        page: 1,
        pageSize: 100,
      });

      setOrders(ordersData.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading all orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <p className="text-sm text-gray-600 mt-1">View all orders regardless of status</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          New Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}

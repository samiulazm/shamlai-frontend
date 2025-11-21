'use client';

import { useEffect, useState } from 'react';
import { supabaseClient, OrderService } from '@/lib';
import type { Order } from '@/lib/types/database';
import OrderTable from '@/components/orders/OrderTable';

export default function WebPreorders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreorders();
  }, []);

  const fetchPreorders = async () => {
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

      // Fetch web orders with preorder status
      const ordersData = await OrderService.getOrders(user.id, {
        page: 1,
        pageSize: 100,
        status: 'preorder' as any,
      });

      setOrders(ordersData.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch web preorders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading web preorders...</div>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Web Preorders</h1>
        <p className="text-sm text-gray-600 mt-1">Manage preorders from your web store</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No web preorders found</p>
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}

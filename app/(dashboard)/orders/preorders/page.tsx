'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { insforgeClient, OrderService } from '@/lib';
import type { Order } from '@/lib/types/database';
import OrderTable from '@/components/orders/OrderTable';

export default function Preorders() {
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

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      const ordersData = await OrderService.getOrders(user.user.id, {
        page: 1,
        pageSize: 100,
        status: 'preorder' as any,
      });

      setOrders(ordersData.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch preorders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading preorders...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Preorder List</h1>
          <p className="text-sm text-gray-600 mt-1">Manage preorders and reservations</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          New Preorder
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">No preorders found</p>
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}

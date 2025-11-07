"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { insforgeClient, OrderService } from "@/lib";
import type { Order } from "@/lib/types/database";

export default function Orders(){
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch orders using the service
      const response = await OrderService.getOrders(user.user.id, {
        page: 1,
        pageSize: 50
      });

      setOrders(response.data || []);
    } catch (err: any) {
      const { logger } = await import('@/lib/utils/logger');
      logger.error('Error fetching orders', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`badge ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Link href="/orders/new" className="btn btn-primary">Create Order</Link>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchOrders} className="btn btn-outline">Try Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link href="/orders/new" className="btn btn-primary">Create Order</Link>
      </div>
      
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {orders.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="py-3 font-mono text-sm">#{order.id.slice(-8)}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <div>
                        <div className="font-medium">{order.customer_email}</div>
                        {order.customer_phone && (
                          <div className="text-sm text-gray-500">{order.customer_phone}</div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <span className={`badge ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : order.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1)}
                      </span>
                    </td>
                    <td className="font-medium">৳{order.total?.toLocaleString() || '0'}</td>
                    <td>
                      <Link 
                        href={`/orders/${order.id}` as any} 
                        className="text-brand-indigo hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-4">Orders will appear here when customers make purchases</p>
                <Link href="/products" className="btn btn-primary">Add Products</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

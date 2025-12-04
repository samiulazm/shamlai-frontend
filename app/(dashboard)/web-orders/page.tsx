'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabaseClient, OrderService } from '@/lib';
import type { Order } from '@/lib/types/database';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { logger } from '@/lib/utils/logger';

export default function WebOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchWebOrders();
  }, []);

  const fetchWebOrders = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) return;

      setShopId(user.id);

      // Fetch web orders (orders with source='web')
      const response = await OrderService.getOrders(user.id, {
        page: 1,
        pageSize: 100,
      });

      // Filter web orders
      const webOrders =
        response.data?.filter(
          (order) => (order as any).source === 'web' || order.status === 'pending'
        ) || [];

      setOrders(webOrders);
    } catch (error) {
      logger.error(
        'Error fetching web orders',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId: string) => {
    try {
      await OrderService.updateOrder(orderId, {
        status: 'processing',
      });
      await fetchWebOrders();
    } catch (error) {
      logger.error(
        'Error approving order',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error approving order');
    }
  };

  const approveSelected = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }

    try {
      const promises = Array.from(selectedOrders).map((orderId) =>
        OrderService.updateOrder(orderId, { status: 'processing' })
      );
      await Promise.all(promises);
      await fetchWebOrders();
      setSelectedOrders(new Set());
      alert(`Successfully approved ${selectedOrders.size} order(s)`);
    } catch (error) {
      logger.error(
        'Error approving orders',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error approving orders');
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order?')) return;

    try {
      await OrderService.updateOrder(orderId, {
        status: 'cancelled',
      });
      await fetchWebOrders();
    } catch (error) {
      logger.error(
        'Error rejecting order',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error rejecting order');
    }
  };

  const toggleSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading web orders...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status !== 'pending');

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Web Order List</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendingOrders.length} pending orders • {approvedOrders.length} approved
          </p>
        </div>
        {selectedOrders.size > 0 && (
          <button onClick={approveSelected} className="btn btn-primary flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approve Selected ({selectedOrders.size})
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Approval</div>
                <div className="text-2xl font-bold mt-1">{pendingOrders.length}</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Web Orders</div>
                <div className="text-2xl font-bold mt-1">{orders.length}</div>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Selected</div>
                <div className="text-2xl font-bold mt-1">{selectedOrders.size}</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No web orders</h3>
              <p className="text-gray-500 mb-4">
                Web orders will appear here when customers place orders on your website
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onChange={selectAll}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">
                    Select all ({selectedOrders.size} selected)
                  </span>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className={selectedOrders.has(order.id) ? 'bg-blue-50' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelection(order.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="font-mono text-sm">
                        {order.order_number || `#${order.id.slice(-8)}`}
                      </td>
                      <td className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">{order.customer_email}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td>
                        <span
                          className={`badge text-xs ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="font-medium">৳{order.total?.toLocaleString() || '0'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveOrder(order.id)}
                                className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => rejectOrder(order.id)}
                                className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {order.status !== 'pending' && (
                            <span className="text-sm text-gray-500">Approved</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Check, X, Save, AlertCircle } from 'lucide-react';
import { supabaseClient, OrderService } from '@/lib';
import type { Order, OrderStatus } from '@/lib/types/database';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { logger } from '@/lib/utils/logger';

export default function SuperEdit() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string>('');
  const [bulkUpdate, setBulkUpdate] = useState<{
    status?: OrderStatus;
    paymentStatus?: string;
    deliveryMethod?: string;
  }>({});
  const [previewMode, setPreviewMode] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) return;

      setShopId(user.id);
      const response = await OrderService.getOrders(user.id, {
        page: 1,
        pageSize: 100,
      });

      setOrders(response.data || []);
    } catch (error) {
      logger.error(
        'Error fetching orders',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
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

  const applyBulkUpdate = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }

    if (!bulkUpdate.status && !bulkUpdate.paymentStatus && !bulkUpdate.deliveryMethod) {
      alert('Please select at least one field to update');
      return;
    }

    try {
      setSaving(true);
      const updates: any = {};

      if (bulkUpdate.status) updates.status = bulkUpdate.status;
      if (bulkUpdate.paymentStatus) updates.payment_status = bulkUpdate.paymentStatus;
      if (bulkUpdate.deliveryMethod) updates.delivery_method = bulkUpdate.deliveryMethod;

      // Update each selected order
      const updatePromises = Array.from(selectedOrders).map((orderId) =>
        OrderService.updateOrder(orderId, updates)
      );

      await Promise.all(updatePromises);

      // Refresh orders
      await fetchOrders();
      setSelectedOrders(new Set());
      setBulkUpdate({});
      alert(`Successfully updated ${selectedOrders.size} order(s)`);
    } catch (error) {
      logger.error(
        'Error updating orders',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error updating orders. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPreviewCount = () => {
    if (!bulkUpdate.status && !bulkUpdate.paymentStatus && !bulkUpdate.deliveryMethod) {
      return 0;
    }
    return selectedOrders.size;
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

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Edit</h1>
          <p className="text-gray-500 text-sm mt-1">Bulk edit multiple orders at once</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedOrders.size} of {orders.length} selected
          </span>
        </div>
      </div>

      {/* Bulk Update Form */}
      <div className="card">
        <div className="card-pad">
          <h2 className="text-lg font-semibold mb-4">Bulk Update</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={bulkUpdate.status || ''}
                onChange={(e) =>
                  setBulkUpdate({
                    ...bulkUpdate,
                    status: (e.target.value as OrderStatus) || undefined,
                  })
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="">No change</option>
                <option value="pending">Pending</option>
                <option value="rts">RTS</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="pending_return">Pending Return</option>
                <option value="returned">Returned</option>
                <option value="partial">Partial</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending_cancel">Pending Cancel</option>
                <option value="preorder">Preorder</option>
                <option value="lost">Lost</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={bulkUpdate.paymentStatus || ''}
                onChange={(e) =>
                  setBulkUpdate({ ...bulkUpdate, paymentStatus: e.target.value || undefined })
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="">No change</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method
              </label>
              <input
                type="text"
                value={bulkUpdate.deliveryMethod || ''}
                onChange={(e) =>
                  setBulkUpdate({ ...bulkUpdate, deliveryMethod: e.target.value || undefined })
                }
                placeholder="e.g., Pathao, Steadfast"
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          {getPreviewCount() > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-blue-900">Preview</div>
                  <div className="text-sm text-blue-700 mt-1">
                    {getPreviewCount()} order(s) will be updated with:
                    {bulkUpdate.status && <div>• Status: {bulkUpdate.status}</div>}
                    {bulkUpdate.paymentStatus && (
                      <div>• Payment Status: {bulkUpdate.paymentStatus}</div>
                    )}
                    {bulkUpdate.deliveryMethod && (
                      <div>• Delivery Method: {bulkUpdate.deliveryMethod}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={applyBulkUpdate}
              disabled={selectedOrders.size === 0 || saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : `Apply to ${selectedOrders.size} Order(s)`}
            </button>
            <button
              onClick={() => {
                setSelectedOrders(new Set());
                setBulkUpdate({});
              }}
              className="btn btn-outline"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No orders found</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={selectedOrders.has(order.id) ? 'bg-blue-50' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="font-mono text-sm">
                      {order.order_number || `#${order.id.slice(-8)}`}
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
                    <td className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import * as OrderService from '@/lib/services/orders';
import { logger } from '@/lib/utils/logger';
import type { Order, OrderItem } from '@/lib/types/database';

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop_id for the current user
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) {
        setError('Shop not found');
        return;
      }

      setShopId(shop.shop_id);

      // Fetch order with items
      const orderData = await OrderService.getOrderById(orderId);

      if (!orderData || orderData.shop_id !== shop.shop_id) {
        setError('Order not found');
        return;
      }

      setOrder(orderData);
      setOrderItems(orderData.items || []);
    } catch (err: any) {
      logger.error('Error fetching order', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to load order');
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
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`badge ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`badge ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <Link href="/orders" className="btn btn-outline">
            Back to Orders
          </Link>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error || 'Order not found'}</p>
              <Link href="/orders" className="btn btn-outline">
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Link href="/orders" className="btn btn-outline">
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Order Status */}
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div>{getStatusBadge(order.status)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                <div>{getPaymentStatusBadge(order.payment_status)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Fulfillment Status</div>
                <div className="capitalize">{order.fulfillment_status}</div>
              </div>
              {order.tracking_number && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Tracking Number</div>
                  <div className="font-mono text-sm">{order.tracking_number}</div>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-indigo text-sm hover:underline"
                    >
                      Track Package
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-gray-500">Name</div>
                <div className="font-medium">
                  {order.shipping_first_name} {order.shipping_last_name}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium">{order.customer_email}</div>
              </div>
              {order.customer_phone && (
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium">{order.customer_phone}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.product_name}</td>
                      <td>{item.variant_name || '-'}</td>
                      <td className="font-mono text-sm">{item.sku || '-'}</td>
                      <td>{item.quantity}</td>
                      <td>৳{item.price.toFixed(2)}</td>
                      <td className="font-semibold">৳{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Shipping Address */}
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-700 text-sm">
              <div className="font-medium">
                {order.shipping_first_name} {order.shipping_last_name}
              </div>
              <div>{order.shipping_address1}</div>
              {order.shipping_address2 && <div>{order.shipping_address2}</div>}
              <div>
                {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
              </div>
              <div>{order.shipping_country}</div>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Billing Address</h2>
            <div className="text-gray-700 text-sm">
              <div className="font-medium">
                {order.billing_first_name} {order.billing_last_name}
              </div>
              <div>{order.billing_address1}</div>
              {order.billing_address2 && <div>{order.billing_address2}</div>}
              <div>
                {order.billing_city}, {order.billing_state} {order.billing_postal_code}
              </div>
              <div>{order.billing_country}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card">
        <div className="card-pad">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm max-w-md ml-auto">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-৳{order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>৳{order.shipping_cost.toFixed(2)}</span>
            </div>
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>৳{order.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>৳{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-2">Order Notes</h2>
            <p className="text-gray-700 text-sm">{order.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

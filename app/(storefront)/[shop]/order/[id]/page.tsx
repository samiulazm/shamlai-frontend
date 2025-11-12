'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { insforgeClient, OrderService } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";
import type { Order, OrderItem } from "@/lib/types/database";

export default function OrderConfirmation({ params }: { params: { id: string } }){
  const routerParams = useParams();
  const shopId = routerParams.shop as string;
  const orderId = params.id;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order with items
      const orderData = await OrderService.getOrderById(orderId);

      if (!orderData || orderData.shop_id !== shopId) {
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

  if (loading) {
    return (
      <div className="container-responsive py-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--theme-primary)' }}></div>
            <p className="mt-4 text-gray-600">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-responsive py-16 text-center">
        <div className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</div>
        <p className="text-gray-600 mb-4">{error || 'This order does not exist or is no longer available.'}</p>
        <Link href={`/${shopId}`} className="btn btn-outline">Back to Shop</Link>
      </div>
    );
  }

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

  return (
    <div className="container-responsive py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you!</h1>
          <p className="text-gray-600">Your order has been placed successfully.</p>
        </div>

        <div className="card mb-6">
          <div className="card-pad">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500">Order Number</div>
                <div className="text-lg font-semibold">{order.order_number}</div>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                <div className="font-medium capitalize">{order.payment_status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Order Date</div>
                <div className="font-medium">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {orderItems.length > 0 && (
          <div className="card mb-6">
            <div className="card-pad">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <div className="font-medium">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-sm text-gray-600">{item.variant_name}</div>
                      )}
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">৳{item.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">৳{item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <div className="font-medium">{order.shipping_first_name} {order.shipping_last_name}</div>
              <div>{order.shipping_address1}</div>
              {order.shipping_address2 && <div>{order.shipping_address2}</div>}
              <div>{order.shipping_city}, {order.shipping_postal_code}</div>
              <div>{order.shipping_country}</div>
              {order.shipping_phone && (
                <div className="mt-2 text-sm text-gray-600">Phone: {order.shipping_phone}</div>
              )}
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
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

        <div className="text-center space-y-4">
          <div className="inline-block rounded-xl border px-6 py-3 text-sm text-gray-700 bg-gray-50">
            <div className="font-medium mb-1">Track your order</div>
            <div className="text-gray-600">Order #{order.order_number}</div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href={`/${shopId}`} className="btn btn-outline">
              Continue Shopping
            </Link>
            <Link href={`/${shopId}/order/${order.id}`} className="btn btn-primary">
              View Order Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

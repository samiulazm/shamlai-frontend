'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, MapPin, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  courier_name?: string;
  shipping_street?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  payment_status: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      name: string;
      image_url?: string;
    };
  }>;
  statusHistory: Array<{
    status: string;
    created_at: string;
    comment?: string;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadOrderDetails(params.id as string);
    }
  }, [params.id]);

  const loadOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);

      // Get order
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      // Get order items with product details
      const { data: items } = await supabaseClient
        .from('order_items')
        .select(
          `
          *,
          product:products(name, image_url)
        `
        )
        .eq('order_id', orderId);

      // Get status history
      const { data: statusHistory } = await supabaseClient
        .from('order_status_history')
        .select('status, created_at, comment')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      setOrder({
        ...orderData,
        items: items || [],
        statusHistory: statusHistory || [],
      });

      setLoading(false);
    } catch (err) {
      logger.error(
        'Failed to load order details',
        err instanceof Error ? err : new Error(String(err))
      );
      setError('Failed to load order');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">{error || 'Order not found'}</p>
        <Link
          href={'/account/orders' as any}
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'processing', label: 'Processing', icon: CheckCircle },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  const getCurrentStepIndex = () => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    return statusOrder.indexOf(order.status);
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Link
          href={'/account/orders' as any}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{order.order_number}</h2>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-medium rounded-full ${
              statusColors[order.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress Tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isCompleted ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tracking Info */}
      {order.tracking_number && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Truck className="w-6 h-6 text-indigo-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Tracking Information</h3>
              <p className="text-sm text-gray-600 mt-1">Courier: {order.courier_name || 'N/A'}</p>
              <p className="text-sm font-mono text-gray-900 mt-2">
                Tracking Number: {order.tracking_number}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4">
                {item.product?.image_url && (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h4>
                  <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${parseFloat(item.total.toString()).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${parseFloat(item.price.toString()).toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  ${parseFloat(order.subtotal.toString()).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  ${parseFloat(order.shipping.toString()).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${parseFloat(order.tax.toString()).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">
                    -${parseFloat(order.discount.toString()).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${parseFloat(order.total.toString()).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <address className="text-sm text-gray-600 not-italic leading-relaxed">
              {order.shipping_street}
              <br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              <br />
              {order.shipping_country}
            </address>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </h3>
            <p className="text-sm">
              <span className="text-gray-600">Status: </span>
              <span
                className={`font-medium ${
                  order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Order History
          </h3>
          <div className="space-y-4">
            {order.statusHistory.map((history, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(history.created_at).toLocaleString()}
                  </p>
                  {history.comment && (
                    <p className="text-sm text-gray-600 mt-1">{history.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

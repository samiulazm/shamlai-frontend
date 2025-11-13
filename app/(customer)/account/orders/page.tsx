'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Search, Filter } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Get customer record
      const { data: customer } = await insforgeClient.database
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      // Get all orders
      const { data: ordersData } = await insforgeClient.database
        .from('orders')
        .select('id, order_number, total, status, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (ordersData) {
        // Get item counts
        const ordersWithCounts = await Promise.all(
          ordersData.map(async (order) => {
            const { count } = await insforgeClient.database
              .from('order_items')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', order.id);

            return {
              ...order,
              items_count: count || 0,
            };
          })
        );

        setOrders(ordersWithCounts);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Failed to load orders', error instanceof Error ? error : new Error(String(error)));
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((order) =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
        <p className="text-gray-600 mt-1">View and track all your orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href="/"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {order.order_number}
                      </Link>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{order.items_count} item{order.items_count !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${parseFloat(order.total.toString()).toFixed(2)}
                    </p>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1 inline-block"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredOrders.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

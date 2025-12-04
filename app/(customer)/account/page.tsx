'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

interface OrderStats {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

export default function AccountDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get customer record
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      // Get all orders for stats
      const { data: allOrders } = await supabaseClient
        .from('orders')
        .select('status')
        .eq('customer_id', customer.id);

      if (allOrders) {
        const stats: OrderStats = {
          total: allOrders.length,
          pending: allOrders.filter((o: any) => o.status === 'pending').length,
          shipped: allOrders.filter((o: any) => o.status === 'shipped').length,
          delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
        };
        setStats(stats);
      }

      // Get recent orders with item count
      const { data: orders } = await supabaseClient
        .from('orders')
        .select(
          `
          id,
          order_number,
          total,
          status,
          created_at
        `
        )
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        // Get item counts for each order
        const ordersWithCounts = await Promise.all(
          orders.map(async (order: any) => {
            const { count } = await supabaseClient
              .from('order_items')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', order.id);

            return {
              ...order,
              items_count: count || 0,
            };
          })
        );

        setRecentOrders(ordersWithCounts);
      }

      setLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load dashboard data',
        error instanceof Error ? error : new Error(String(error))
      );
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: Package, color: 'blue' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'yellow' },
    { label: 'Shipped', value: stats.shipped, icon: TrendingUp, color: 'indigo' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'green' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.nickname || user?.email?.split('@')[0]}!
        </h2>
        <p className="text-gray-600 mt-1">
          Track your orders, manage your profile, and update your addresses.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            indigo: 'bg-indigo-50 text-indigo-600',
            green: 'bg-green-50 text-green-600',
          }[stat.color];

          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link
              href={'/account/orders' as any}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No orders yet</p>
            <Link
              href="/"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/account/orders/${order.id}` as any}
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
                      <span>
                        {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                      </span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${parseFloat(order.total.toString()).toFixed(2)}
                    </p>
                    <Link
                      href={`/account/orders/${order.id}` as any}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1 inline-block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

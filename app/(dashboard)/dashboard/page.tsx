'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import { getDashboardStats, type DashboardStats } from '@/lib/services/dashboard';
import StatCard from '@/components/dashboard/StatCard';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import { ShoppingBag, DollarSign, TrendingUp, Package } from 'lucide-react';

// Code-split heavy chart widgets for faster initial load
const WidgetLoadingState = () => (
  <div className="card">
    <div className="card-pad">
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    </div>
  </div>
);

const WebOrderReportWidget = dynamic(() => import('@/components/dashboard/WebOrderReport'), {
  loading: () => <WidgetLoadingState />,
  ssr: false,
});

const OrdersBySourceWidget = dynamic(() => import('@/components/dashboard/OrdersBySource'), {
  loading: () => <WidgetLoadingState />,
  ssr: false,
});

const OrderCountsWidget = dynamic(() => import('@/components/dashboard/OrderCountsChart'), {
  loading: () => <WidgetLoadingState />,
  ssr: false,
});

const HourlyOrdersWidget = dynamic(() => import('@/components/dashboard/HourlyOrdersChart'), {
  loading: () => <WidgetLoadingState />,
  ssr: false,
});

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayOrdersChange: 0,
    totalRevenue: 0,
    revenueChange: 0,
    profit: 0,
    profitChange: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingWebOrders: 0,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user) return;

      // Set shop ID (user's ID is the shop ID)
      setShopId(user.user.id);

      // Fetch enhanced dashboard stats
      const dashboardStats = await getDashboardStats(user.user.id, dateRange || undefined);
      setStats(dashboardStats);

      // Optimize: Fetch only last 90 days of orders for charts (not all orders)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: orders } = await insforgeClient.database
        .from('orders')
        .select('*')
        .eq('shop_id', user.user.id)
        .gte('created_at', ninetyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to 1000 most recent orders

      // Fetch top products
      const { data: products } = await insforgeClient.database
        .from('products')
        .select('id, name, base_price')
        .eq('shop_id', user.user.id)
        .eq('is_active', true)
        .limit(5);

      setTopProducts(products || []);

      // Generate weekly data from actual orders
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      const weeklyDataMap: Record<string, number> = {};

      // Initialize all days to 0
      days.forEach((day) => {
        weeklyDataMap[day] = 0;
      });

      // Calculate sales for each day of the week
      orders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const dayIndex = orderDate.getDay();
        const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday (0) to last position

        if (weeklyDataMap[dayName] !== undefined) {
          weeklyDataMap[dayName] += parseFloat(order.total?.toString() || '0');
        }
      });

      const weeklyDataArray = days.map((day) => ({
        day,
        sales: weeklyDataMap[day] || 0,
      }));

      setWeeklyData(weeklyDataArray);
    } catch (error) {
      logger.error(
        'Error fetching dashboard data',
        error instanceof Error ? error : new Error(String(error)),
        {
          shopId,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header with Date Range Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your business</p>
        </div>
        <DateRangePicker onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Orders"
          value={stats.todayOrders}
          change={stats.todayOrdersChange}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={`৳${stats.totalRevenue.toLocaleString()}`}
          change={stats.revenueChange}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Profit"
          value={`৳${stats.profit.toLocaleString()}`}
          change={stats.profitChange}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Web Orders"
          value={stats.pendingWebOrders}
          showChange={false}
          icon={<Package className="h-5 w-5" />}
        />
      </div>

      {/* Web Order Report Widget */}
      {shopId && <WebOrderReportWidget shopId={shopId} />}

      {/* Orders by Source Widget */}
      {shopId && <OrdersBySourceWidget shopId={shopId} />}

      {/* Order Counts Chart */}
      {shopId && <OrderCountsWidget shopId={shopId} />}

      {/* Hourly Web Orders Chart */}
      {shopId && <HourlyOrdersWidget shopId={shopId} />}

      <div className="card">
        <div className="card-pad">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Orders This Week</div>
            <Link href="/orders" className="text-sm text-brand-indigo">
              View all
            </Link>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="card-pad">
            <div className="text-lg font-semibold">Top Products</div>
            {topProducts.length > 0 ? (
              <table className="table mt-3">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="py-3">{product.name}</td>
                      <td>৳{product.base_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mt-4 text-center text-gray-500 py-8">
                <p>No products yet</p>
                <Link href="/products" className="text-brand-indigo text-sm mt-2 inline-block">
                  Add your first product
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-lg font-semibold">Quick Actions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {shopId && (
                <Link href={`/${shopId}`} className="btn btn-primary" target="_blank">
                  🛒 View My Shop
                </Link>
              )}
              {(
                [
                  ['Add Product', '/products'],
                  ['View Orders', '/orders'],
                  ['Shop Settings', '/shop'],
                  ['SEO & Marketing', '/seo-marketing'],
                ] as const
              ).map(([label, href]) => (
                <Link key={label} href={href as any} className="btn btn-outline">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

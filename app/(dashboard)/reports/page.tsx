"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { insforgeClient } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";

interface SalesData {
  name: string;
  sales: number;
}

export default function Reports(){
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch orders for analytics
      const { data: orders, error: ordersError } = await insforgeClient.database
        .from('orders')
        .select('total, created_at, status')
        .eq('shop_id', user.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate totals
      const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const orderCount = orders?.length || 0;
      setTotalRevenue(revenue);
      setTotalOrders(orderCount);

      // Generate monthly sales data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const now = new Date();
      const monthlySales: Record<string, number> = {};

      orders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const monthIndex = orderDate.getMonth();
        const monthName = months[monthIndex];
        
        if (monthlySales[monthName]) {
          monthlySales[monthName] += parseFloat(order.total.toString());
        } else {
          monthlySales[monthName] = parseFloat(order.total.toString());
        }
      });

      const chartData = months.map(month => ({
        name: month,
        sales: monthlySales[month] || 0
      }));

      setSalesData(chartData);
    } catch (err: any) {
      logger.error('Error fetching reports', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchReports} className="btn btn-outline">Try Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="mt-2 text-3xl font-semibold">৳{totalRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="mt-2 text-3xl font-semibold">{totalOrders}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Average Order Value</div>
            <div className="mt-2 text-3xl font-semibold">
              ৳{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="text-lg font-semibold mb-4">Sales (Last 6 months)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                <Bar dataKey="sales" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

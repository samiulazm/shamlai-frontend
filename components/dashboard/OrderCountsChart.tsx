'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface OrderCountsWidgetProps {
  shopId: string;
}

interface OrderCountData {
  date: string;
  created: number;
  sentToCourier: number;
}

export default function OrderCountsWidget({ shopId }: OrderCountsWidgetProps) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<OrderCountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ created: 0, sentToCourier: 0 });

  useEffect(() => {
    fetchData();
  }, [shopId, days]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Fetch orders
      const { data: orders, error } = await insforgeClient.database
        .from('orders')
        .select('id, created_at, sent_to_courier_at')
        .eq('shop_id', shopId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, { created: number; sentToCourier: number }>();

      // Initialize all dates in range
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, { created: 0, sentToCourier: 0 });
      }

      // Process orders
      let totalCreated = 0;
      let totalSentToCourier = 0;

      orders?.forEach((order) => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const current = dateMap.get(orderDate) || { created: 0, sentToCourier: 0 };
        current.created += 1;
        totalCreated += 1;

        if ((order as any).sent_to_courier_at) {
          const sentDate = new Date((order as any).sent_to_courier_at).toISOString().split('T')[0];
          const sentCurrent = dateMap.get(sentDate) || { created: 0, sentToCourier: 0 };
          sentCurrent.sentToCourier += 1;
          totalSentToCourier += 1;
        }
      });

      // Convert to array and format dates
      const chartData: OrderCountData[] = Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          created: counts.created,
          sentToCourier: counts.sentToCourier,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setData(chartData);
      setSummary({ created: totalCreated, sentToCourier: totalSentToCourier });
    } catch (error) {
      logger.error(
        'Error fetching order counts',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-pad">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-pad">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Order Counts</h3>
            <p className="text-sm text-gray-500 mt-1">
              Orders created vs sent to courier in the last {days} days
            </p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
            <option value={90}>90 Days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            className="p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors"
            onClick={() => {
              // Could filter chart to show only created
            }}
          >
            <div className="text-sm text-gray-600">Created</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{summary.created}</div>
          </button>
          <button
            className="p-4 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors"
            onClick={() => {
              // Could filter chart to show only sent to courier
            }}
          >
            <div className="text-sm text-gray-600">Sent to Courier</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{summary.sentToCourier}</div>
          </button>
        </div>

        {/* Chart */}
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No orders in this period</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Created"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="sentToCourier"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Sent to Courier"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

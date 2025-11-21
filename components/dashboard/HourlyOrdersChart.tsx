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
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

interface HourlyOrdersWidgetProps {
  shopId: string;
}

interface HourlyData {
  hour: string;
  today: number;
  yesterday: number;
}

export default function HourlyOrdersWidget({ shopId }: HourlyOrdersWidgetProps) {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'today' | 'yesterday'>('today');

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabaseClient
        .from('orders')
        .select('created_at')
        .eq('shop_id', shopId)
        .eq('source', 'web')
        .gte('created_at', today.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (todayError) throw todayError;

      // Fetch yesterday's orders
      const { data: yesterdayOrders, error: yesterdayError } = await supabaseClient
        .from('orders')
        .select('created_at')
        .eq('shop_id', shopId)
        .eq('source', 'web')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString());

      if (yesterdayError) throw yesterdayError;

      // Initialize hourly data (0-23 hours)
      const hourlyMap = new Map<number, { today: number; yesterday: number }>();
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { today: 0, yesterday: 0 });
      }

      // Process today's orders
      todayOrders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        const current = hourlyMap.get(hour) || { today: 0, yesterday: 0 };
        current.today += 1;
        hourlyMap.set(hour, current);
      });

      // Process yesterday's orders
      yesterdayOrders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        const current = hourlyMap.get(hour) || { today: 0, yesterday: 0 };
        current.yesterday += 1;
        hourlyMap.set(hour, current);
      });

      // Convert to array and format hours
      const formatHour = (hour: number): string => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
      };

      const chartData: HourlyData[] = Array.from(hourlyMap.entries())
        .map(([hour, counts]) => ({
          hour: formatHour(hour),
          today: counts.today,
          yesterday: counts.yesterday,
        }))
        .sort((a, b) => {
          // Sort by hour number, not formatted string
          const hourA = hourlyMap.keys().next().value || 0;
          return 0;
        });

      // Sort properly by hour index
      const sortedData = Array.from({ length: 24 }, (_, i) => {
        const counts = hourlyMap.get(i) || { today: 0, yesterday: 0 };
        return {
          hour: formatHour(i),
          today: counts.today,
          yesterday: counts.yesterday,
        };
      });

      setData(sortedData);
    } catch (error) {
      logger.error(
        'Error fetching hourly orders',
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

  const todayTotal = data.reduce((sum, item) => sum + item.today, 0);
  const yesterdayTotal = data.reduce((sum, item) => sum + item.yesterday, 0);
  const currentDate = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];

  return (
    <div className="card">
      <div className="card-pad">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Hourly Web Orders</h3>
            <p className="text-sm text-gray-500 mt-1">
              {currentDate} vs {yesterdayDateStr} (Until {new Date().getHours()}:00)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 border rounded-lg p-1">
              <button
                onClick={() => setSelectedView('today')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedView === 'today'
                    ? 'bg-brand-indigo text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedView('yesterday')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedView === 'yesterday'
                    ? 'bg-brand-indigo text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Today</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{todayTotal}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">Yesterday</div>
            <div className="text-xl font-bold text-green-600 mt-1">{yesterdayTotal}</div>
          </div>
        </div>

        {/* Chart */}
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No web orders in this period</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="today"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Today"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="yesterday"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Yesterday"
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

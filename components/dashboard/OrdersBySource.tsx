'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getOrdersBySource, type OrdersBySource } from '@/lib/services/dashboard';

interface OrdersBySourceWidgetProps {
  shopId: string;
}

export default function OrdersBySourceWidget({ shopId }: OrdersBySourceWidgetProps) {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '30d'>('today');
  const [data, setData] = useState<OrdersBySource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [shopId, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getOrdersBySource(shopId, dateRange);
      setData(result);
    } catch (error) {
      console.error('Error fetching orders by source:', error);
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
          <h3 className="text-lg font-semibold">Orders by Source</h3>
          <div className="flex gap-1">
            {(['today', 'yesterday', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm rounded ${
                  dateRange === range
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === '30d' ? '30D' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No data available</p>
            <p className="text-sm mt-2">Orders will appear here when they have a source assigned</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {data.map((item) => (
                <div key={item.source} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 capitalize">{item.source}</div>
                  <div className="text-xl font-bold mt-1">{item.count}</div>
                  <div className="text-xs text-gray-500 mt-1">৳{item.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="source"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Orders'];
                      if (name === 'revenue') return [`৳${value.toLocaleString()}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#6366f1" name="Orders" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table View */}
            <div className="mt-6 overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th className="text-right">Orders</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-right">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .sort((a, b) => b.count - a.count)
                    .map((item) => (
                      <tr key={item.source}>
                        <td className="capitalize font-medium">{item.source}</td>
                        <td className="text-right">{item.count}</td>
                        <td className="text-right">৳{item.revenue.toLocaleString()}</td>
                        <td className="text-right">
                          ৳{item.count > 0 ? (item.revenue / item.count).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

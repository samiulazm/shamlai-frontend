'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function WebOrderReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    // TODO: Fetch web order statistics
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading web order report...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Web Order Report
        </h1>
        <p className="text-sm text-gray-600 mt-1">Analytics and insights for web orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            ৳{stats.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Order Value</div>
          <div className="text-2xl font-bold text-gray-900">
            ৳{stats.averageOrderValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
          <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-4">Order Trends</h3>
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Charts and detailed analytics will appear here</p>
        </div>
      </div>
    </div>
  );
}

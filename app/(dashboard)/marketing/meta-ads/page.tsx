'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function MetaAdsReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalClicks: 0,
    totalImpressions: 0,
    totalConversions: 0,
  });

  useEffect(() => {
    // TODO: Fetch Meta Ads data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading Meta Ads report...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Meta Ads Report
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View performance metrics for your Meta advertising campaigns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">
            ৳{stats.totalSpent.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Clicks</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalClicks.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Impressions</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalImpressions.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Conversions</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalConversions.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Campaign Performance</h3>
          <button className="text-sm text-indigo-600 hover:text-indigo-700">View All</button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Connect your Meta Ads account to view detailed reports</p>
        </div>
      </div>
    </div>
  );
}

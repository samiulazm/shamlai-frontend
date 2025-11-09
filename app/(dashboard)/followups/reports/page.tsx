'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

export default function FollowupReports() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch follow-up reports
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading follow-up reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Follow-up Reports
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Analytics and insights for follow-up activities
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Follow-up reports and analytics will appear here</p>
        </div>
      </div>
    </div>
  );
}

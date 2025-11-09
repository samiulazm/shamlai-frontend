'use client';

import { useEffect, useState } from 'react';
import { LayoutDashboard, Bell } from 'lucide-react';

export default function FollowupDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    // TODO: Fetch follow-up statistics
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading follow-up dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          Follow-up Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">Overview of all follow-up activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Total Follow-ups</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-600 mb-1">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-4">Recent Follow-ups</h3>
        <div className="text-center py-12 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Follow-up activities will appear here</p>
        </div>
      </div>
    </div>
  );
}

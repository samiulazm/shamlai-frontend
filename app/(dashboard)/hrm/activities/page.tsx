'use client';

import { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';

export default function Activities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch HRM activities
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading activities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-6 w-6" />
          Activities
        </h1>
        <p className="text-sm text-gray-600 mt-1">Track employee activities and performance</p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No activities recorded</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium">Recent Activities</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm">Activity records will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Puzzle } from 'lucide-react';

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch workflow templates
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Puzzle className="h-6 w-6" />
          Workflow Templates
        </h1>
        <p className="text-sm text-gray-600 mt-1">Choose from pre-built workflow templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6 cursor-pointer hover:border-indigo-500 transition-colors">
          <h3 className="font-medium text-gray-900 mb-2">Order Confirmation</h3>
          <p className="text-sm text-gray-500">
            Automatically send confirmation emails when orders are placed
          </p>
        </div>
        <div className="bg-white rounded-lg border p-6 cursor-pointer hover:border-indigo-500 transition-colors">
          <h3 className="font-medium text-gray-900 mb-2">Low Stock Alert</h3>
          <p className="text-sm text-gray-500">Get notified when product stock runs low</p>
        </div>
        <div className="bg-white rounded-lg border p-6 cursor-pointer hover:border-indigo-500 transition-colors">
          <h3 className="font-medium text-gray-900 mb-2">Customer Follow-up</h3>
          <p className="text-sm text-gray-500">Automatically schedule follow-ups for customers</p>
        </div>
      </div>
    </div>
  );
}

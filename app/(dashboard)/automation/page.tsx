'use client';

import { useEffect, useState } from 'react';
import { Workflow, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Workflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch workflows
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading workflows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Workflows
          </h1>
          <p className="text-sm text-gray-600 mt-1">Automate your business processes</p>
        </div>
        <Link href="/automation/builder" className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No workflows configured</p>
          <Link href="/automation/builder" className="btn btn-primary">
            Create Your First Workflow
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium">Active Workflows</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm">Workflow list will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { Workflow } from 'lucide-react';
import { WorkflowCanvas } from '@/components/workflow-builder/WorkflowCanvas';
import { useAuth } from '@/lib/context/AuthContext';

export default function CreateWorkflowPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to create workflows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-6 w-6 text-indigo-600" />
            Create Workflow
          </h1>
          <p className="text-sm text-gray-600 mt-1">Build automated workflows for your business</p>
        </div>
      </div>

      <WorkflowCanvas mode="create" shopId={user.id} />
    </div>
  );
}

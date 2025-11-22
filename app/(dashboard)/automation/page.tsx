'use client';

import { Workflow, Plus, Power, PowerOff, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useWorkflows, useWorkflowMutations } from '@/lib/hooks/useWorkflows';
import { useAuth } from '@/lib/context/AuthContext';
import { useState } from 'react';

export default function WorkflowsPage() {
  const { user } = useAuth();
  const { workflows, loading, error, refetch } = useWorkflows(user?.id);
  const { toggleWorkflow, deleteWorkflow, loading: mutating } = useWorkflowMutations();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setTogglingId(id);
      await toggleWorkflow(id, !currentStatus);
      refetch();
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
      alert('Failed to toggle workflow');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteWorkflow(id);
      refetch();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert('Failed to delete workflow');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading workflows...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading workflows: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-6 w-6 text-indigo-600" />
            Workflows
          </h1>
          <p className="text-sm text-gray-600 mt-1">Automate your business processes</p>
        </div>
        <Link
          href="/automation/builder"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
          <p className="text-gray-600 mb-6">
            Automate repetitive tasks and save time by creating your first workflow
          </p>
          <Link
            href="/automation/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Your First Workflow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    {workflow.is_active ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {workflow.description && (
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Workflow className="h-4 w-4" />
                      <span className="capitalize">{workflow.trigger_event.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{workflow.actions?.length || 0} actions</span>
                    </div>
                    {workflow.execution_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{workflow.execution_count} executions</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(workflow.id, workflow.is_active)}
                    disabled={togglingId === workflow.id || mutating}
                    className={`p-2 rounded-lg transition-colors ${
                      workflow.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                    title={workflow.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {workflow.is_active ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                  </button>

                  <Link
                    href={`/automation/builder/${workflow.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    disabled={mutating}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

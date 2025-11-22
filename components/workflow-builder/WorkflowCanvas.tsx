'use client';

import { useState, useEffect } from 'react';
import { Save, Play } from 'lucide-react';
import { TriggerSelector } from './TriggerSelector';
import { ActionList } from './ActionList';
import { useWorkflowMutations } from '@/lib/hooks/useWorkflows';
import type { TriggerEvent, WorkflowAction, Workflow } from '@/lib/types/database';
import { useRouter } from 'next/navigation';

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  mode: 'create' | 'edit';
  shopId: string;
}

export function WorkflowCanvas({ initialWorkflow, mode, shopId }: WorkflowCanvasProps) {
  const router = useRouter();
  const [name, setName] = useState(initialWorkflow?.name || '');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent | ''>(initialWorkflow?.trigger_event || '');
  const [actions, setActions] = useState<WorkflowAction[]>(initialWorkflow?.actions || []);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { createWorkflow, updateWorkflow, loading, error } = useWorkflowMutations();

  // Auto-save draft to localStorage
  useEffect(() => {
    if (mode === 'create') {
      const draft = {
        name,
        description,
        triggerEvent,
        actions,
      };
      localStorage.setItem('workflow-draft', JSON.stringify(draft));
    }
  }, [name, description, triggerEvent, actions, mode]);

  // Load draft on mount for create mode
  useEffect(() => {
    if (mode === 'create') {
      const draft = localStorage.getItem('workflow-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.name) setName(parsed.name);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.triggerEvent) setTriggerEvent(parsed.triggerEvent);
          if (parsed.actions) setActions(parsed.actions);
        } catch (e) {
          // Invalid draft, ignore
        }
      }
    }
  }, [mode]);

  const handleSave = async (activate = false) => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (!triggerEvent) {
      alert('Please select a trigger event');
      return;
    }

    if (actions.length === 0) {
      alert('Please add at least one action');
      return;
    }

    try {
      setSaveStatus('saving');

      const workflowData = {
        shop_id: shopId,
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_event: triggerEvent,
        actions,
        is_active: activate,
      };

      if (mode === 'create') {
        const workflow = await createWorkflow(workflowData);
        setSaveStatus('saved');
        // Clear draft
        localStorage.removeItem('workflow-draft');
        // Redirect to workflows list or edit page
        setTimeout(() => {
          router.push('/automation');
        }, 1000);
      } else {
        await updateWorkflow(initialWorkflow!.id, workflowData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Send order confirmation emails"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Trigger Section */}
      <TriggerSelector triggerEvent={triggerEvent} setTriggerEvent={setTriggerEvent} />

      {/* Actions Section */}
      <ActionList actions={actions} setActions={setActions} />

      {/* Save Actions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            {saveStatus === 'saving' && <p className="text-sm text-gray-600">Saving...</p>}
            {saveStatus === 'saved' && <p className="text-sm text-green-600">✓ Saved successfully!</p>}
            {saveStatus === 'error' && <p className="text-sm text-red-600">Failed to save. Please try again.</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/automation')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={loading || saveStatus === 'saving'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={loading || saveStatus === 'saving'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Save & Activate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

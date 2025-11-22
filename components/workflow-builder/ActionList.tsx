'use client';

import { Reorder } from 'framer-motion';
import { Plus, ListOrdered } from 'lucide-react';
import { ActionBlock } from './ActionBlock';
import { ActionTypeSelector } from './ActionTypeSelector';
import { useState } from 'react';
import type { WorkflowAction, ActionType } from '@/lib/types/database';

interface ActionListProps {
  actions: WorkflowAction[];
  setActions: (actions: WorkflowAction[]) => void;
}

export function ActionList({ actions, setActions }: ActionListProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleReorder = (newActions: WorkflowAction[]) => {
    // Update order numbers to match new positions
    const reordered = newActions.map((action, index) => ({
      ...action,
      order: index,
    }));
    setActions(reordered);
  };

  const handleAddAction = (type: ActionType) => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type,
      config: {},
      order: actions.length,
    };
    setActions([...actions, newAction]);
    setShowTypeSelector(false);
  };

  const handleEditAction = (id: string, config: Record<string, any>) => {
    setActions(
      actions.map((action) => (action.id === id ? { ...action, config } : action))
    );
  };

  const handleDeleteAction = (id: string) => {
    const filtered = actions.filter((action) => action.id !== id);
    // Reindex order
    const reindexed = filtered.map((action, index) => ({
      ...action,
      order: index,
    }));
    setActions(reindexed);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-indigo-600" />
            Actions
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add and arrange actions to execute when the trigger fires
          </p>
        </div>
        <button
          onClick={() => setShowTypeSelector(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ListOrdered className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No actions yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Action" to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Reorder.Group axis="y" values={actions} onReorder={handleReorder} className="space-y-3">
            {actions.map((action, index) => (
              <Reorder.Item key={action.id} value={action}>
                <ActionBlock
                  action={action}
                  index={index}
                  totalActions={actions.length}
                  onEdit={handleEditAction}
                  onDelete={handleDeleteAction}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Drag actions to reorder them. Actions execute sequentially from top to bottom.
            </p>
          </div>
        </div>
      )}

      <ActionTypeSelector
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleAddAction}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Settings, Save } from 'lucide-react';

export default function AutoTaskConfig() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    autoCreateOnOrder: false,
    autoCreateOnFollowup: false,
    defaultPriority: 'medium',
    defaultAssignee: '',
  });

  const handleSave = async () => {
    setLoading(true);
    // TODO: Save auto task configuration
    setTimeout(() => {
      setLoading(false);
      alert('Configuration saved successfully');
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Auto Task Configuration
        </h1>
        <p className="text-sm text-gray-600 mt-1">Configure automatic task creation rules</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCreateOnOrder}
                onChange={(e) => setConfig({ ...config, autoCreateOnOrder: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Auto-create tasks on new orders</div>
                <div className="text-sm text-gray-500">
                  Automatically create a task when a new order is placed
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCreateOnFollowup}
                onChange={(e) => setConfig({ ...config, autoCreateOnFollowup: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">Auto-create tasks on follow-ups</div>
                <div className="text-sm text-gray-500">
                  Automatically create a task when a follow-up is scheduled
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Priority</label>
            <select
              value={config.defaultPriority}
              onChange={(e) => setConfig({ ...config, defaultPriority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Assignee</label>
            <select
              value={config.defaultAssignee}
              onChange={(e) => setConfig({ ...config, defaultAssignee: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None</option>
            </select>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

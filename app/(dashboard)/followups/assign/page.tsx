'use client';

import { useState } from 'react';
import { UserCheck } from 'lucide-react';

export default function AssignFollowups() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    followupId: '',
    assignee: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement follow-up assignment
    setTimeout(() => {
      setLoading(false);
      alert('Follow-up assigned successfully');
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-6 w-6" />
          Assign Follow-ups
        </h1>
        <p className="text-sm text-gray-600 mt-1">Assign follow-ups to team members</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up *</label>
            <select
              value={formData.followupId}
              onChange={(e) => setFormData({ ...formData, followupId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
            <select
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select team member</option>
            </select>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Assigning...' : 'Assign Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

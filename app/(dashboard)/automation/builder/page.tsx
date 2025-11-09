'use client';

import { useState } from 'react';
import { Workflow, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateWorkflow() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: '',
    actions: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement workflow creation
    setTimeout(() => {
      setLoading(false);
      alert('Workflow created successfully');
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Workflow className="h-6 w-6" />
          Create Workflow
        </h1>
        <p className="text-sm text-gray-600 mt-1">Build automated workflows for your business</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Auto-send order confirmation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Event *</label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select trigger</option>
              <option value="order_placed">Order Placed</option>
              <option value="order_shipped">Order Shipped</option>
              <option value="payment_received">Payment Received</option>
              <option value="product_low_stock">Product Low Stock</option>
            </select>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
            <p className="text-sm text-gray-500">Workflow builder interface coming soon...</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/automation" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

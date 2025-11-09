'use client';

import { useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePayment() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryMethodId: '',
    paymentMethod: '',
    isPrepaid: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement payment method update
    setTimeout(() => {
      setLoading(false);
      alert('Payment method updated successfully');
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Update Payment Method
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure payment settings for delivery methods
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Method *
            </label>
            <select
              value={formData.deliveryMethodId}
              onChange={(e) => setFormData({ ...formData, deliveryMethodId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select delivery method</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select payment method</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
              <option value="prepaid">Prepaid</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrepaid}
                onChange={(e) => setFormData({ ...formData, isPrepaid: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Require prepayment</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/delivery-methods" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {loading ? 'Updating...' : 'Update Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { OrderStatus } from '@/lib/types/database';

interface StatusChangeConfigProps {
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onCancel: () => void;
}

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'rts', label: 'Ready to Ship' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export function StatusChangeConfig({ config, onSave, onCancel }: StatusChangeConfigProps) {
  const [status, setStatus] = useState<OrderStatus | ''>(config.status || '');
  const [notifyCustomer, setNotifyCustomer] = useState(config.notify_customer ?? true);

  const handleSave = () => {
    if (!status) {
      alert('Please select a status');
      return;
    }

    onSave({ status, notify_customer: notifyCustomer });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Status <span className="text-red-500">*</span>
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select status...</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="notify_customer"
          checked={notifyCustomer}
          onChange={(e) => setNotifyCustomer(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="notify_customer" className="text-sm text-gray-700">
          Notify customer about status change
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}

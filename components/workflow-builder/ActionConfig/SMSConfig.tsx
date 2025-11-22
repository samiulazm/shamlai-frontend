'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface SMSConfigProps {
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onCancel: () => void;
}

export function SMSConfig({ config, onSave, onCancel }: SMSConfigProps) {
  const [to, setTo] = useState(config.to || '{{customer.phone}}');
  const [message, setMessage] = useState(config.message || '');

  const handleSave = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (message.length > 500) {
      alert('Message is too long (max 500 characters)');
      return;
    }

    onSave({ to, message });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          To <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="{{customer.phone}}"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Use {`{{customer.phone}}`} for dynamic values</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi {{customer.first_name}}, your order #{{order.order_number}} has been confirmed!"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {message.length}/500 characters • Available variables: {`{{customer.first_name}}`}, {`{{order.order_number}}`}
        </p>
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

'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface EmailConfigProps {
  config: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onCancel: () => void;
}

export function EmailConfig({ config, onSave, onCancel }: EmailConfigProps) {
  const [to, setTo] = useState(config.to || '{{customer.email}}');
  const [subject, setSubject] = useState(config.subject || '');
  const [body, setBody] = useState(config.body || '');

  const handleSave = () => {
    if (!subject.trim() || !body.trim()) {
      alert('Please fill in subject and body');
      return;
    }

    onSave({ to, subject, body });
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
          placeholder="{{customer.email}}"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Use {`{{customer.email}}`} for dynamic values</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Your order #{{order.order_number}} has been confirmed"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Body <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Hi {{customer.first_name}}, your order has been confirmed!"
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Available variables: {`{{customer.first_name}}`}, {`{{customer.email}}`}, {`{{order.order_number}}`}, {`{{order.total}}`}
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

'use client';

import { useState } from 'react';
import { ShoppingBag, ScanLine } from 'lucide-react';

export default function ScanToUpdate() {
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScan = async () => {
    if (!scanValue.trim()) {
      setMessage({ type: 'error', text: 'Please enter an order ID or scan code' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      // TODO: Implement scan logic to update order status
      // This would typically search for the order and update its status

      setTimeout(() => {
        setMessage({ type: 'success', text: `Order ${scanValue} updated successfully` });
        setScanValue('');
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update order' });
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScanLine className="h-6 w-6" />
          Scan To Update Order
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Scan or enter order ID to quickly update order status
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID or Scan Code
            </label>
            <input
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Enter order ID or scan barcode..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                Update Order
              </>
            )}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-sm">Mark as Shipped</div>
              <div className="text-xs text-gray-500">Update to shipped status</div>
            </button>
            <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-sm">Mark as Delivered</div>
              <div className="text-xs text-gray-500">Update to delivered status</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';

export default function TransferStock() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    fromLocation: '',
    toLocation: '',
    quantity: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Implement stock transfer logic
    setTimeout(() => {
      setLoading(false);
      alert('Stock transferred successfully');
      setFormData({ productId: '', fromLocation: '', toLocation: '', quantity: '' });
    }, 1000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Transfer Stock
        </h1>
        <p className="text-sm text-gray-600 mt-1">Transfer stock between locations</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a product</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Location</label>
              <input
                type="text"
                value={formData.fromLocation}
                onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                placeholder="Warehouse A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex items-end">
              <ArrowRight className="h-6 w-6 text-gray-400 mb-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Location</label>
              <input
                type="text"
                value={formData.toLocation}
                onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                placeholder="Warehouse B"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? 'Transferring...' : 'Transfer Stock'}
          </button>
        </form>
      </div>
    </div>
  );
}

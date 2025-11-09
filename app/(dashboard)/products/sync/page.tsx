'use client';

import { useState } from 'react';
import { Package, RefreshCw, CheckCircle } from 'lucide-react';

export default function SyncProducts() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');

    try {
      // TODO: Implement product sync logic
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLastSync(new Date());
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6" />
          Sync Products
        </h1>
        <p className="text-sm text-gray-600 mt-1">Synchronize products with external systems</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Last Sync</div>
              <div className="text-sm text-gray-500">
                {lastSync ? lastSync.toLocaleString() : 'Never synced'}
              </div>
            </div>
            {syncStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Sync Options</h3>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" defaultChecked />
              <div>
                <div className="font-medium text-sm">WooCommerce</div>
                <div className="text-xs text-gray-500">Sync products from WooCommerce store</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" />
              <div>
                <div className="font-medium text-sm">Shopify</div>
                <div className="text-xs text-gray-500">Sync products from Shopify store</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" />
              <div>
                <div className="font-medium text-sm">CSV Import</div>
                <div className="text-xs text-gray-500">Import products from CSV file</div>
              </div>
            </label>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Start Sync
              </>
            )}
          </button>

          {syncStatus === 'error' && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              Sync failed. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

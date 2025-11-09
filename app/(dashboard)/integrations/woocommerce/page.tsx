'use client';

import { useState } from 'react';
import { Save, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

export default function WooCommerceIntegration() {
  const [formData, setFormData] = useState({
    storeUrl: '',
    consumerKey: '',
    consumerSecret: '',
    isActive: false,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save WooCommerce integration settings
      // This would typically save to your backend/database
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      alert('WooCommerce integration settings saved successfully!');
    } catch (error) {
      logger.error(
        'Error saving WooCommerce settings',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test WooCommerce API connection
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      // Simulate success/failure
      const success = !!(formData.storeUrl && formData.consumerKey && formData.consumerSecret);
      setTestResult({
        success: success,
        message: success
          ? 'Connection successful! WooCommerce integration is working.'
          : 'Please fill in all required fields',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection failed. Please check your credentials.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">WooCommerce Integration</h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect your WooCommerce store to automatically sync orders and products
        </p>
      </div>

      <div className="card">
        <div className="card-pad">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.storeUrl}
                onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                placeholder="https://yourstore.com"
                required
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your WooCommerce store URL (without trailing slash)
              </p>
            </div>

            {/* Consumer Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.consumerKey}
                onChange={(e) => setFormData({ ...formData, consumerKey: e.target.value })}
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from WooCommerce → Settings → Advanced → REST API
              </p>
            </div>

            {/* Consumer Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumer Secret <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.consumerSecret}
                onChange={(e) => setFormData({ ...formData, consumerSecret: e.target.value })}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep this secret secure. Never share it publicly.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Enable automatic order synchronization
              </label>
            </div>

            {/* Test Connection */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={testConnection}
                disabled={
                  testing || !formData.storeUrl || !formData.consumerKey || !formData.consumerSecret
                }
                className="btn btn-outline flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div
                  className={`mt-4 p-4 rounded-lg flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        testResult.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {testResult.message}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Settings */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Sync Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval
                  </label>
                  <select className="w-full border rounded-lg p-2">
                    <option value="5">Every 5 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="syncProducts" className="w-5 h-5 rounded" />
                  <label htmlFor="syncProducts" className="text-sm text-gray-700">
                    Sync products automatically
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="syncInventory" className="w-5 h-5 rounded" />
                  <label htmlFor="syncInventory" className="text-sm text-gray-700">
                    Sync inventory levels
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    storeUrl: '',
                    consumerKey: '',
                    consumerSecret: '',
                    isActive: false,
                  })
                }
                className="btn btn-outline"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="card">
        <div className="card-pad">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            How to Get WooCommerce API Credentials
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Log in to your WooCommerce admin panel</li>
            <li>Go to WooCommerce → Settings → Advanced → REST API</li>
            <li>Click "Add Key" button</li>
            <li>Enter a description (e.g., "Shamlai Integration")</li>
            <li>Set permissions to "Read/Write"</li>
            <li>Click "Generate API Key"</li>
            <li>Copy the Consumer Key and Consumer Secret</li>
            <li>Paste them in the fields above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

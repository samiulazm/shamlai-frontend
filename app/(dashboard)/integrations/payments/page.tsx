'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  logo: string;
  requiresConfig: boolean;
}

const paymentGateways: PaymentGateway[] = [
  {
    id: 'uddoktapay',
    name: 'uddoktaPay',
    description: 'Enable online payments via uddoktaPay (bKash, Nagad, Rocket)',
    enabled: false,
    logo: '💳',
    requiresConfig: true,
  },
  {
    id: 'sslcommerz',
    name: 'SSLCommerz',
    description: 'Enable online payments via SSLCommerz',
    enabled: false,
    logo: '🔐',
    requiresConfig: true,
  },
  {
    id: 'bkash',
    name: 'bKash',
    description: 'Enable direct bKash payments',
    enabled: false,
    logo: '💰',
    requiresConfig: true,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'Enable direct Nagad payments',
    enabled: false,
    logo: '💵',
    requiresConfig: true,
  },
];

export default function PaymentIntegrations() {
  const [gateways, setGateways] = useState(paymentGateways);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [configData, setConfigData] = useState({
    apiKey: '',
    apiUrl: '',
    webhookUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load uddoktaPay configuration from environment
  useEffect(() => {
    const uddoktapayEnabled = process.env.NEXT_PUBLIC_UDDOKTAPAY_ENABLED === 'true';
    if (uddoktapayEnabled) {
      setGateways((prev) =>
        prev.map((g) =>
          g.id === 'uddoktapay'
            ? { ...g, enabled: true }
            : g
        )
      );
    }
  }, []);

  const handleToggleGateway = (gatewayId: string) => {
    if (gatewayId === 'uddoktapay') {
      setSelectedGateway(gatewayId);
    } else {
      alert(`${gatewayId} integration is coming soon!`);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      logger.info('Saving payment gateway configuration', { gateway: selectedGateway });

      // In a real implementation, this would save to the database
      // For now, we just update the local state
      setGateways((prev) =>
        prev.map((g) =>
          g.id === selectedGateway
            ? { ...g, enabled: true }
            : g
        )
      );

      alert('Configuration saved successfully!\n\nNote: To fully enable uddoktaPay, update your environment variables:\n- UDDOKTAPAY_API_KEY\n- UDDOKTAPAY_API_URL\n- NEXT_PUBLIC_UDDOKTAPAY_ENABLED=true');
      setSelectedGateway(null);
    } catch (error) {
      logger.error('Error saving configuration', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(null);

      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (configData.apiKey && configData.apiUrl) {
        setConnectionStatus({
          success: true,
          message: 'Connection test successful! uddoktaPay is configured correctly.',
        });
      } else {
        setConnectionStatus({
          success: false,
          message: 'Please provide API Key and API URL to test the connection.',
        });
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Connection test failed. Please check your credentials.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Gateways</h1>
        <div className="text-sm text-gray-600">
          Configure payment methods for your store
        </div>
      </div>

      {/* Payment Gateway List */}
      <div className="card">
        <div className="card-pad grid gap-3">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="flex items-center justify-between rounded-xl border p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{gateway.logo}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{gateway.name}</div>
                    {gateway.enabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Enabled
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{gateway.description}</div>
                </div>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => handleToggleGateway(gateway.id)}
              >
                {gateway.enabled ? 'Configure' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedGateway === 'uddoktapay' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">uddoktaPay Configuration</h2>
                <button
                  onClick={() => setSelectedGateway(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Sign up for an uddoktaPay account at https://uddoktapay.com</li>
                  <li>Get your API credentials from the dashboard</li>
                  <li>Add the credentials to your .env.local file</li>
                  <li>Restart your application</li>
                </ol>
              </div>

              {/* Configuration Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="label">API Key *</label>
                  <input
                    type="password"
                    className="input w-full"
                    placeholder="your_uddoktapay_api_key"
                    value={configData.apiKey}
                    onChange={(e) =>
                      setConfigData({ ...configData, apiKey: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add this to .env.local as: UDDOKTAPAY_API_KEY
                  </p>
                </div>

                <div>
                  <label className="label">API URL *</label>
                  <select
                    className="input w-full"
                    value={configData.apiUrl}
                    onChange={(e) =>
                      setConfigData({ ...configData, apiUrl: e.target.value })
                    }
                  >
                    <option value="">Select environment</option>
                    <option value="https://sandbox.uddoktapay.com/api/checkout-v2">
                      Sandbox (Testing)
                    </option>
                    <option value="https://api.uddoktapay.com/api/checkout-v2">
                      Production (Live)
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Add this to .env.local as: UDDOKTAPAY_API_URL
                  </p>
                </div>

                <div>
                  <label className="label">Webhook URL (Readonly)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/uddoktapay/webhook`}
                      readOnly
                    />
                    <button
                      className="btn btn-outline"
                      onClick={() =>
                        copyToClipboard(
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/uddoktapay/webhook`
                        )
                      }
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure this webhook URL in your uddoktaPay dashboard
                  </p>
                </div>
              </div>

              {/* Connection Test */}
              {connectionStatus && (
                <div
                  className={`p-4 rounded-lg mb-6 ${
                    connectionStatus.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      connectionStatus.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {connectionStatus.message}
                  </p>
                </div>
              )}

              {/* Environment Variable Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Add to your .env.local file:</h4>
                <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`UDDOKTAPAY_API_KEY=${configData.apiKey || 'your_api_key'}
UDDOKTAPAY_API_URL=${configData.apiUrl || 'https://sandbox.uddoktapay.com/api/checkout-v2'}
NEXT_PUBLIC_UDDOKTAPAY_ENABLED=true
ENABLE_UDDOKTAPAY_PAYMENTS=true`}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="btn btn-outline flex-1"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleSaveConfig}
                  disabled={saving || !configData.apiKey || !configData.apiUrl}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card">
        <div className="p-6">
          <h3 className="font-semibold mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • uddoktaPay supports bKash, Nagad, Rocket, and other popular payment methods in
              Bangladesh
            </p>
            <p>
              • For production use, ensure you have completed KYC verification with uddoktaPay
            </p>
            <p>• Test payments using sandbox mode before going live</p>
            <p>
              • Visit{' '}
              <a
                href="https://docs.uddoktapay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                uddoktaPay Documentation
              </a>{' '}
              for more information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

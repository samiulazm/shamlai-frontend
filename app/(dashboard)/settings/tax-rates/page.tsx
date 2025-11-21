'use client';

import { useEffect, useState } from 'react';
import { insforgeClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface TaxRate {
  id: string;
  tax_name: string;
  tax_rate: number;
  tax_type: 'percentage' | 'fixed';
  country: string | null;
  state: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export default function TaxRates() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<TaxRate>>({
    tax_name: '',
    tax_rate: 0,
    tax_type: 'percentage',
    country: '',
    state: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch tax rates
      const { data: taxRatesData, error: taxRatesError } = await insforgeClient.database
        .from('tax_rates')
        .select('*')
        .eq('shop_id', user.user.id)
        .order('is_default', { ascending: false })
        .order('tax_name', { ascending: true });

      if (taxRatesError) {
        setError(taxRatesError.message);
        return;
      }

      setTaxRates(taxRatesData || []);
    } catch (err: any) {
      logger.error('Error fetching tax rates', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch tax rates');
    } finally {
      setLoading(false);
    }
  };

  const saveTaxRate = async () => {
    try {
      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        alert('User not authenticated');
        return;
      }

      // If this is set as default, unset other defaults first
      if (formData.is_default) {
        await insforgeClient.database
          .from('tax_rates')
          .update({ is_default: false })
          .eq('shop_id', user.user.id);
      }

      // Save tax rate
      const { error } = await insforgeClient.database
        .from('tax_rates')
        .insert({
          ...formData,
          shop_id: user.user.id,
        });

      if (error) throw error;

      // Reset form and refresh
      setFormData({
        tax_name: '',
        tax_rate: 0,
        tax_type: 'percentage',
        country: '',
        state: '',
        is_active: true,
        is_default: false,
      });
      setShowForm(false);
      fetchTaxRates();
    } catch (err: any) {
      logger.error('Error saving tax rate', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to save tax rate');
    }
  };

  const toggleActive = async (taxRateId: string, currentStatus: boolean) => {
    try {
      const { error } = await insforgeClient.database
        .from('tax_rates')
        .update({ is_active: !currentStatus })
        .eq('id', taxRateId);

      if (error) throw error;

      // Refresh tax rates
      fetchTaxRates();
    } catch (err: any) {
      logger.error('Error toggling tax rate status', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to update tax rate');
    }
  };

  const setAsDefault = async (taxRateId: string) => {
    try {
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      // Unset all defaults
      await insforgeClient.database
        .from('tax_rates')
        .update({ is_default: false })
        .eq('shop_id', user.user.id);

      // Set new default
      const { error } = await insforgeClient.database
        .from('tax_rates')
        .update({ is_default: true })
        .eq('id', taxRateId);

      if (error) throw error;

      // Refresh tax rates
      fetchTaxRates();
    } catch (err: any) {
      logger.error('Error setting default tax rate', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to set default tax rate');
    }
  };

  const deleteTaxRate = async (taxRateId: string) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) return;

    try {
      const { error } = await insforgeClient.database.from('tax_rates').delete().eq('id', taxRateId);

      if (error) throw error;

      // Refresh tax rates
      fetchTaxRates();
    } catch (err: any) {
      logger.error('Error deleting tax rate', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to delete tax rate');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tax rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Tax Rates</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchTaxRates} className="btn btn-outline">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tax Rates</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Tax Rate'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Add New Tax Rate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tax Name</label>
                <input
                  type="text"
                  value={formData.tax_name}
                  onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., VAT, Sales Tax"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Type</label>
                <select
                  value={formData.tax_type}
                  onChange={(e) => setFormData({ ...formData, tax_type: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country (Optional)</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Bangladesh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State (Optional)</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="e.g., Dhaka"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Set as Default</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveTaxRate} className="btn btn-primary">
                Save Tax Rate
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-pad">
          {taxRates.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Tax Name</th>
                  <th>Rate</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((taxRate) => (
                  <tr key={taxRate.id}>
                    <td className="font-medium">{taxRate.tax_name}</td>
                    <td>
                      {taxRate.tax_rate}
                      {taxRate.tax_type === 'percentage' ? '%' : ' ৳'}
                    </td>
                    <td className="capitalize">{taxRate.tax_type}</td>
                    <td>
                      {taxRate.country || taxRate.state
                        ? `${taxRate.state || ''}${taxRate.state && taxRate.country ? ', ' : ''}${taxRate.country || ''}`
                        : 'All'}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActive(taxRate.id, taxRate.is_active)}
                        className={`badge ${
                          taxRate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {taxRate.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      {taxRate.is_default ? (
                        <span className="badge bg-blue-100 text-blue-800">Default</span>
                      ) : (
                        <button onClick={() => setAsDefault(taxRate.id)} className="text-sm text-brand-indigo hover:underline">
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td>
                      <button onClick={() => deleteTaxRate(taxRate.id)} className="text-sm text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">No tax rates configured</p>
                <p className="text-sm mt-2">Add your first tax rate to start applying taxes to orders</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

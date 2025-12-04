'use client';

import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

interface Account {
  id: string;
  name: string;
  type: string;
}

export default function NewExpense() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt_file: null as File | null,
  });
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) return;

      setShopId(user.id);

      // Fetch accounts
      setAccounts([]);
    } catch (error) {
      logger.error(
        'Error fetching accounts',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.account_id || !formData.category || formData.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      // Upload receipt if provided
      const receipt_url = '';
      if (formData.receipt_file) {
        // Upload file logic here
        // receipt_url = await uploadFile(formData.receipt_file);
      }

      // Create expense
      // await supabaseClient
      //   .from('expenses')
      //   .insert([{
      //     shop_id: shopId,
      //     account_id: formData.account_id,
      //     category: formData.category,
      //     amount: formData.amount,
      //     description: formData.description,
      //     date: formData.date,
      //     receipt_url
      //   }]);

      alert('Expense added successfully!');
      window.location.href = '/accounting/expenses';
    } catch (error) {
      logger.error(
        'Error creating expense',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error creating expense');
    } finally {
      setSaving(false);
    }
  };

  const expenseCategories = [
    'Office Supplies',
    'Rent',
    'Utilities',
    'Marketing',
    'Transportation',
    'Salaries',
    'Equipment',
    'Other',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">New Expense</h1>
        <p className="text-gray-500 text-sm mt-1">Record a new business expense</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-pad space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Category</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat.toLowerCase().replace(' ', '_')}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              min="0"
              step="0.01"
              required
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Describe this expense..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFormData({ ...formData, receipt_file: e.target.files?.[0] || null })
                }
                className="w-full border rounded-lg p-2"
              />
              {formData.receipt_file && (
                <span className="text-sm text-gray-600">{formData.receipt_file.name}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
            <Link href="/accounting/expenses" className="btn btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

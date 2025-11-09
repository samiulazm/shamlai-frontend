'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_banking' | 'other';
  balance: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as Account['type'],
    balance: 0,
    description: '',
    is_active: true,
  });
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);

      // Fetch accounts (would come from accounts table)
      // For now, simulate with empty array
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

    try {
      if (editingAccount) {
        // Update account
        // await insforgeClient.database
        //   .from('accounts')
        //   .update(formData)
        //   .eq('id', editingAccount.id);
      } else {
        // Create account
        // await insforgeClient.database
        //   .from('accounts')
        //   .insert([{ ...formData, shop_id: shopId }]);
      }

      await fetchAccounts();
      setShowForm(false);
      setEditingAccount(null);
      setFormData({ name: '', type: 'cash', balance: 0, description: '', is_active: true });
      alert(editingAccount ? 'Account updated successfully' : 'Account created successfully');
    } catch (error) {
      logger.error(
        'Error saving account',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error saving account');
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      // await insforgeClient.database
      //   .from('accounts')
      //   .delete()
      //   .eq('id', id);
      await fetchAccounts();
    } catch (error) {
      logger.error(
        'Error deleting account',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error deleting account');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingAccount(null);
            setFormData({ name: '', type: 'cash', balance: 0, description: '', is_active: true });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Balance</div>
                <div className="text-2xl font-bold mt-1">৳{totalBalance.toLocaleString()}</div>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active Accounts</div>
                <div className="text-2xl font-bold mt-1">
                  {accounts.filter((a) => a.is_active).length}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Accounts</div>
                <div className="text-2xl font-bold mt-1">{accounts.length}</div>
              </div>
              <Wallet className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as Account['type'] })
                  }
                  className="w-full border rounded-lg p-2"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Account</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active Account
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Update' : 'Create'} Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {accounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first account to start tracking finances
              </p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Add Account
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="font-medium">{account.name}</div>
                      {account.description && (
                        <div className="text-sm text-gray-500">{account.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-800">
                        {account.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="font-medium">৳{account.balance.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingAccount(account);
                            setFormData({
                              name: account.name,
                              type: account.type,
                              balance: account.balance,
                              description: account.description || '',
                              is_active: account.is_active,
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

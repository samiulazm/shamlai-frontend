'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, FileText, Tag } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

interface Expense {
  id: string;
  account_id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  receipt_url?: string;
  created_at: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ad' | 'regular'>('all');
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);

      // Fetch expenses (would come from expenses table)
      setExpenses([]);
    } catch (error) {
      logger.error(
        'Error fetching expenses',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses =
    filter === 'all'
      ? expenses
      : expenses.filter((e) =>
          filter === 'ad' ? e.category === 'advertising' : e.category !== 'advertising'
        );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Track all business expenses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounting/expenses/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Expense
          </Link>
          <Link href="/accounting/expenses/ad" className="btn btn-outline flex items-center gap-2">
            <Tag className="h-4 w-4" />
            New Ad Expense
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="card-pad">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold mt-1">৳{totalExpenses.toLocaleString()}</div>
            </div>
            <FileText className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-pad">
          <div className="flex gap-2">
            {(['all', 'regular', 'ad'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === f
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Expenses' : f === 'ad' ? 'Ad Expenses' : 'Regular Expenses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your business expenses</p>
              <Link href="/accounting/expenses/new" className="btn btn-primary">
                Add Expense
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Account</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge bg-purple-100 text-purple-800">
                        {expense.category}
                      </span>
                    </td>
                    <td>{expense.description}</td>
                    <td className="font-medium">৳{expense.amount.toLocaleString()}</td>
                    <td className="text-sm text-gray-600">Account Name</td>
                    <td>
                      {expense.receipt_url ? (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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

'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

interface Income {
  id: string;
  account_id: string;
  source: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export default function Income() {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);
      setIncome([]);
    } catch (error) {
      logger.error(
        'Error fetching income',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading income...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income</h1>
          <p className="text-gray-500 text-sm mt-1">Track all business income</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Income
        </button>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="card-pad">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Income</div>
              <div className="text-2xl font-bold mt-1">৳{totalIncome.toLocaleString()}</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {income.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No income records yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your business income</p>
              <button className="btn btn-primary">Add Income</button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Account</th>
                </tr>
              </thead>
              <tbody>
                {income.map((item) => (
                  <tr key={item.id}>
                    <td className="text-sm text-gray-600">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge bg-green-100 text-green-800">{item.source}</span>
                    </td>
                    <td>{item.description}</td>
                    <td className="font-medium">৳{item.amount.toLocaleString()}</td>
                    <td className="text-sm text-gray-600">Account Name</td>
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

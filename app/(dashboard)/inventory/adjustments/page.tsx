'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import type { Product } from '@/lib/types/database';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

export default function StockAdjustments() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all');

  useEffect(() => {
    fetchAdjustments();
  }, [filter]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      // Fetch stock adjustments from database
      // This would come from a stock_adjustments table
      setAdjustments([]);
    } catch (error) {
      logger.error(
        'Error fetching adjustments',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading adjustments...</p>
        </div>
      </div>
    );
  }

  const filteredAdjustments =
    filter === 'all' ? adjustments : adjustments.filter((a) => a.type === filter);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustments</h1>
          <p className="text-gray-500 text-sm mt-1">Track all inventory changes</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/inventory/adjustments/increase"
            className="btn btn-primary flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Increase Stock
          </Link>
          <Link
            href="/inventory/adjustments/decrease"
            className="btn btn-outline flex items-center gap-2"
          >
            <TrendingDown className="h-4 w-4" />
            Decrease Stock
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-pad">
          <div className="flex gap-2">
            {(['all', 'increase', 'decrease'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === f
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'increase' ? 'Increases' : 'Decreases'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {filteredAdjustments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments yet</h3>
              <p className="text-gray-500 mb-4">Stock adjustments will appear here</p>
              <div className="flex gap-2 justify-center">
                <Link href="/inventory/adjustments/increase" className="btn btn-primary">
                  Increase Stock
                </Link>
                <Link href="/inventory/adjustments/decrease" className="btn btn-outline">
                  Decrease Stock
                </Link>
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="text-sm text-gray-600">
                      {new Date(adjustment.created_at).toLocaleDateString()}
                    </td>
                    <td>{adjustment.product_name || 'N/A'}</td>
                    <td>
                      <span
                        className={`badge ${
                          adjustment.type === 'increase'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {adjustment.type === 'increase' ? 'Increase' : 'Decrease'}
                      </span>
                    </td>
                    <td className="font-medium">
                      {adjustment.type === 'increase' ? '+' : '-'}
                      {adjustment.quantity}
                    </td>
                    <td>{adjustment.reason || '-'}</td>
                    <td className="text-sm text-gray-600">{adjustment.created_by || 'System'}</td>
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

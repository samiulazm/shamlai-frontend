'use client';

import { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';

export default function IncreaseStockList() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch purchase/increase stock records
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading purchase records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Increase Stock List
          </h1>
          <p className="text-sm text-gray-600 mt-1">View all stock increase/purchase records</p>
        </div>
        <Link
          href="/inventory/adjustments/increase"
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Increase Stock
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No purchase records found</p>
          <Link href="/inventory/adjustments/increase" className="btn btn-primary">
            Create First Purchase Record
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Purchase records will appear here
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

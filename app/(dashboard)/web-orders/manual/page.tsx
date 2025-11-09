'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function ManualWebOrder() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          Manual Web Order
        </h1>
        <p className="text-sm text-gray-600 mt-1">Create a web order manually</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Manual Web Order Creation</h3>
          <p className="text-gray-600 mb-6">
            This feature allows you to manually create web orders.
          </p>
          <Link href="/orders/new" className="btn btn-primary">
            Create New Order
          </Link>
        </div>
      </div>
    </div>
  );
}

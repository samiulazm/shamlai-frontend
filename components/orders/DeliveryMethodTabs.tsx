'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';

interface DeliveryMethodTabsProps {
  shopId: string;
  selectedMethod: string | 'all';
  onMethodChange: (method: string | 'all') => void;
}

interface MethodCount {
  method: string | 'all';
  count: number;
}

export default function DeliveryMethodTabs({
  shopId,
  selectedMethod,
  onMethodChange,
}: DeliveryMethodTabsProps) {
  const [methodCounts, setMethodCounts] = useState<MethodCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMethodCounts();
  }, [shopId]);

  const fetchMethodCounts = async () => {
    try {
      setLoading(true);

      // Fetch all orders to count by delivery method
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('delivery_method')
        .eq('shop_id', shopId);

      if (error) throw error;

      // Count orders by delivery method
      const counts = new Map<string | 'all', number>();
      counts.set('all', orders?.length || 0);

      // Group by delivery method
      orders?.forEach((order) => {
        const method = (order as any).delivery_method || 'manual';
        counts.set(method, (counts.get(method) || 0) + 1);
      });

      // Convert to array
      const countsArray: MethodCount[] = [
        { method: 'all', count: counts.get('all') || 0 },
        ...Array.from(counts.entries())
          .filter(([method]) => method !== 'all')
          .map(([method, count]) => ({ method, count }))
          .sort((a, b) => b.count - a.count), // Sort by count descending
      ];

      setMethodCounts(countsArray);
    } catch (error) {
      console.error('Error fetching delivery method counts:', error);
      // Set default if error
      setMethodCounts([{ method: 'all', count: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const formatMethodName = (method: string): string => {
    if (method === 'all') return 'All';
    // Capitalize first letter of each word
    return method
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (
    methodCounts.length === 0 ||
    (methodCounts.length === 1 && methodCounts[0].method === 'all' && methodCounts[0].count === 0)
  ) {
    return null; // Don't show if no delivery methods
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {methodCounts.map(({ method, count }) => (
        <button
          key={method}
          onClick={() => onMethodChange(method)}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            selectedMethod === method
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {formatMethodName(method)}
          <span
            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
              selectedMethod === method ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

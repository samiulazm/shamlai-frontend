'use client';

import { useState, useEffect, memo } from 'react';
import type { OrderStatus } from '@/lib/types/database';
import { getOrderCountsByStatus } from '@/lib/services/orders';

interface OrderStatusTabsProps {
  shopId: string;
  selectedStatus: OrderStatus | 'all';
  onStatusChange: (status: OrderStatus | 'all') => void;
}

interface StatusCount {
  status: OrderStatus | 'all';
  count: number;
}

function OrderStatusTabs({ shopId, selectedStatus, onStatusChange }: OrderStatusTabsProps) {
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        setLoading(true);

        // Use optimized database aggregation
        const counts = await getOrderCountsByStatus(shopId);
        setStatusCounts(counts);
      } catch (error) {
        console.error('Error fetching status counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusCounts();
  }, [shopId]);

  const getStatusLabel = (status: OrderStatus | 'all'): string => {
    if (status === 'all') return 'All';
    const labels: Record<OrderStatus, string> = {
      pending: 'Pending',
      rts: 'RTS',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      pending_return: 'Pending Return',
      returned: 'Returned',
      partial: 'Partial',
      cancelled: 'Cancelled',
      pending_cancel: 'Pending Cancel',
      preorder: 'Preorder',
      lost: 'Lost',
      refunded: 'Refunded',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {statusCounts.map(({ status, count }) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            selectedStatus === status
              ? 'bg-brand-indigo text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {getStatusLabel(status)}
          <span
            className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
              selectedStatus === status ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// Wrap in memo to prevent unnecessary re-renders
export default memo(OrderStatusTabs);

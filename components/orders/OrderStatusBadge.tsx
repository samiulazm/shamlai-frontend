'use client';

import type { OrderStatus } from '@/lib/types/database';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  rts: {
    label: 'RTS',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pending_return: {
    label: 'Pending Return',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  returned: {
    label: 'Returned',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  partial: {
    label: 'Partial',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  pending_cancel: {
    label: 'Pending Cancel',
    className: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  preorder: {
    label: 'Preorder',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  lost: {
    label: 'Lost',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export default function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`badge inline-flex items-center font-medium border ${config.className} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}

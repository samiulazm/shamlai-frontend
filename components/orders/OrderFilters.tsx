'use client';

import { useState } from 'react';
import { X, Filter as FilterIcon } from 'lucide-react';
import type { OrderStatus } from '@/lib/types/database';

interface OrderFiltersProps {
  onFiltersChange: (filters: OrderFilters) => void;
  shopId: string;
}

export interface OrderFilters {
  status?: OrderStatus[];
  deliveryMethod?: string[];
  dateRange?: { start: Date; end: Date };
  customer?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentStatus?: string[];
}

export default function OrderFilters({ onFiltersChange, shopId }: OrderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({});

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: OrderFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 relative"
      >
        <FilterIcon className="h-5 w-5" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-indigo text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="card">
      <div className="card-pad">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
                Clear All
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              multiple
              value={filters.status || []}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value as OrderStatus
                );
                handleFilterChange('status', selected.length > 0 ? selected : undefined);
              }}
              className="w-full border rounded-lg p-2 text-sm"
              size={5}
            >
              <option value="pending">Pending</option>
              <option value="rts">RTS</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="pending_return">Pending Return</option>
              <option value="returned">Returned</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_cancel">Pending Cancel</option>
              <option value="preorder">Preorder</option>
              <option value="lost">Lost</option>
              <option value="refunded">Refunded</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              multiple
              value={filters.paymentStatus || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                handleFilterChange('paymentStatus', selected.length > 0 ? selected : undefined);
              }}
              className="w-full border rounded-lg p-2 text-sm"
              size={4}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'minAmount',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full border rounded-lg p-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'maxAmount',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange(
                    'dateRange',
                    start ? { start, end: filters.dateRange?.end || new Date() } : undefined
                  );
                }}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <input
                type="date"
                value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange(
                    'dateRange',
                    end ? { start: filters.dateRange?.start || new Date(), end } : undefined
                  );
                }}
                className="w-full border rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          {/* Customer Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <input
              type="text"
              placeholder="Search by name, email, phone"
              value={filters.customer || ''}
              onChange={(e) => handleFilterChange('customer', e.target.value || undefined)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

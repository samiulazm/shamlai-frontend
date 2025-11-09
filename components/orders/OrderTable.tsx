'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, MoreVertical, Download } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/types/database';
import OrderStatusBadge from './OrderStatusBadge';
import Pagination from '../common/Pagination';
import OrderExport from './OrderExport';

interface OrderTableProps {
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  showFilters?: boolean;
  onFiltersClick?: () => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
}

export default function OrderTable({
  orders,
  onStatusChange,
  showFilters = true,
  onFiltersClick,
  pagination,
}: OrderTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 50);
  const [showExport, setShowExport] = useState(false);

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query) ||
        order.customer_phone?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const aValue = (a as any)[sortBy.field];
      const bValue = (b as any)[sortBy.field];

      if (sortBy.field === 'created_at' || sortBy.field === 'total') {
        const aNum =
          sortBy.field === 'total'
            ? parseFloat(aValue?.toString() || '0')
            : new Date(aValue).getTime();
        const bNum =
          sortBy.field === 'total'
            ? parseFloat(bValue?.toString() || '0')
            : new Date(bValue).getTime();
        return sortBy.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (sortBy.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredOrders, sortBy]);

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    if (!pagination) return sortedOrders;
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedOrders.slice(start, end);
  }, [sortedOrders, pagination]);

  const displayOrders = pagination ? paginatedOrders : sortedOrders;

  const handleSort = (field: string) => {
    setSortBy((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortBy.direction === 'asc' ? (
      <span className="ml-1 text-gray-600">↑</span>
    ) : (
      <span className="ml-1 text-gray-600">↓</span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-indigo"
          />
        </div>
        <button
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          onClick={onFiltersClick}
        >
          <Filter className="h-5 w-5" />
          Filters
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      {/* Order Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center hover:text-brand-indigo"
                >
                  Created
                  <SortIcon field="created_at" />
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('order_number')}
                  className="flex items-center hover:text-brand-indigo"
                >
                  Invoice
                  <SortIcon field="order_number" />
                </button>
              </th>
              <th>Customer</th>
              <th>Note</th>
              <th>Product</th>
              <th>
                <button
                  onClick={() => handleSort('total')}
                  className="flex items-center hover:text-brand-indigo"
                >
                  Total
                  <SortIcon field="total" />
                </button>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  {searchQuery ? 'No orders found matching your search' : 'No orders'}
                </td>
              </tr>
            ) : (
              displayOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <div className="font-mono text-sm font-medium">
                      {order.order_number || `#${order.id.slice(-8)}`}
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="font-medium">{order.customer_email}</div>
                      {order.customer_phone && (
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      )}
                      {order.shipping_address1 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {order.shipping_address1.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {order.notes ? (
                      <span className="text-xs text-gray-500" title={order.notes}>
                        {order.notes.substring(0, 20)}...
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">
                      {/* Product info would come from order_items */}
                      <span className="text-gray-500">View items</span>
                    </div>
                  </td>
                  <td className="font-medium">৳{order.total?.toLocaleString() || '0'}</td>
                  <td>
                    <OrderStatusBadge status={order.status} size="sm" />
                    <div className="mt-1">
                      <span
                        className={`badge text-xs ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order.id}` as any}
                        className="text-brand-indigo hover:underline text-sm"
                      >
                        View
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.pageSize)}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}

      {!pagination && sortedOrders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-4 py-3 border-t">
          <div>
            Showing {sortedOrders.length} of {orders.length} orders
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && <OrderExport orders={orders} onClose={() => setShowExport(false)} />}
    </div>
  );
}

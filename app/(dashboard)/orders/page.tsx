'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { insforgeClient, OrderService } from '@/lib';
import type { Order, OrderStatus } from '@/lib/types/database';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderStatusTabs from '@/components/orders/OrderStatusTabs';
import DeliveryMethodTabs from '@/components/orders/DeliveryMethodTabs';
import OrderTable from '@/components/orders/OrderTable';
import OrderFilters, {
  type OrderFilters as OrderFiltersType,
} from '@/components/orders/OrderFilters';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string | 'all'>('all');
  const [shopId, setShopId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<OrderFiltersType>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, total: 0 });

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedDeliveryMethod, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      setShopId(user.user.id);

      // Fetch orders using the service
      const filters: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      if (selectedDeliveryMethod !== 'all') {
        filters.deliveryMethod = selectedDeliveryMethod;
      }

      const response = await OrderService.getOrders(user.user.id, filters);

      setOrders(response.data || []);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        total: response.total,
      });
    } catch (err: any) {
      const { logger } = await import('@/lib/utils/logger');
      logger.error('Error fetching orders', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Link href="/orders/new" className="btn btn-primary">
            Create Order
          </Link>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchOrders} className="btn btn-outline">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order List</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your orders</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          Create Order
        </Link>
      </div>

      {/* Status Tabs */}
      {shopId && (
        <div className="card">
          <div className="card-pad">
            <OrderStatusTabs
              shopId={shopId}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>
        </div>
      )}

      {/* Delivery Method Tabs */}
      {shopId && (
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500 mb-2">Delivery Methods</div>
            <DeliveryMethodTabs
              shopId={shopId}
              selectedMethod={selectedDeliveryMethod}
              onMethodChange={setSelectedDeliveryMethod}
            />
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && shopId && (
        <OrderFilters shopId={shopId} onFiltersChange={setAdvancedFilters} />
      )}

      {/* Order Table */}
      <div className="card">
        <div className="card-pad">
          <OrderTable
            orders={orders}
            showFilters={true}
            onFiltersClick={() => setShowFilters(!showFilters)}
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
              onPageSizeChange: (size) =>
                setPagination((prev) => ({ ...prev, pageSize: size, page: 1 })),
            }}
          />
        </div>
      </div>
    </div>
  );
}

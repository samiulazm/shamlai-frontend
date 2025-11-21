'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { insforgeClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface Payment {
  id: string;
  order_id: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  transaction_id: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  order?: {
    order_number: string;
    customer_id: string;
  };
  customer?: {
    full_name: string;
  };
}

export default function OrderPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Build query
      let query = insforgeClient.database
        .from('payments')
        .select(`
          *,
          order:orders(order_number, customer_id)
        `)
        .eq('shop_id', user.user.id)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter !== 'all') {
        query = query.eq('payment_status', filter);
      }

      const { data: paymentsData, error: paymentsError } = await query;

      if (paymentsError) {
        setError(paymentsError.message);
        return;
      }

      setPayments(paymentsData || []);
    } catch (err: any) {
      logger.error('Error fetching payments', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`badge ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalCompleted = payments
    .filter((p) => p.payment_status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = payments
    .filter((p) => p.payment_status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = payments
    .filter((p) => p.payment_status === 'refunded')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Order Payments</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchPayments} className="btn btn-outline">
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
        <h1 className="text-2xl font-bold">Order Payments</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`btn btn-sm ${filter === 'failed' ? 'btn-primary' : 'btn-outline'}`}
          >
            Failed
          </button>
          <button
            onClick={() => setFilter('refunded')}
            className={`btn btn-sm ${filter === 'refunded' ? 'btn-primary' : 'btn-outline'}`}
          >
            Refunded
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Total Payments</div>
            <div className="text-2xl font-bold mt-1">{payments.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold mt-1 text-green-600">৳{totalCompleted.toLocaleString()}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">৳{totalPending.toLocaleString()}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Refunded</div>
            <div className="text-2xl font-bold mt-1 text-gray-500">৳{totalRefunded.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad overflow-x-auto">
          {payments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <Link
                        href={`/orders/${payment.order_id}`}
                        className="text-brand-indigo hover:underline"
                      >
                        {(payment.order as any)?.order_number || `Order #${payment.order_id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="font-medium">
                      {payment.currency} {Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="capitalize">{payment.payment_method.replace('_', ' ')}</td>
                    <td>{getStatusBadge(payment.payment_status)}</td>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.transaction_id || 'N/A'}
                      </code>
                    </td>
                    <td>
                      {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <Link
                        href={`/orders/${payment.order_id}`}
                        className="text-brand-indigo hover:underline text-sm"
                      >
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-lg font-medium">No payments found</p>
                <p className="text-sm mt-2">
                  {filter !== 'all'
                    ? `No ${filter} payments to display`
                    : 'Payments will appear here when orders are placed'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

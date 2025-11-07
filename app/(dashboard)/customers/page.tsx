"use client";

import { useEffect, useState } from "react";
import { insforgeClient, OrderService } from "@/lib";
import { logger } from "@/lib/utils/logger";
import type { Customer } from "@/lib/types/database";

interface CustomerWithStats extends Customer {
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export default function Customers(){
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch customers from the database
      const { data: customersData, error: customersError } = await insforgeClient.database
        .from('customers')
        .select('*')
        .eq('shop_id', user.user.id)
        .order('created_at', { ascending: false });

      if (customersError) {
        setError(customersError.message);
        return;
      }

      // Fetch orders to calculate customer stats
      const { data: ordersData, error: ordersError } = await insforgeClient.database
        .from('orders')
        .select('customer_id, total, created_at')
        .eq('shop_id', user.user.id);

      if (ordersError) {
        logger.warn('Error fetching orders for customer stats', ordersError instanceof Error ? ordersError : new Error(String(ordersError)));
      }

      // Calculate stats for each customer
      const customersWithStats = (customersData || []).map(customer => {
        const customerOrders = ordersData?.filter(order => order.customer_id === customer.id) || [];
        const orderCount = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const lastOrderDate = customerOrders.length > 0 
          ? customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined;

        return {
          ...customer,
          orderCount,
          totalSpent,
          lastOrderDate
        };
      });

      setCustomers(customersWithStats);
    } catch (err: any) {
      logger.error('Error fetching customers', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchCustomers} className="btn btn-outline">Try Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {customers.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td className="py-3">
                      <div className="font-medium">
                        {customer.first_name && customer.last_name 
                          ? `${customer.first_name} ${customer.last_name}`
                          : customer.email?.split('@')[0] || 'Unknown'
                        }
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-800">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="font-medium">৳{customer.totalSpent.toLocaleString()}</td>
                    <td>
                      {customer.lastOrderDate ? (
                        <span className="text-sm text-gray-600">
                          {formatDate(customer.lastOrderDate)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No orders</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatDate(customer.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                <p className="text-gray-500 mb-4">Customers will appear here when they make their first purchase</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Save, UserCheck, Clock } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

interface FollowUp {
  id: string;
  order_id: string;
  customer_id: string;
  assigned_to?: string;
  status: 'pending' | 'completed' | 'cancelled';
  follow_up_date: string;
  notes: string;
  created_at: string;
}

export default function FollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchFollowUps();
  }, [filter]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);
      setFollowUps([]);
    } catch (error) {
      logger.error(
        'Error fetching follow-ups',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredFollowUps =
    filter === 'all' ? followUps : followUps.filter((f) => f.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Follow-ups</h1>
          <p className="text-gray-500 text-sm mt-1">Track customer follow-ups</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Total Follow-ups</div>
            <div className="text-2xl font-bold mt-1">{followUps.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold mt-1">
              {followUps.filter((f) => f.status === 'pending').length}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold mt-1">
              {followUps.filter((f) => f.status === 'completed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-pad">
          <div className="flex gap-2">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === f
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-ups Table */}
      <div className="card">
        <div className="card-pad overflow-x-auto">
          {filteredFollowUps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No follow-ups yet</h3>
              <p className="text-gray-500">Follow-ups will appear here when assigned</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Follow-up Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowUps.map((followUp) => (
                  <tr key={followUp.id}>
                    <td className="font-mono text-sm">#{followUp.order_id.slice(-8)}</td>
                    <td>Customer Name</td>
                    <td className="text-sm text-gray-600">
                      {new Date(followUp.follow_up_date).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          followUp.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : followUp.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {followUp.status}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{followUp.notes || '-'}</td>
                    <td>
                      <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface EmailSubscriber {
  id: string;
  email: string;
  full_name: string | null;
  status: 'active' | 'unsubscribed';
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  tags: string[] | null;
}

export default function EmailSubscribers() {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Build query
      let query = supabaseClient
        .from('email_subscribers')
        .select('*')
        .eq('shop_id', user.id)
        .order('subscribed_at', { ascending: false });

      // Apply filter
      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'unsubscribed') {
        query = query.eq('status', 'unsubscribed');
      }

      const { data: subscribersData, error: subscribersError } = await query;

      if (subscribersError) {
        setError(subscribersError.message);
        return;
      }

      setSubscribers(subscribersData || []);
    } catch (err: any) {
      logger.error(
        'Error fetching email subscribers',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to fetch email subscribers');
    } finally {
      setLoading(false);
    }
  };

  const exportSubscribers = () => {
    const csv = [
      ['Email', 'Name', 'Status', 'Source', 'Subscribed Date'],
      ...filteredSubscribers.map((sub) => [
        sub.email,
        sub.full_name || '',
        sub.status,
        sub.source || '',
        new Date(sub.subscribed_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      subscriber.email.toLowerCase().includes(searchLower) ||
      subscriber.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const unsubscribedCount = subscribers.filter((s) => s.status === 'unsubscribed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Email Subscribers</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchSubscribers} className="btn btn-outline">
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
        <h1 className="text-2xl font-bold">Email Subscribers</h1>
        <div className="flex gap-2">
          <button onClick={exportSubscribers} className="btn btn-outline">
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Total Subscribers</div>
            <div className="text-2xl font-bold mt-1">{subscribers.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{activeCount}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Unsubscribed</div>
            <div className="text-2xl font-bold mt-1 text-gray-500">{unsubscribedCount}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('unsubscribed')}
                className={`btn btn-sm ${filter === 'unsubscribed' ? 'btn-primary' : 'btn-outline'}`}
              >
                Unsubscribed
              </button>
            </div>
          </div>

          {filteredSubscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Subscribed Date</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td>{subscriber.email}</td>
                      <td>{subscriber.full_name || 'N/A'}</td>
                      <td>{subscriber.source || 'N/A'}</td>
                      <td>
                        <span
                          className={`badge ${
                            subscriber.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscriber.status}
                        </span>
                      </td>
                      <td>{new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
                      <td>
                        {subscriber.tags && subscriber.tags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {subscriber.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          'None'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg font-medium">
                  {searchTerm ? 'No subscribers found' : 'No subscribers yet'}
                </p>
                <p className="text-sm mt-2">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Email subscribers will appear here when customers sign up'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { User } from '@/lib/types/database';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'manager' as 'admin' | 'manager' | 'support',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users (in a real app, you'd filter by shop/team)
      const { data: usersData, error: usersError } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (err: any) {
      logger.error('Error fetching users', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.email) {
      setError('Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      // Note: In a real app, you'd send an invitation email
      // For now, we'll just show a message
      alert(`Invitation would be sent to ${inviteForm.email} with role: ${inviteForm.role}`);

      // Reset form
      setInviteForm({
        email: '',
        role: 'manager',
      });
    } catch (err: any) {
      logger.error('Error inviting user', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Users & Permissions</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-pad grid gap-3">
          <form onSubmit={handleInvite} className="grid md:grid-cols-4 gap-3">
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              disabled={inviting}
            />
            <select
              className="input"
              value={inviteForm.role}
              onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value as any }))}
              disabled={inviting}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="support">Support</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={inviting}>
              {inviting ? 'Sending...' : 'Invite'}
            </button>
          </form>

          <div className="rounded-xl border p-4 text-sm text-gray-600 mt-4">
            <div className="font-medium mb-2">Team Members</div>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{user.full_name || user.email || 'No name'}</div>
                      <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                    <span className="badge bg-blue-100 text-blue-800">Member</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No team members yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

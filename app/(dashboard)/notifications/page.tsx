'use client';

import { useEffect, useState } from 'react';
import { insforgeClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface Notification {
  id: string;
  user_id: string;
  notification_type: 'order' | 'system' | 'marketing' | 'payment' | 'other';
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
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
        .from('notifications')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'read') {
        query = query.eq('is_read', true);
      }

      const { data: notificationsData, error: notificationsError } = await query;

      if (notificationsError) {
        setError(notificationsError.message);
        return;
      }

      setNotifications(notificationsData || []);
    } catch (err: any) {
      logger.error('Error fetching notifications', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await insforgeClient.database
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );
    } catch (err: any) {
      logger.error('Error marking notification as read', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      const { error } = await insforgeClient.database
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Refresh notifications
      fetchNotifications();
    } catch (err: any) {
      logger.error('Error marking all notifications as read', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'marketing':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchNotifications} className="btn btn-outline">
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
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-outline">
              Mark All as Read
            </button>
          )}
          <div className="flex gap-2 border rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-brand-indigo text-white' : 'text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-brand-indigo text-white' : 'text-gray-700'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 rounded ${filter === 'read' ? 'bg-brand-indigo text-white' : 'text-gray-700'}`}
            >
              Read
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          {notifications.length > 0 ? (
            <div className="grid gap-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  {getNotificationIcon(notification.notification_type)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {notification.action_url && (
                        <a href={notification.action_url} className="text-xs text-brand-indigo hover:underline">
                          View Details
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm mt-2">You're all caught up!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

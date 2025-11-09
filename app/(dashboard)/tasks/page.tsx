'use client';

import { useState, useEffect } from 'react';
import { Plus, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);
      setTasks([]);
    } catch (error) {
      logger.error(
        'Error fetching tasks',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task List</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your tasks and to-dos</p>
        </div>
        <Link href="/tasks/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-2xl font-bold mt-1">{tasks.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold mt-1">
              {tasks.filter((t) => t.status === 'pending').length}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-2xl font-bold mt-1">
              {tasks.filter((t) => t.status === 'in_progress').length}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold mt-1">
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-pad">
          <div className="flex gap-2">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filter === f
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-pad">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">Create your first task to get started</p>
              <Link href="/tasks/new" className="btn btn-primary">
                Create Task
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <span className={`badge ${getPriorityColor(task.priority)} text-xs`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                      <button className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

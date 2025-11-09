'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

export default function HRMDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch HRM stats
      setStats({
        totalEmployees: 0,
        activeEmployees: 0,
        todayAttendance: 0,
        pendingTasks: 0,
      });
    } catch (error) {
      logger.error(
        'Error fetching HRM stats',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HRM dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">HRM Live Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time HRM metrics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Employees</div>
                <div className="text-2xl font-bold mt-1">{stats.totalEmployees}</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active Employees</div>
                <div className="text-2xl font-bold mt-1">{stats.activeEmployees}</div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Today's Attendance</div>
                <div className="text-2xl font-bold mt-1">{stats.todayAttendance}</div>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pending Tasks</div>
                <div className="text-2xl font-bold mt-1">{stats.pendingTasks}</div>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-pad">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="text-center py-12 text-gray-500">
            <p>No recent activities</p>
          </div>
        </div>
      </div>
    </div>
  );
}

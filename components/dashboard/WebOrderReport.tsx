'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getWebOrderReport, type WebOrderReport } from '@/lib/services/dashboard';

interface WebOrderReportWidgetProps {
  shopId: string;
}

const COLORS = {
  processing: '#3b82f6', // blue
  complete: '#10b981', // green
  cancel: '#ef4444', // red
  incomplete: '#f59e0b', // amber
};

export default function WebOrderReportWidget({ shopId }: WebOrderReportWidgetProps) {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '30d'>('today');
  const [report, setReport] = useState<WebOrderReport>({
    total: 0,
    processing: 0,
    complete: 0,
    cancelled: 0,
    incomplete: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [shopId, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await getWebOrderReport(shopId, dateRange);
      setReport(data);
    } catch (error) {
      console.error('Error fetching web order report:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Processing', value: report.processing, color: COLORS.processing },
    { name: 'Complete', value: report.complete, color: COLORS.complete },
    { name: 'Cancelled', value: report.cancelled, color: COLORS.cancel },
    { name: 'Incomplete', value: report.incomplete, color: COLORS.incomplete },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="card">
        <div className="card-pad">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-pad">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Web Order Report</h3>
          <div className="flex gap-1">
            {(['today', 'yesterday', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm rounded ${
                  dateRange === range
                    ? 'bg-brand-indigo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === '30d' ? '30D' : range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {report.total === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No web orders for this period</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-2xl font-bold">Total Orders: {report.total}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS.processing }}
                ></div>
                <div>
                  <div className="text-sm text-gray-500">Processing</div>
                  <div className="font-semibold">({report.processing})</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS.complete }}
                ></div>
                <div>
                  <div className="text-sm text-gray-500">Complete</div>
                  <div className="font-semibold">({report.complete})</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS.cancel }}
                ></div>
                <div>
                  <div className="text-sm text-gray-500">Cancel</div>
                  <div className="font-semibold">({report.cancelled})</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS.incomplete }}
                ></div>
                <div>
                  <div className="text-sm text-gray-500">Incomplete</div>
                  <div className="font-semibold">({report.incomplete})</div>
                </div>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

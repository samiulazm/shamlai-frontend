'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onDateRangeChange: (start: Date, end: Date) => void;
  defaultRange?: 'today' | 'yesterday' | '30d' | 'custom';
}

export default function DateRangePicker({
  onDateRangeChange,
  defaultRange = 'today',
}: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<'today' | 'yesterday' | '30d' | 'custom'>(
    defaultRange
  );
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const handleRangeChange = (range: 'today' | 'yesterday' | '30d' | 'custom') => {
    setSelectedRange(range);

    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case '30d':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        } else {
          return;
        }
        break;
    }

    onDateRangeChange(start, end);
  };

  const handleCustomDateSubmit = () => {
    if (customStart && customEnd) {
      handleRangeChange('custom');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 border rounded-lg p-1">
        <button
          onClick={() => handleRangeChange('today')}
          className={`px-3 py-1 text-sm rounded ${
            selectedRange === 'today'
              ? 'bg-brand-indigo text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleRangeChange('yesterday')}
          className={`px-3 py-1 text-sm rounded ${
            selectedRange === 'yesterday'
              ? 'bg-brand-indigo text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => handleRangeChange('30d')}
          className={`px-3 py-1 text-sm rounded ${
            selectedRange === '30d'
              ? 'bg-brand-indigo text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          30D
        </button>
      </div>

      {selectedRange === 'custom' && (
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-sm border rounded"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-sm border rounded"
          />
          <button
            onClick={handleCustomDateSubmit}
            className="px-3 py-1 text-sm bg-brand-indigo text-white rounded hover:bg-indigo-600"
          >
            Apply
          </button>
        </div>
      )}

      <button
        onClick={() => setSelectedRange('custom')}
        className={`p-2 rounded-lg border ${
          selectedRange === 'custom'
            ? 'bg-brand-indigo text-white border-brand-indigo'
            : 'text-gray-600 border-gray-300 hover:bg-gray-50'
        }`}
        title="Custom date range"
      >
        <Calendar className="h-4 w-4" />
      </button>
    </div>
  );
}

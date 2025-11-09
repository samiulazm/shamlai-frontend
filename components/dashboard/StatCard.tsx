'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change
  showChange?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, change, showChange = true, icon }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBg = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="card">
      <div className="card-pad">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="text-2xl font-semibold mt-2">{value}</div>
            {showChange && change !== undefined && (
              <div className={`mt-2 flex items-center gap-1 text-sm ${changeColor}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
                <span className="text-gray-500 text-xs ml-1">vs previous</span>
              </div>
            )}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </div>
    </div>
  );
}

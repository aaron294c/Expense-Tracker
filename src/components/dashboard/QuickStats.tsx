import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface QuickStatsProps {
  dailyAverage: number;
  weeklyChange: number;
  projectedSpend: number;
  daysLeft: number;
}

export function QuickStats({ dailyAverage, weeklyChange, projectedSpend, daysLeft }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Daily Average</h3>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(dailyAverage)}</p>
        <p className="text-xs text-gray-500">
          {weeklyChange >= 0 ? '+' : ''}{formatCurrency(weeklyChange)} vs last week
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Projected Spend</h3>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(projectedSpend)}</p>
        <p className="text-xs text-gray-500 text-right mt-1">
          {daysLeft} days left
        </p>
      </div>
    </div>
  );
}

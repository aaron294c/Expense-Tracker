import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface BudgetOverviewProps {
  spent: number;
  budget: number;
  currency?: string;
}

export function BudgetOverview({ spent, budget, currency = 'USD' }: BudgetOverviewProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h2>
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(spent, currency)}
        </p>
        <p className="text-sm text-gray-500">
          of {formatCurrency(budget, currency)}
        </p>
        <p className="text-sm font-medium text-blue-600 mt-1">
          {Math.round(percentage)}%
        </p>
      </div>
    </div>
  );
}

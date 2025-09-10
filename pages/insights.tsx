// pages/insights.tsx
import React from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { useHousehold } from '../hooks/useHousehold';
import { useCategorySummary } from '../hooks/useCategorySummary';
import { useMonth } from '../hooks/useMonth';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';

function InsightsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold, 'USD');
  const { currentMonth } = useMonth();

  const { summaries, getTotalSpent, getTotalBudget } = useCategorySummary(
    currentHousehold?.id || null,
    currentMonth
  );

  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();

  const topCategories = summaries
    .filter((s) => s.category_kind === 'expense' && s.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Insights</h1>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Spending Overview</h2>
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent, currency)}</p>
          <p className="text-sm text-gray-500">Total Spent This Month</p>
        </div>
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {formatCurrency(totalBudget - totalSpent, currency)} remaining of {formatCurrency(totalBudget, currency)} budget
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h2>
        {topCategories.length > 0 ? (
          <div className="space-y-3">
            {topCategories.map((category) => (
              <div key={category.category_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <span className="font-medium">{category.category_name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(category.spent, currency)}</p>
                  <p className="text-xs text-gray-500">
                    {category.budget > 0 ? `${Math.round((category.spent / category.budget) * 100)}% of budget` : 'No budget'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No expense data available</p>
        )}
      </Card>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <AuthWrapper>
      <AppLayout title="Insights">
        <InsightsContent />
      </AppLayout>
    </AuthWrapper>
  );
}

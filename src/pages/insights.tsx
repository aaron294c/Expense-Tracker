import React from 'react';
import { Layout } from '../components/Layout';
import { CategoryBreakdown } from '../components/insights/CategoryBreakdown';
import { QuickInsights } from '../components/insights/QuickInsights';
import { useCategorySummary } from '../hooks/useCategorySummary';
import { useBudgets } from '../hooks/useBudgets';
import { useHousehold } from '../hooks/useHousehold';
import { useMonth } from '../hooks/useMonth';

export default function InsightsPage() {
  const { currentHousehold } = useHousehold();
  const { currentMonth } = useMonth();
  const { summaries, isLoading } = useCategorySummary(currentHousehold?.id || null, currentMonth);
  const { data: budgetData } = useBudgets(currentHousehold?.id || null, currentMonth);

  const totalSpent = summaries
    .filter(s => s.category_kind === 'expense')
    .reduce((sum, s) => sum + s.spent, 0);

  const topCategory = summaries
    .filter(s => s.category_kind === 'expense')
    .sort((a, b) => b.spent - a.spent)[0];

  const savingsCategory = summaries
    .filter(s => s.category_kind === 'expense' && s.budget > s.spent)
    .sort((a, b) => (b.budget - b.spent) - (a.budget - a.spent))[0];

  const insightData = {
    burnRate: budgetData?.burn_rate || undefined,
    topCategory: topCategory ? {
      name: topCategory.category_name,
      spent: topCategory.spent,
      budget: topCategory.budget
    } : undefined,
    savings: savingsCategory ? {
      amount: savingsCategory.budget - savingsCategory.spent,
      category: savingsCategory.category_name
    } : undefined
  };

  if (isLoading) {
    return (
      <Layout title="Insights">
        <div className="p-4 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Insights">
      <div className="p-4 space-y-6">
        <CategoryBreakdown 
          categories={summaries}
          totalSpent={totalSpent}
        />
        
        <QuickInsights data={insightData} />
      </div>
    </Layout>
  );
}

import React from 'react';
import { Layout } from '../components/Layout';
import { BudgetOverview } from '../components/dashboard/BudgetOverview';
import { QuickStats } from '../components/dashboard/QuickStats';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { useBudgets } from '../../hooks/useBudgets';
import { useHousehold } from '../../hooks/useHousehold';
import { useMonth } from '../../hooks/useMonth';

export default function Dashboard() {
  const { currentHousehold } = useHousehold();
  const { currentMonth } = useMonth();
  const { data: budgetData, isLoading } = useBudgets(currentHousehold?.id || null, currentMonth);

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="p-4 space-y-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl mb-6" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const totalSpent = budgetData?.categories
    ?.filter(c => c.category_kind === 'expense')
    ?.reduce((sum, c) => sum + c.spent, 0) || 0;

  const totalBudget = budgetData?.categories
    ?.filter(c => c.category_kind === 'expense')
    ?.reduce((sum, c) => sum + c.budget, 0) || 0;

  return (
    <Layout title="Dashboard">
      <div className="p-4 space-y-6">
        <BudgetOverview 
          spent={totalSpent}
          budget={totalBudget}
        />
        
        <QuickStats
          dailyAverage={budgetData?.burn_rate?.daily_average || 0}
          weeklyChange={budgetData?.burn_rate?.daily_burn_rate || 0}
          projectedSpend={budgetData?.burn_rate?.projected_monthly_spend || 0}
          daysLeft={budgetData?.burn_rate?.remaining_days || 0}
        />
        
        <RecentTransactions />
      </div>
    </Layout>
  );
}

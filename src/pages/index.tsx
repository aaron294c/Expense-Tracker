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
          <div className="animate-pulse space-y-6">
            <div className="card p-6 space-y-4">
              <div className="h-6 bg-border/subtle rounded-xl w-32 mx-auto" />
              <div className="h-12 bg-border/subtle rounded-2xl w-48 mx-auto" />
              <div className="h-20 w-20 bg-border/subtle rounded-full mx-auto" />
              <div className="h-4 bg-border/subtle rounded-full w-24 mx-auto" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 space-y-3">
                <div className="h-4 bg-border/subtle rounded w-20" />
                <div className="h-8 bg-border/subtle rounded w-16" />
                <div className="h-3 bg-border/subtle rounded w-24" />
              </div>
              <div className="card p-5 space-y-3">
                <div className="h-4 bg-border/subtle rounded w-20" />
                <div className="h-8 bg-border/subtle rounded w-16" />
                <div className="h-3 bg-border/subtle rounded w-24" />
              </div>
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

      <div className="mt-4">
        <RecentTransactions />
      </div>
    </Layout>
  );
}

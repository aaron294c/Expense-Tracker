// pages/dashboard/overview.tsx
import React from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Layout } from '@/src/components/Layout';
import { BudgetOverview } from '@/src/components/dashboard/BudgetOverview';
import { QuickStats } from '@/src/components/dashboard/QuickStats';
import { RecentTransactions } from '@/src/components/dashboard/RecentTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useHousehold } from '@/hooks/useHousehold';
import { useMonth } from '@/hooks/useMonth';

export default function DashboardOverviewPage() {
  return (
    <AuthWrapper>
      <Layout title="Dashboard">
        <DashboardContent />
      </Layout>
    </AuthWrapper>
  );
}

function DashboardContent() {
  const { currentHousehold } = useHousehold();
  const { currentMonth } = useMonth();
  const { data: budgetData, isLoading } = useBudgets(currentHousehold?.id || null, currentMonth);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-xl mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Household Found</h2>
        <p className="text-gray-600 mb-4">You need to join a household to get started.</p>
        <button 
          onClick={() => window.location.href = '/setup'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Join Household
        </button>
      </div>
    );
  }

  const totalSpent = budgetData?.categories
    ?.filter(c => c.category_kind === 'expense')
    ?.reduce((sum, c) => sum + c.spent, 0) || 0;

  const totalBudget = budgetData?.categories
    ?.filter(c => c.category_kind === 'expense')
    ?.reduce((sum, c) => sum + c.budget, 0) || 0;

  return (
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
  );
}
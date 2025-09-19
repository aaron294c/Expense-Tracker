import React, { useState } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { useMonth } from '@/hooks/useMonth';
import { useCategorySummary } from '@/hooks/useCategorySummary';
import { useTransactions } from '@/hooks/useTransactions';
import { BudgetOverview } from './BudgetOverview';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { QuickActions } from './QuickActions';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface DashboardProps {
  householdId?: string;
}

export function Dashboard({ householdId }: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { household, isLoading: householdLoading, error: householdError } = useHousehold(householdId);
  const { monthData, isLoading: monthLoading } = useMonth(household?.id, selectedMonth);
  const { categorySummary, isLoading: categoryLoading } = useCategorySummary(household?.id, selectedMonth);
  const { transactions, isLoading: transactionsLoading } = useTransactions(household?.id, { limit: 10 });

  const isLoading = householdLoading || monthLoading || categoryLoading || transactionsLoading;
  const error = householdError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error} 
          title="Failed to load dashboard" 
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Household Found
          </h2>
          <p className="text-gray-600">
            Please create or join a household to view your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {household.name} Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of your household's financial activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <BudgetOverview 
            monthData={monthData}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
        <div>
          <QuickActions householdId={household.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CategoryBreakdown 
            categorySummary={categorySummary}
            selectedMonth={selectedMonth}
          />
        </div>
        <div>
          <RecentTransactions 
            transactions={transactions}
            isLoading={transactionsLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
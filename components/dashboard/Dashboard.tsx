import React, { useState } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { useMonth } from '@/hooks/useMonth';
import { useCategorySummary } from '@/hooks/useCategorySummary';
import { useTransactions } from '@/hooks/useTransactions';
import { BudgetOverview } from './BudgetOverview';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { QuickActions } from './QuickActions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className = '' }: DashboardProps) {
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { currentMonth } = useMonth();
  const { data: categorySummary, isLoading: summaryLoading } = useCategorySummary(
    currentHousehold?.id,
    currentMonth
  );
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(
    currentHousehold?.id,
    { limit: 10 }
  );

  if (householdLoading || summaryLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Household Found
          </h2>
          <p className="text-gray-600">
            Please create or join a household to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {currentHousehold.name} Dashboard
        </h1>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Overview - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <BudgetOverview 
            categorySummary={categorySummary}
            currentMonth={currentMonth}
          />
        </div>

        {/* Category Breakdown */}
        <div>
          <CategoryBreakdown 
            categorySummary={categorySummary}
            currentMonth={currentMonth}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <RecentTransactions 
          transactions={transactions || []}
          isLoading={transactionsLoading}
        />
      </div>
    </div>
  );
}
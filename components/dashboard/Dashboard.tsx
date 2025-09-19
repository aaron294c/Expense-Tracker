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

export function Dashboard() {
  const { household, isLoading: householdLoading } = useHousehold();
  const { currentMonth } = useMonth();
  const { categorySummary, isLoading: summaryLoading } = useCategorySummary(currentMonth);
  const { transactions, isLoading: transactionsLoading } = useTransactions({ limit: 5 });

  if (householdLoading || summaryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No household found. Please create a household to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {household.name} Dashboard
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Budget Overview */}
      <BudgetOverview categorySummary={categorySummary} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <CategoryBreakdown categorySummary={categorySummary} />

        {/* Recent Transactions */}
        <RecentTransactions 
          transactions={transactions} 
          isLoading={transactionsLoading} 
        />
      </div>
    </div>
  );
}
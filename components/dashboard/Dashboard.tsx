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
import { ErrorMessage } from '../common/ErrorMessage';

export function Dashboard() {
  const { currentHousehold, isLoading: householdLoading, error: householdError } = useHousehold();
  const { currentMonth, setCurrentMonth } = useMonth();
  const { categorySummary, isLoading: summaryLoading } = useCategorySummary(
    currentHousehold?.id,
    currentMonth
  );
  const { transactions, isLoading: transactionsLoading } = useTransactions(
    currentHousehold?.id,
    { month: currentMonth, limit: 10 }
  );

  if (householdLoading) {
    return <LoadingSpinner />;
  }

  if (householdError || !currentHousehold) {
    return <ErrorMessage message="Failed to load household data" />;
  }

  const isLoading = summaryLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentHousehold.name} Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="2024-01">January 2024</option>
            <option value="2024-02">February 2024</option>
            <option value="2024-03">March 2024</option>
            <option value="2024-04">April 2024</option>
            <option value="2024-05">May 2024</option>
            <option value="2024-06">June 2024</option>
            <option value="2024-07">July 2024</option>
            <option value="2024-08">August 2024</option>
            <option value="2024-09">September 2024</option>
            <option value="2024-10">October 2024</option>
            <option value="2024-11">November 2024</option>
            <option value="2024-12">December 2024</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <BudgetOverview categorySummary={categorySummary} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown categorySummary={categorySummary} />
            <RecentTransactions transactions={transactions} />
          </div>
          
          <QuickActions householdId={currentHousehold.id} />
        </>
      )}
    </div>
  );
}
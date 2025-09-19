import React, { useState } from 'react';
import { useHousehold } from '@/hooks/useHousehold';
import { useMonth } from '@/hooks/useMonth';
import { useCategorySummary } from '@/hooks/useCategorySummary';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetOverview } from './BudgetOverview';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { QuickActions } from './QuickActions';
import { StatGrid } from '../layout/StatGrid';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className = '' }: DashboardProps) {
  const { household, loading: householdLoading } = useHousehold();
  const { currentMonth, setCurrentMonth } = useMonth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { transactions, loading: transactionsLoading, refetch } = useTransactions({
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString()
  });
  
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { categorySummary, loading: categoryLoading } = useCategorySummary(monthStart, monthEnd);
  
  const loading = householdLoading || transactionsLoading || budgetsLoading || categoryLoading;
  
  // Calculate key metrics
  const totalSpent = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  const totalIncome = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  const netFlow = totalIncome - totalExpenses;
  
  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const budgetRemaining = totalBudget - totalExpenses;
  
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!household) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Expense Tracker</h2>
        <p className="text-gray-600 mb-6">Get started by setting up your household and adding your first transaction.</p>
        <QuickActions />
      </Card>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Household: {household.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Period Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="p-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-gray-900 min-w-24 text-center">
              {format(currentMonth, 'MMM yyyy')}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="p-2"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="hidden sm:inline-flex"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Stats Grid */}
      <StatGrid
        stats={[
          {
            label: 'Total Spent',
            value: totalSpent,
            format: 'currency',
            trend: { value: 0, isPositive: false }
          },
          {
            label: 'Income',
            value: totalIncome,
            format: 'currency',
            trend: { value: 0, isPositive: true }
          },
          {
            label: 'Expenses',
            value: totalExpenses,
            format: 'currency',
            trend: { value: 0, isPositive: false }
          },
          {
            label: 'Net Flow',
            value: netFlow,
            format: 'currency',
            trend: { value: 0, isPositive: netFlow >= 0 },
            className: netFlow >= 0 ? 'text-green-600' : 'text-red-600'
          },
          {
            label: 'Budget Remaining',
            value: budgetRemaining,
            format: 'currency',
            trend: { value: 0, isPositive: budgetRemaining >= 0 },
            className: budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
          },
          {
            label: 'Transactions',
            value: transactions?.length || 0,
            format: 'number'
          }
        ]}
      />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <div className="lg:col-span-1">
          <BudgetOverview
            budgets={budgets}
            categorySummary={categorySummary}
            period={selectedPeriod}
          />
        </div>
        
        {/* Category Breakdown */}
        <div className="lg:col-span-1">
          <CategoryBreakdown
            categorySummary={categorySummary}
            totalSpent={totalExpenses}
            period={selectedPeriod}
          />
        </div>
        
        {/* Recent Transactions - Full Width */}
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={transactions?.slice(0, 10) || []}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
      
      {/* Empty State for No Data */}
      {transactions?.length === 0 && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-600 mb-4">Start tracking your expenses by adding your first transaction.</p>
          <QuickActions showOnlyAdd />
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
// pages/budgets-enhanced.tsx - Enhanced budgets page with progress UI and real-time updates
import React, { useState, useEffect } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useBudgets } from '../hooks/useBudgets';
import { useHousehold } from '../hooks/useHousehold';
import { 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Edit2,
  Settings,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';

interface BudgetProgressProps {
  category: {
    category_name: string;
    icon: string;
    color: string;
    budget: number;
    spent: number;
    remaining: number;
    budget_percentage: number;
    category_kind: 'expense' | 'income';
  };
  currency: string;
}

function BudgetProgress({ category, currency }: BudgetProgressProps) {
  const percentage = Math.min(category.budget_percentage, 100);
  const isOverBudget = category.budget_percentage > 100;
  const isNearLimit = category.budget_percentage > 80 && !isOverBudget;
  
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getBackgroundColor = () => {
    if (isOverBudget) return 'bg-red-100';
    if (isNearLimit) return 'bg-orange-100';
    return 'bg-green-100';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-700';
    if (isNearLimit) return 'text-orange-700';
    return 'text-green-700';
  };

  return (
    <Card className={`p-4 border-l-4 border-l-${category.color.replace('#', '')} ${getBackgroundColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{category.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{category.category_name}</h3>
            <p className={`text-sm ${getTextColor()}`}>
              {isOverBudget ? 'Over budget' : isNearLimit ? 'Near limit' : 'On track'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${getTextColor()}`}>
            {formatCurrency(category.spent, currency)} / {formatCurrency(category.budget, currency)}
          </div>
          <div className={`text-sm ${getTextColor()}`}>
            {category.remaining >= 0 
              ? `${formatCurrency(category.remaining, currency)} left`
              : `${formatCurrency(Math.abs(category.remaining), currency)} over`
            }
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
          {isOverBudget && (
            <div className="absolute top-0 right-0 h-3 bg-red-600 rounded-r-full animate-pulse"
                 style={{ width: `${Math.min(percentage - 100, 20)}%` }} />
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">0%</span>
          <span className={`text-xs font-medium ${getTextColor()}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">100%</span>
        </div>
      </div>
    </Card>
  );
}

function BudgetsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold || {}, 'USD');
  
  // Current month by default
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const { data, isLoading, error, refetch } = useBudgets(currentHousehold?.id || null, currentMonth);
  
  // Auto-refresh when transactions change (simulate real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [refetch]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your budgets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Budgets</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Budgets Set</h3>
        <p className="text-gray-600 mb-6">
          Create your first budget to start tracking your spending goals.
        </p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
          <Plus size={20} />
          Create Budget
        </button>
      </div>
    );
  }

  const expenseCategories = data.categories.filter(c => c.category_kind === 'expense');
  const totalBudget = expenseCategories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = expenseCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Budgets</h1>
          <p className="text-gray-600">Track your spending against monthly goals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-lg border">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="px-4 py-2 flex items-center gap-2">
              <Calendar size={16} />
              <span className="font-medium">{getMonthName(currentMonth)}</span>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBudget, currency)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              overallPercentage > 100 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <TrendingDown className={`h-6 w-6 ${
                overallPercentage > 100 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className={`text-2xl font-bold ${
                overallPercentage > 100 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatCurrency(totalSpent, currency)}
              </p>
              <p className="text-sm text-gray-500">
                {overallPercentage.toFixed(1)}% of budget
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              totalRemaining < 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {totalRemaining < 0 ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {totalRemaining < 0 ? 'Over Budget' : 'Remaining'}
              </p>
              <p className={`text-2xl font-bold ${
                totalRemaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(Math.abs(totalRemaining), currency)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Burn Rate Warning */}
      {data.burn_rate && data.burn_rate.projected_monthly_spend > data.burn_rate.budget && (
        <Card className="p-4 border-l-4 border-l-orange-400 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-800">Projected Overspend Warning</h4>
              <p className="text-sm text-orange-700 mt-1">
                At your current spending rate of {formatCurrency(data.burn_rate.daily_burn_rate, currency)}/day, 
                you'll spend {formatCurrency(data.burn_rate.projected_monthly_spend, currency)} this month.
                Try to limit daily spending to {formatCurrency(data.burn_rate.suggested_daily_spend, currency)} 
                for the remaining {data.burn_rate.remaining_days} days.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Progress */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories
            .sort((a, b) => b.budget_percentage - a.budget_percentage)
            .map((category) => (
              <BudgetProgress
                key={category.category_id}
                category={category}
                currency={currency}
              />
            ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/transactions/add"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={16} />
            Add Expense
          </a>
          <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Edit2 size={16} />
            Edit Budgets
          </button>
          <a
            href="/transactions"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <TrendingDown size={16} />
            View Transactions
          </a>
        </div>
      </Card>
    </div>
  );
}

function BudgetsPageEnhanced() {
  return (
    <AppLayout>
      <BudgetsContent />
    </AppLayout>
  );
}

export default function BudgetsPageEnhancedWrapper() {
  return (
    <AuthWrapper>
      <BudgetsPageEnhanced />
    </AuthWrapper>
  );
}
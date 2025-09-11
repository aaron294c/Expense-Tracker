// pages/budgets.tsx - Full budget allocation and tracking system
import React, { useState, useEffect } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useHousehold } from '../hooks/useHousehold';
import { authenticatedFetch } from '../lib/api';
import { 
  Plus, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Edit2,
  Save,
  X,
  Settings,
  PieChart
} from 'lucide-react';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: 'expense' | 'income';
}

interface BudgetItem {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  budget: number;
  spent: number;
  remaining: number;
  budget_percentage: number;
  category_kind: 'expense' | 'income';
}

interface BudgetData {
  categories: BudgetItem[];
  all_categories: Category[];
  month: string;
  household_id: string;
}

function BudgetProgress({ item, currency }: { item: BudgetItem; currency: string }) {
  const percentage = Math.min(item.budget_percentage || 0, 100);
  const isOverBudget = (item.budget_percentage || 0) > 100;
  const isNearLimit = (item.budget_percentage || 0) > 80 && !isOverBudget;
  
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getBackgroundColor = () => {
    if (isOverBudget) return 'bg-red-50 border-red-200';
    if (isNearLimit) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-700';
    if (isNearLimit) return 'text-orange-700';
    return 'text-green-700';
  };

  return (
    <Card className={`p-4 border-2 ${getBackgroundColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{item.icon || '📊'}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{item.category_name}</h3>
            <p className={`text-sm ${getTextColor()}`}>
              {isOverBudget ? 'Over budget' : isNearLimit ? 'Near limit' : 'On track'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${getTextColor()}`}>
            {formatCurrency(item.spent || 0, currency)} / {formatCurrency(item.budget || 0, currency)}
          </div>
          <div className={`text-sm ${getTextColor()}`}>
            {item.remaining >= 0 
              ? `${formatCurrency(item.remaining, currency)} left`
              : `${formatCurrency(Math.abs(item.remaining), currency)} over`
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

function BudgetAllocator({ 
  categories, 
  currentBudgets, 
  onSave, 
  isLoading 
}: { 
  categories: Category[];
  currentBudgets: BudgetItem[];
  onSave: (budgets: { category_id: string; amount: number }[]) => void;
  isLoading: boolean;
}) {
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with current budget amounts
    const amounts: Record<string, string> = {};
    currentBudgets.forEach(item => {
      amounts[item.category_id] = (item.budget || 0).toString();
    });
    setBudgetAmounts(amounts);
  }, [currentBudgets]);

  const handleSave = () => {
    const budgets = Object.entries(budgetAmounts)
      .filter(([_, amount]) => amount && parseFloat(amount) > 0)
      .map(([category_id, amount]) => ({
        category_id,
        amount: parseFloat(amount)
      }));
    onSave(budgets);
  };

  const expenseCategories = categories.filter(cat => cat.kind === 'expense');
  const totalBudget = Object.values(budgetAmounts)
    .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Set Budget Limits</h2>
          <p className="text-gray-600">Allocate monthly spending limits for each category</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-blue-600">${totalBudget.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {expenseCategories.map(category => {
          const currentBudget = currentBudgets.find(b => b.category_id === category.id);
          return (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{category.icon || '📊'}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  {currentBudget && (
                    <p className="text-sm text-gray-500">
                      Spent: ${(currentBudget.spent || 0).toFixed(2)} this month
                    </p>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetAmounts[category.id] || ''}
                  onChange={(e) => setBudgetAmounts(prev => ({ 
                    ...prev, 
                    [category.id]: e.target.value 
                  }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Budget</span>
            </>
          )}
        </button>
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
  
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllocator, setShowAllocator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBudgets = async () => {
    if (!currentHousehold?.id) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authenticatedFetch(`/api/budgets?household_id=${currentHousehold.id}&month=${currentMonth}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data || { categories: [], all_categories: [], month: currentMonth, household_id: currentHousehold.id });

    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudgets = async (budgets: { category_id: string; amount: number }[]) => {
    if (!currentHousehold?.id) return;

    try {
      setIsSaving(true);
      setError(null);

      await authenticatedFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          household_id: currentHousehold.id,
          month: currentMonth,
          category_budgets: budgets.map(b => ({ ...b, rollover_enabled: false }))
        }),
      });

      // Refresh data
      await fetchBudgets();
      setShowAllocator(false);

    } catch (err) {
      console.error('Error saving budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to save budgets');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (currentHousehold?.id) {
      fetchBudgets();
    }
  }, [currentHousehold?.id, currentMonth]);

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
            onClick={fetchBudgets}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  const expenseCategories = data?.categories?.filter(c => c.category_kind === 'expense') || [];
  const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = expenseCategories.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Budget Tracker</h1>
          <p className="text-gray-600">Allocate and track your monthly spending limits</p>
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
          <button
            onClick={() => setShowAllocator(!showAllocator)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {showAllocator ? <X size={16} /> : <Settings size={16} />}
            {showAllocator ? 'Cancel' : 'Set Budgets'}
          </button>
        </div>
      </div>

      {/* Budget Allocator */}
      {showAllocator && (
        <BudgetAllocator
          categories={data?.all_categories || []}
          currentBudgets={expenseCategories}
          onSave={saveBudgets}
          isLoading={isSaving}
        />
      )}

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

      {/* Category Progress */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        {expenseCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseCategories
              .sort((a, b) => (b.budget_percentage || 0) - (a.budget_percentage || 0))
              .map((item) => (
                <BudgetProgress
                  key={item.category_id}
                  item={item}
                  currency={currency}
                />
              ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <PieChart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Budgets Set</h3>
            <p className="text-gray-600 mb-6">
              Create your first budget to start tracking your spending goals.
            </p>
            <button
              onClick={() => setShowAllocator(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Set Budget Limits
            </button>
          </Card>
        )}
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
          <a
            href="/transactions"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <TrendingDown size={16} />
            View Transactions
          </a>
          <button
            onClick={fetchBudgets}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={16} />
            Refresh Data
          </button>
        </div>
      </Card>
    </div>
  );
}

function BudgetsPage() {
  return (
    <AppLayout>
      <BudgetsContent />
    </AppLayout>
  );
}

export default function BudgetsPageWrapper() {
  return (
    <AuthWrapper>
      <BudgetsPage />
    </AuthWrapper>
  );
}
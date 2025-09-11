// pages/budgets.tsx - Full budget allocation and tracking system
import React, { useState, useEffect } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useHousehold } from '../hooks/useHousehold';
import { supabase } from '@/lib/supabaseBrowser';
import { authenticatedFetch } from '../lib/api';
import { useBudgetData } from '../hooks/useBudgetData';
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

  // Don't render if no budget is set
  if (!item.budget || item.budget <= 0) {
    return null;
  }

  return (
    <div className="card-premium p-6 hover-lift animate-slide-up border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg animate-float" 
            style={{ backgroundColor: item.color || '#6B7280' }}
          >
            {item.icon || '📊'}
          </div>
          <div>
            <h3 className="text-heading mb-2">{item.category_name}</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isOverBudget ? 'bg-red-400' : isNearLimit ? 'bg-yellow-400' : 'bg-green-400'
              } animate-pulse shadow-lg`}></div>
              <span className={`px-3 py-2 rounded-full text-sm font-bold ${
                isOverBudget ? 'bg-red-100 text-red-700 shadow-red-200' : 
                isNearLimit ? 'bg-yellow-100 text-yellow-700 shadow-yellow-200' : 
                'bg-green-100 text-green-700 shadow-green-200'
              } shadow-md`}>
                {isOverBudget ? '🚨 Over Budget' : isNearLimit ? '⚠️ Near Limit' : '✅ On Track'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-4xl font-bold mb-2 ${
            isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            ${(item.spent || 0).toFixed(0)}
          </div>
          <div className="text-caption text-gray-500 mb-3">
            of ${(item.budget || 0).toFixed(0)} budgeted
          </div>
          <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
            item.remaining >= 0 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            ${Math.abs(item.remaining || 0).toFixed(0)} {item.remaining >= 0 ? 'remaining' : 'over budget'}
          </div>
        </div>
      </div>
      
      {/* Clean Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {item.category_name} Progress
          </span>
          <span className={`px-2 py-1 rounded text-sm font-bold ${
            isOverBudget ? 'bg-red-600 text-white' : 
            isNearLimit ? 'bg-yellow-600 text-white' : 
            'bg-green-600 text-white'
          }`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200/50 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                isOverBudget ? 'bg-gradient-to-r from-red-400 to-red-600' :
                isNearLimit ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                'bg-gradient-to-r from-green-400 to-green-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with current budget amounts
    const amounts: Record<string, string> = {};
    currentBudgets.forEach(item => {
      if (item.budget > 0) {
        amounts[item.category_id] = item.budget.toString();
      }
    });
    setBudgetAmounts(amounts);
  }, [currentBudgets]);

  const handleSave = async () => {
    const budgets = Object.entries(budgetAmounts)
      .filter(([_, amount]) => amount && parseFloat(amount) > 0)
      .map(([category_id, amount]) => ({
        category_id,
        amount: parseFloat(amount)
      }));
    
    try {
      await onSave(budgets);
      setSuccessMessage('💰 Budget saved successfully! Progress updated.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const expenseCategories = categories.filter(cat => cat.kind === 'expense');
  const totalAllocated = Object.values(budgetAmounts)
    .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  const totalSpent = currentBudgets.reduce((sum, item) => sum + (item.spent || 0), 0);
  const remainingBudget = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-premium p-6 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-caption font-medium mb-1">Total Allocated</p>
          <p className="value-large text-2xl text-blue-600">${totalAllocated.toFixed(2)}</p>
        </div>
        <div className="card-premium p-6 text-center">
          <div className="text-2xl mb-2">{remainingBudget >= 0 ? '💰' : '⚠️'}</div>
          <p className="text-caption font-medium mb-1">Remaining</p>
          <p className={`value-large text-2xl ${
            remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>${Math.abs(remainingBudget).toFixed(2)}</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-slide-up">
          <p className="text-green-700 text-center font-medium">{successMessage}</p>
        </div>
      )}

      {/* Category Budget Cards */}
      <div className="card-premium p-8">
        <div className="mb-6">
          <h2 className="text-heading mb-2">Set Budget Limits</h2>
          <p className="text-body">Allocate monthly spending limits for each category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expenseCategories.map(category => {
            const currentBudget = currentBudgets.find(b => b.category_id === category.id);
            const spent = currentBudget?.spent || 0;
            const categoryColor = category.color || '#6B7280';
            
            return (
              <div key={category.id} className="group bg-gradient-to-br from-gray-50 to-blue-50/20 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300" 
                    style={{ backgroundColor: categoryColor }}
                  >
                    {category.icon || '📊'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    {spent > 0 && (
                      <p className="text-sm text-gray-500">
                        Spent ${spent.toFixed(2)} this month
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-4 text-gray-400 font-medium text-lg">$</div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetAmounts[category.id] || ''}
                    onChange={(e) => setBudgetAmounts(prev => ({ 
                      ...prev, 
                      [category.id]: e.target.value 
                    }))}
                    className="w-full pl-8 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 placeholder-gray-400 text-lg font-medium"
                    placeholder="Enter budget amount"
                  />
                </div>
                
                {/* Mini Progress Preview */}
                {budgetAmounts[category.id] && parseFloat(budgetAmounts[category.id]) > 0 && spent > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{((spent / parseFloat(budgetAmounts[category.id])) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((spent / parseFloat(budgetAmounts[category.id])) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading || Object.keys(budgetAmounts).length === 0}
            className="flex-1 btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-3" />
                <span>Saving Budget...</span>
              </>
            ) : (
              <>
                <Save size={20} className="mr-3" />
                <span>Save Budget Limits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold || {}, 'USD');

  // === NEW: wait for auth to hydrate ===
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(() => { if (mounted) setAuthReady(true); });
    return () => { mounted = false; };
  }, []);
  // =====================================

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

      const response = await authenticatedFetch(
        `/api/budgets-minimal?household_id=${currentHousehold.id}`
      );

      if (response?.error) {
        throw new Error(response.error);
      }

      setData(
        response?.data || {
          categories: [],
          all_categories: [],
          month: currentMonth,
          household_id: currentHousehold.id,
        }
      );
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

      await authenticatedFetch(`/api/budgets-minimal?household_id=${currentHousehold.id}`, {
        method: 'POST',
        body: JSON.stringify({
          category_budgets: budgets,
        }),
      });

      await fetchBudgets();
      setShowAllocator(false);
    } catch (err) {
      console.error('Error saving budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to save budgets');
    } finally {
      setIsSaving(false);
    }
  };

  // === UPDATED: only fetch when auth + household are ready ===
  useEffect(() => {
    if (!authReady) return;
    if (!currentHousehold?.id) return;
    fetchBudgets();
  }, [authReady, currentHousehold?.id, currentMonth]);
  // =====================================

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + (direction === 'prev' ? -1 : 1));
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Loading gate (include authReady to avoid flicker)
  if (!authReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your budgets...</p>
        </div>
      </div>
    );
  }

  // === UPDATED: friendlier error text ===
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Budgets</h3>
          <p className="text-gray-600 mb-4">
            {error === 'Unauthorized'
              ? 'Your session may have expired. Please sign in again.'
              : error}
          </p>
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
  // =====================================

  const expenseCategories = data?.categories?.filter(c => c.category_kind === 'expense') || [];
  const totalBudget = expenseCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = expenseCategories.reduce((sum, c) => sum + (c.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      {/* Clean Header */}
      <div className="card-glass p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-float">💰</div>
            <div>
              <h1 className="text-display">Budget Tracker</h1>
              <p className="text-body text-gray-600">Track your monthly spending goals</p>
            </div>
          </div>
          
          {/* Right: Month Navigation + Action */}
          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-blue-50 rounded-l-2xl transition-all duration-200 group"
                title="Previous Month"
              >
                <ArrowLeft size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
              </button>
              <div className="px-6 py-3 flex items-center gap-2 border-x border-gray-200/50">
                <Calendar size={18} className="text-blue-600" />
                <span className="font-semibold text-gray-900 min-w-[140px] text-center">
                  {getMonthName(currentMonth)}
                </span>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-blue-50 rounded-r-2xl transition-all duration-200 group"
                title="Next Month"
              >
                <ArrowRight size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Toggle Budget Setter */}
            <button
              onClick={() => setShowAllocator(!showAllocator)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                showAllocator 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-gray-500/25' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25'
              } hover:scale-105 active:scale-95`}
            >
              {showAllocator ? (
                <>
                  <X size={18} />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Settings size={18} />
                  <span>Set Budgets</span>
                </>
              )}
            </button>
          </div>
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
      {/* (unchanged UI below) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-8 hover-glow animate-scale-in">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-caption font-medium mb-2">Total Budget</p>
              <p className="value-large text-3xl text-blue-600">
                {formatCurrency(totalBudget, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-8 hover-glow animate-scale-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl shadow-lg ${
              overallPercentage > 100 
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25' 
                : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25'
            }`}>
              <TrendingDown className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-caption font-medium mb-2">Total Spent</p>
              <p className={`value-large text-3xl ${
                overallPercentage > 100 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(totalSpent, currency)}
              </p>
              <p className="text-caption text-gray-500 font-medium">
                {overallPercentage.toFixed(1)}% of budget
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium p-8 hover-glow animate-scale-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-2xl shadow-lg ${
              totalRemaining < 0 
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25'
                : 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25'
            }`}>
              {totalRemaining < 0 ? (
                <AlertTriangle className="h-8 w-8 text-white" />
              ) : (
                <CheckCircle className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-caption font-medium mb-2">
                {totalRemaining < 0 ? 'Over Budget' : 'Remaining'}
              </p>
              <p className={`value-large text-3xl ${
                totalRemaining < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(Math.abs(totalRemaining), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Progress */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">📊 Budget Progress</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-gray-600">On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-600">Near Limit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-gray-600">Over Budget</span>
            </div>
          </div>
        </div>
        {expenseCategories.length > 0 ? (
          <div className="space-y-4">
            {expenseCategories
              .sort((a, b) => (b.budget_percentage || 0) - (a.budget_percentage || 0))
              .filter(item => item.budget > 0) // Only show categories with budgets
              .map((item, index) => (
                <BudgetProgress key={item.category_id} item={item} currency={currency} />
              ))}
            
            {/* Show message if no budgets are set */}
            {expenseCategories.filter(item => item.budget > 0).length === 0 && (
              <div className="card-premium p-8 text-center">
                <div className="text-4xl mb-4 animate-bounce-gentle">🎯</div>
                <h3 className="text-heading mb-2">No Budget Limits Set</h3>
                <p className="text-body text-gray-600 mb-6">
                  Set spending limits to track your progress and stay on budget.
                </p>
                <button
                  onClick={() => setShowAllocator(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Set Your First Budget
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="card-premium p-8 text-center">
            <div className="text-4xl mb-4 animate-bounce-gentle">📈</div>
            <h3 className="text-heading mb-2">No Categories Found</h3>
            <p className="text-body text-gray-600 mb-6">
              Create expense categories first, then set budget limits for each.
            </p>
            <a
              href="/settings"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Settings size={20} />
              Manage Categories
            </a>
          </div>
        )}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="card-premium p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-2xl">⚡</div>
          <h3 className="text-heading">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/transactions/add"
            className="group bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div>
                <div className="font-semibold">Add Expense</div>
                <div className="text-red-100 text-sm opacity-90">Record spending</div>
              </div>
            </div>
          </a>
          
          <a
            href="/transactions"
            className="group bg-gradient-to-br from-gray-600 to-gray-700 text-white p-6 rounded-2xl hover:shadow-xl hover:shadow-gray-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingDown size={24} />
              </div>
              <div>
                <div className="font-semibold">Transactions</div>
                <div className="text-gray-100 text-sm opacity-90">View history</div>
              </div>
            </div>
          </a>
          
          <button
            onClick={fetchBudgets}
            className="group bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-2xl hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="font-semibold">Refresh</div>
                <div className="text-green-100 text-sm opacity-90">Update data</div>
              </div>
            </div>
          </button>
        </div>
      </div>
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
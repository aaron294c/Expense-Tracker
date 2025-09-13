// pages/budgets.tsx - Full budget allocation and tracking system
import React, { useState, useEffect } from 'react';
import { Screen } from '../components/_layout/Screen';
import { BottomDock } from '../components/navigation/BottomDock';
import { StatGrid } from '../components/layout/StatGrid';
import { StatCard } from '../components/mobile/StatCard';
import { OpaqueModal } from '../components/ui/OpaqueModal';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MonthPickerPill } from '../components/ui/MonthPickerPill';
import { useHousehold } from '../hooks/useHousehold';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
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
import Link from 'next/link';
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
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gray-50 grid place-items-center">
            {item.icon || '📊'}
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900 truncate">{item.category_name}</h3>
            <p className="text-[12px] text-gray-500 truncate">
              of ${(item.budget || 0).toFixed(0)} budgeted
            </p>
          </div>
        </div>
        <div className="min-w-[96px] text-right">
          <div className="text-[22px] font-semibold tabular-nums">
            <span className="text-[14px] text-gray-500 align-top mr-0.5">$</span>
            <span className={
              isOverBudget ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'
            }>
              {(item.spent || 0).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
        }`}></div>
        <span className={`text-[12px] font-medium ${
          isOverBudget ? 'text-rose-700' : isNearLimit ? 'text-amber-700' : 'text-emerald-700'
        }`}>
          {isOverBudget ? 'Over Budget' : isNearLimit ? 'Near Limit' : 'On Track'}
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${
              isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[12px] text-gray-500">
          {percentage.toFixed(0)}% used • ${Math.abs(item.remaining || 0).toFixed(0)} {item.remaining >= 0 ? 'remaining' : 'over'}
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
      {/* Summary KPI Cards */}
      <StatGrid>
        <StatCard
          icon={<span className="text-xl">🎯</span>}
          label="Total Allocated"
          value={`$${totalAllocated.toFixed(2)}`}
          sub="Monthly budget"
        />
        <StatCard
          icon={<span className="text-xl">{remainingBudget >= 0 ? '💰' : '⚠️'}</span>}
          label="Remaining"
          value={`$${Math.abs(remainingBudget).toFixed(2)}`}
          sub="This month"
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          sub="Categories"
        />
      </StatGrid>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 animate-slide-up">
          <p className="text-green-700 text-center font-medium">{successMessage}</p>
        </div>
      )}

      {/* Category Budget Cards */}
      <div className="card-premium p-8">
        <div className="mb-6">
          <h2 className="text-section-title mb-2">Set Budget Limits</h2>
          <p className="text-body">Allocate monthly spending limits for each category</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expenseCategories.map(category => {
            const currentBudget = currentBudgets.find(b => b.category_id === category.id);
            const spent = currentBudget?.spent || 0;
            const categoryColor = category.color || '#6B7280';
            
            return (
              <div key={category.id} className="card-unified motion-card-mount">
                {/* Top row: icon + title/label + amount */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gray-50 grid place-items-center">
                      {category.icon || '📊'}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="card-title">{category.name}</h3>
                      <p className="card-subtitle">
                        {spent > 0 ? `Spent this month` : 'No spending yet'}
                      </p>
                    </div>
                  </div>
                  <div className="card-amount">
                    <span className="currency-symbol">$</span>
                    {spent.toFixed(2)}
                  </div>
                </div>
                
                
                {/* Middle row: chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {budgetAmounts[category.id] && parseFloat(budgetAmounts[category.id]) > 0 ? (
                    <>
                      {spent > parseFloat(budgetAmounts[category.id]) ? (
                        <span className="status-chip-danger">Over Budget</span>
                      ) : (
                        <span className="status-chip-success">On Track</span>
                      )}
                      {spent > parseFloat(budgetAmounts[category.id]) && (
                        <span className="status-chip-danger">
                          ${(spent - parseFloat(budgetAmounts[category.id])).toFixed(2)} over
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="status-chip-warning">No Budget Set</span>
                  )}
                </div>

                {/* Input Section */}
                <div className="mt-3">
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
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pl-8 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                      placeholder="Enter budget amount"
                    />
                  </div>
                </div>
                
                {/* Bottom row: progress bar + label */}
                {budgetAmounts[category.id] && parseFloat(budgetAmounts[category.id]) > 0 && (
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${
                          spent > parseFloat(budgetAmounts[category.id]) ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ 
                          width: `${Math.min((spent / parseFloat(budgetAmounts[category.id])) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <p className="progress-label mt-1">
                      {Math.round((spent / parseFloat(budgetAmounts[category.id])) * 100)}% of budget used
                    </p>
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
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-gray-900">Budgets</h1>
          <p className="text-[13px] text-gray-500">Track your monthly spending goals</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllocator(!showAllocator)}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] text-white px-4 py-2 shadow hover:bg-[#1e4fd1] active:scale-95 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90"><path fill="currentColor" d="M19 13H5v-2h14v2Z"/></svg>
          <span className="text-[14px] font-medium">Set Budgets</span>
        </button>
      </div>

      {/* Month Navigation */}
      <MonthPickerPill
        label={getMonthName(currentMonth)}
        onPrev={() => navigateMonth('prev')}
        onNext={() => navigateMonth('next')}
      />

      {/* Budget Allocator */}
      {showAllocator && (
        <BudgetAllocator
          categories={data?.all_categories || []}
          currentBudgets={expenseCategories}
          onSave={saveBudgets}
          isLoading={isSaving}
        />
      )}

      {/* Overview Cards - 2-col grid */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">
            <Target size={16} />
          </div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Total Budget</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{formatCurrency(totalBudget, currency)}</div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">
            <TrendingDown size={16} />
          </div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Total Spent</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{formatCurrency(totalSpent, currency)}</div>
          <div className="mt-1 text-[12px] text-gray-500">{overallPercentage.toFixed(1)}% of budget</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 mt-3">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 text-center">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600 mx-auto">
            {totalRemaining < 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          </div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">{totalRemaining < 0 ? 'Over Budget' : 'Remaining'}</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{formatCurrency(Math.abs(totalRemaining), currency)}</div>
        </div>
      </div>

      {/* Category Progress */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold text-gray-900">Budget Progress</h2>
          <div className="flex gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] bg-emerald-50 text-emerald-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              On Track
            </div>
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] bg-amber-50 text-amber-700">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              Near Limit
            </div>
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] bg-rose-50 text-rose-700">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              Over Budget
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

    </div>
  );
}


function BudgetsPage() {
  const { currentHousehold } = useHousehold();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  const handleAddTransaction = () => {
    setShowAddTransaction(true);
  };

  return (
    <>
      <Screen>
        <BudgetsContent />
      </Screen>

      <BottomDock onAdd={handleAddTransaction} />
      
      {currentHousehold && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          householdId={currentHousehold.id}
          onSuccess={() => setShowAddTransaction(false)}
        />
      )}
    </>
  );
}

export default function BudgetsPageWrapper() {
  return (
    <BudgetsPage />
  );
}
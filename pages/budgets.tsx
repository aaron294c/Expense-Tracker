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
    <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-gray-50 grid place-items-center text-xl">
            {item.icon || '📊'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{item.category_name}</h3>
            <p className="text-sm text-gray-500">
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

  const hasAnyBudgets = Object.keys(budgetAmounts).some(key => budgetAmounts[key] && parseFloat(budgetAmounts[key]) > 0);
  const completionPercentage = hasAnyBudgets ? Math.round((Object.keys(budgetAmounts).filter(key => budgetAmounts[key] && parseFloat(budgetAmounts[key]) > 0).length / expenseCategories.length) * 100) : 0;

  // Quick amount suggestions based on common spending patterns
  const getQuickAmounts = (categoryName: string) => {
    const suggestions = {
      'Food & Dining': [300, 500, 800],
      'Transportation': [200, 400, 600],
      'Shopping': [100, 300, 500],
      'Entertainment': [100, 200, 400],
      'Bills & Utilities': [150, 300, 500],
      'Healthcare': [50, 150, 300]
    };
    return suggestions[categoryName as keyof typeof suggestions] || [100, 300, 500];
  };

  // Budget templates for quick setup
  const budgetTemplates = [
    {
      name: "Conservative",
      icon: "🛡️",
      description: "Lower spending limits for careful budgeting",
      multiplier: 0.7
    },
    {
      name: "Balanced",
      icon: "⚖️",
      description: "Moderate limits for everyday spending",
      multiplier: 1.0
    },
    {
      name: "Flexible",
      icon: "🌟",
      description: "Higher limits for more spending freedom",
      multiplier: 1.4
    }
  ];

  const applyTemplate = (template: typeof budgetTemplates[0]) => {
    const baseBudgets = {
      'Food & Dining': 500,
      'Transportation': 300,
      'Shopping': 200,
      'Entertainment': 150,
      'Bills & Utilities': 250,
      'Healthcare': 100
    };

    const newBudgets: Record<string, string> = {};
    expenseCategories.forEach(category => {
      const baseAmount = baseBudgets[category.name as keyof typeof baseBudgets] || 200;
      const adjustedAmount = Math.round(baseAmount * template.multiplier);
      newBudgets[category.id] = adjustedAmount.toString();
    });

    setBudgetAmounts(newBudgets);
    setSuccessMessage(`✨ ${template.name} budget template applied! Review and adjust as needed.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Budget Setup</h2>
            <p className="text-base text-gray-600 mt-1">
              {hasAnyBudgets ? `${completionPercentage}% complete` : 'Set your monthly spending limits'}
            </p>
          </div>
          <div className="size-16 rounded-full bg-blue-500 grid place-items-center text-white text-2xl">
            {hasAnyBudgets ? '🎯' : '📝'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-200/50 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Summary Cards */}
        {hasAnyBudgets && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">${totalAllocated.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">${totalSpent.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(remainingBudget).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">{remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50/80 backdrop-blur border border-green-200/50 rounded-2xl p-4 animate-slide-up shadow-lg">
          <p className="text-green-700 text-center font-medium">{successMessage}</p>
        </div>
      )}

      {/* Budget Templates - Show when no budgets are set */}
      {!hasAnyBudgets && (
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Start Templates</h3>
            <p className="text-base text-gray-600">Choose a template to get started, then customize as needed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgetTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => applyTemplate(template)}
                className="p-6 text-left rounded-2xl border border-gray-200/80 hover:border-blue-300/80 hover:bg-blue-50/50 transition-all active:scale-[0.98] group"
              >
                <div className="size-12 rounded-full bg-gray-100 group-hover:bg-blue-100 grid place-items-center text-2xl mb-4 transition-colors">
                  {template.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to apply →
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-blue-500 grid place-items-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                💡
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Pro Tip</h4>
                <p className="text-sm text-blue-700">
                  Templates are a starting point. You can always adjust individual categories after applying a template.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Budget Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Category Budgets</h2>
          <div className="text-sm text-gray-500">
            {Object.keys(budgetAmounts).filter(key => budgetAmounts[key] && parseFloat(budgetAmounts[key]) > 0).length} of {expenseCategories.length} set
          </div>
        </div>

        <div className="space-y-4">
          {expenseCategories.map(category => {
            const currentBudget = currentBudgets.find(b => b.category_id === category.id);
            const spent = currentBudget?.spent || 0;
            const hasBudget = budgetAmounts[category.id] && parseFloat(budgetAmounts[category.id]) > 0;
            const budgetAmount = parseFloat(budgetAmounts[category.id] || '0');
            const isOverBudget = hasBudget && spent > budgetAmount;
            const usagePercentage = hasBudget ? (spent / budgetAmount) * 100 : 0;
            const quickAmounts = getQuickAmounts(category.name);

            return (
              <div key={category.id} className="rounded-2xl bg-white/95 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-gray-50 grid place-items-center text-xl">
                      {category.icon || '📊'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {spent > 0 ? `$${spent.toFixed(0)} spent this month` : 'No spending yet'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {hasBudget && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isOverBudget
                        ? 'bg-red-100 text-red-700'
                        : usagePercentage > 80
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isOverBudget ? 'Over Budget' : usagePercentage > 80 ? 'Near Limit' : 'On Track'}
                    </div>
                  )}
                </div>

                {/* Budget Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Monthly Budget Limit
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">$</div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={budgetAmounts[category.id] || ''}
                      onChange={(e) => setBudgetAmounts(prev => ({
                        ...prev,
                        [category.id]: e.target.value
                      }))}
                      className="w-full rounded-2xl border border-gray-200/80 bg-white/90 px-5 py-4 pl-10 text-lg placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="0"
                    />
                  </div>

                  {/* Quick Amount Suggestions */}
                  <div className="flex gap-2 mt-3">
                    <div className="text-xs text-gray-500 self-center mr-2">Quick:</div>
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setBudgetAmounts(prev => ({
                          ...prev,
                          [category.id]: amount.toString()
                        }))}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100/80 hover:bg-blue-100/80 hover:text-blue-700 rounded-xl transition-all active:scale-95"
                      >
                        ${amount}
                      </button>
                    ))}
                    {/* Smart suggestion based on spending */}
                    {spent > 0 && (
                      <button
                        type="button"
                        onClick={() => setBudgetAmounts(prev => ({
                          ...prev,
                          [category.id]: Math.round(spent * 1.2).toString()
                        }))}
                        className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100/80 hover:bg-blue-200/80 rounded-xl transition-all active:scale-95 border border-blue-200/50"
                      >
                        ${Math.round(spent * 1.2)} ✨
                      </button>
                    )}
                  </div>

                  {/* Smart insight */}
                  {spent > 0 && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50/50 rounded-lg px-2 py-1">
                      💡 Based on your ${spent.toFixed(0)} spending, we suggest ${Math.round(spent * 1.2)}
                    </div>
                  )}
                </div>

                {/* Progress Visualization */}
                {hasBudget && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${spent.toFixed(0)} spent</span>
                      <span>${(budgetAmount - spent).toFixed(0)} remaining</span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-gradient-to-r from-red-400 to-red-600'
                            : usagePercentage > 80
                            ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                            : 'bg-gradient-to-r from-green-400 to-green-600'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      {Math.round(usagePercentage)}% of budget used
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Helpful Tips */}
        {hasAnyBudgets && (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 p-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-full bg-indigo-100 grid place-items-center text-indigo-600 text-xl flex-shrink-0">
                🎯
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Tips</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Review and adjust your budgets monthly based on your spending patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Set realistic limits - too strict budgets are harder to follow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Include a small buffer for unexpected expenses in each category</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Save Section */}
        <div className="sticky bottom-24 bg-white/95 backdrop-blur border border-gray-100/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Save?</h3>
              <p className="text-sm text-gray-600">
                {hasAnyBudgets ? 'Your budget setup looks great!' : 'Set at least one budget to continue'}
              </p>
            </div>
            {hasAnyBudgets && (
              <div className="size-12 rounded-full bg-green-100 grid place-items-center text-green-600">
                <CheckCircle size={24} />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading || !hasAnyBudgets}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving Budget...</span>
              </>
            ) : (
              <>
                <Save size={20} />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
    </div>
  );
}

export default function BudgetsPageWrapper() {
  return (
    <BudgetsPage />
  );
}
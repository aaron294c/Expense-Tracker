// components/dashboard/Dashboard.tsx
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
import { useAuth } from '@/components/auth/AuthProvider';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();
  const { summaries, isLoading: summaryLoading } = useCategorySummary(currentHousehold?.id || null, currentMonth);
  const { transactions, isLoading: transactionsLoading } = useTransactions(currentHousehold?.id || null, { limit: 10 });

  if (householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Household Found</h2>
          <p className="text-gray-600 mb-4">You need to create or join a household to get started.</p>
          <button className="btn-primary">Create Household</button>
        </div>
      </div>
    );
  }

  const totalSpent = summaries
    .filter(s => s.category_kind === 'expense')
    .reduce((total, s) => total + s.spent, 0);

  const totalBudget = summaries
    .filter(s => s.category_kind === 'expense')
    .reduce((total, s) => total + s.budget, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">{currentHousehold.name}</p>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-4 bg-gray-50 rounded-lg p-3">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-medium text-gray-900">{monthDisplay}</h2>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <QuickActions householdId={currentHousehold.id} />

        {/* Budget Overview */}
        <BudgetOverview
          totalSpent={totalSpent}
          totalBudget={totalBudget}
          isLoading={summaryLoading}
        />

        {/* Category Breakdown */}
        <CategoryBreakdown
          summaries={summaries}
          isLoading={summaryLoading}
        />

        {/* Recent Transactions */}
        <RecentTransactions
          transactions={transactions}
          isLoading={transactionsLoading}
        />
      </div>
    </div>
  );
}

// components/dashboard/BudgetOverview.tsx
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface BudgetOverviewProps {
  totalSpent: number;
  totalBudget: number;
  isLoading: boolean;
}

export function BudgetOverview({ totalSpent, totalBudget, isLoading }: BudgetOverviewProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="flex items-center justify-center mb-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;
  const circumference = 2 * Math.PI * 60;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const getStatusColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (percentage >= 100) return <AlertTriangle size={16} />;
    if (percentage >= 80) return <TrendingUp size={16} />;
    return <TrendingDown size={16} />;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
      
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className={percentage >= 100 ? 'text-red-500' : percentage >= 80 ? 'text-yellow-500' : 'text-blue-500'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {Math.round(percentage)}%
              </div>
              <div className="text-xs text-gray-500">used</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Spent</span>
          <span className="font-semibold text-gray-900">£{totalSpent.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Budget</span>
          <span className="font-semibold text-gray-900">£{totalBudget.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className={`text-sm flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            {remaining >= 0 ? 'Remaining' : 'Over Budget'}
          </span>
          <span className={`font-semibold ${getStatusColor()}`}>
            £{Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// components/dashboard/CategoryBreakdown.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_kind: 'expense' | 'income';
  icon: string;
  color: string;
  spent: number;
  budget: number;
  remaining: number;
}

interface CategoryBreakdownProps {
  summaries: CategorySummary[];
  isLoading: boolean;
}

export function CategoryBreakdown({ summaries, isLoading }: CategoryBreakdownProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-48 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const expenseCategories = summaries
    .filter(s => s.category_kind === 'expense' && s.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 8);

  const chartData = expenseCategories.map(category => ({
    name: category.category_name,
    value: category.spent,
    color: category.color,
  }));

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <PieChart size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600">No expenses this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
      
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {expenseCategories.slice(0, 5).map((category) => (
          <div key={category.category_id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-700">{category.category_name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              £{category.spent.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// components/dashboard/RecentTransactions.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  merchant: string | null;
  amount: number;
  direction: 'inflow' | 'outflow';
  occurred_at: string;
  primary_category_name: string;
  primary_category_icon: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <TrendingDown size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600">No transactions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <button
          onClick={() => router.push('/transactions')}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {transactions.slice(0, 5).map((transaction) => (
          <div key={transaction.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              transaction.direction === 'outflow' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {transaction.direction === 'outflow' ? (
                <TrendingDown size={16} className="text-red-600" />
              ) : (
                <TrendingUp size={16} className="text-green-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {transaction.merchant || transaction.description}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {transaction.primary_category_name} • {new Date(transaction.occurred_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className={`text-right ${
              transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
            }`}>
              <span className="font-semibold">
                {transaction.direction === 'outflow' ? '-' : '+'}£{transaction.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// components/dashboard/QuickActions.tsx
import React, { useState } from 'react';
import { Plus, Camera, Upload } from 'lucide-react';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';

interface QuickActionsProps {
  householdId: string;
}

export function QuickActions({ householdId }: QuickActionsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="card text-center py-4 hover:bg-gray-50 transition-colors"
        >
          <Plus size={24} className="mx-auto mb-2 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Add Expense</span>
        </button>
        
        <button className="card text-center py-4 hover:bg-gray-50 transition-colors">
          <Camera size={24} className="mx-auto mb-2 text-green-600" />
          <span className="text-sm font-medium text-gray-900">Scan Receipt</span>
        </button>
        
        <button className="card text-center py-4 hover:bg-gray-50 transition-colors">
          <Upload size={24} className="mx-auto mb-2 text-purple-600" />
          <span className="text-sm font-medium text-gray-900">Import</span>
        </button>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        householdId={householdId}
        onSuccess={() => {
          setIsAddModalOpen(false);
          // Optionally trigger a refresh
        }}
      />
    </>
  );
}

// components/transactions/AddTransactionModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { supabase } from '@/lib/supabaseBrowser';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: 'expense' | 'income';
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  onSuccess?: () => void;
}

export function AddTransactionModal({ isOpen, onClose, householdId, onSuccess }: AddTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    merchant: '',
    direction: 'outflow' as 'inflow' | 'outflow',
    category_id: '',
    occurred_at: new Date().toISOString().split('T')[0],
  });

  const { createTransaction } = useTransactions(householdId);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, householdId]);

  const fetchData = async () => {
    try {
      const [accountsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('accounts')
          .select('*')
          .eq('household_id', householdId)
          .eq('is_archived', false),
        supabase
          .from('categories')
          .select('*')
          .eq('household_id', householdId)
          .order('name')
      ]);

      if (accountsResponse.data) setAccounts(accountsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.description) return;

    setIsSubmitting(true);
    try {
      const transactionData = {
        account_id: formData.account_id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        merchant: formData.merchant || undefined,
        direction: formData.direction,
        occurred_at: formData.occurred_at,
        categories: formData.category_id ? [{
          category_id: formData.category_id,
          weight: 1.0
        }] : undefined
      };

      await createTransaction(transactionData);
      
      // Reset form
      setFormData({
        account_id: '',
        amount: '',
        description: '',
        merchant: '',
        direction: 'outflow',
        category_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c.kind === 'expense');
  const incomeCategories = categories.filter(c => c.kind === 'income');
  const currentCategories = formData.direction === 'outflow' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, direction: 'outflow', category_id: '' }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  formData.direction === 'outflow'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, direction: 'inflow', category_id: '' }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  formData.direction === 'inflow'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field pl-10"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              id="account"
              value={formData.account_id}
              onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input-field"
              placeholder="What was this for?"
              required
            />
          </div>

          {/* Merchant */}
          <div>
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant (Optional)
            </label>
            <input
              id="merchant"
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
              className="input-field"
              placeholder="Where was this purchased?"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="input-field"
            >
              <option value="">Select category</option>
              {currentCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                id="date"
                type="date"
                value={formData.occurred_at}
                onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting || !formData.account_id || !formData.amount || !formData.description}
            >
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Dashboard />;
}
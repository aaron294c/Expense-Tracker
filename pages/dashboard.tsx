// pages/dashboard.tsx - Updated with functional buttons and enhanced filtering
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../hooks/useHousehold';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useBudgetData } from '../hooks/useBudgetData';
import { useMonth } from '../hooks/useMonth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { AddAccountModal } from '../components/accounts/AddAccountModal';
import { 
  Plus, 
  Camera, 
  Upload, 
  CreditCard, 
  PieChart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  PiggyBank,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Account type configuration
const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account', icon: Building2, color: 'from-blue-500 to-blue-600' },
  { value: 'savings', label: 'Savings Account', icon: PiggyBank, color: 'from-green-500 to-green-600' },
  { value: 'credit', label: 'Credit Card', icon: CreditCard, color: 'from-red-500 to-red-600' },
  { value: 'cash', label: 'Cash/Wallet', icon: Wallet, color: 'from-yellow-500 to-yellow-600' },
];

function AccountsBreakdown({ accounts, fmtCurrency }: { accounts: any[], fmtCurrency: (v: number) => string }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <div className="text-4xl mb-4 animate-bounce-gentle">💳</div>
        <h3 className="text-heading mb-2">No Accounts Added</h3>
        <p className="text-body text-gray-600 mb-6">
          Add your bank accounts and credit cards to track your finances.
        </p>
        <a
          href="/accounts"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Add Account
        </a>
      </div>
    );
  }

  const totalAssets = accounts
    .filter(a => a.type !== 'credit')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);
  
  const totalDebt = accounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0);
  
  const netWorth = totalAssets - totalDebt;

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType?.icon || Building2;
  };

  const getAccountColor = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType?.color || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-premium p-6 text-center">
          <div className="text-2xl mb-2">💰</div>
          <p className="text-caption font-medium mb-1">Total Assets</p>
          <p className="value-large text-2xl text-green-600">{fmtCurrency(totalAssets)}</p>
        </div>
        <div className="card-premium p-6 text-center">
          <div className="text-2xl mb-2">💳</div>
          <p className="text-caption font-medium mb-1">Total Debt</p>
          <p className="value-large text-2xl text-red-600">{fmtCurrency(totalDebt)}</p>
        </div>
        <div className="card-premium p-6 text-center">
          <div className="text-2xl mb-2">{netWorth >= 0 ? '📈' : '📉'}</div>
          <p className="text-caption font-medium mb-1">Net Worth</p>
          <p className={`value-large text-2xl ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmtCurrency(netWorth)}
          </p>
        </div>
      </div>

      {/* Individual Accounts */}
      <div className="space-y-3">
        {accounts
          .sort((a, b) => {
            // Sort by type priority, then by balance
            const typeOrder = { current: 0, savings: 1, cash: 2, credit: 3 };
            const aPriority = typeOrder[a.type as keyof typeof typeOrder] || 4;
            const bPriority = typeOrder[b.type as keyof typeof typeOrder] || 4;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return (b.current_balance || 0) - (a.current_balance || 0);
          })
          .map((account, index) => {
            const IconComponent = getAccountIcon(account.type);
            const gradientColor = getAccountColor(account.type);
            const isCredit = account.type === 'credit';
            const balance = account.current_balance || 0;
            const displayBalance = isCredit ? Math.abs(balance) : balance;
            
            return (
              <div 
                key={account.account_id} 
                className="card-premium p-4 hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${gradientColor}`}>
                      <IconComponent size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{account.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-caption text-gray-500 capitalize">
                          {account.type === 'current' ? 'Checking' : account.type}
                        </span>
                        {account.transaction_count > 0 && (
                          <>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <span className="text-caption text-gray-500">
                              {account.transaction_count} transactions
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      isCredit ? 'text-red-600' : balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isCredit && displayBalance > 0 ? '-' : ''}{fmtCurrency(displayBalance)}
                    </div>
                    {isCredit && (
                      <div className="text-caption text-gray-500">Credit Balance</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } =
    useTransactions(currentHousehold?.id || null, { limit: 5 });
  const { accounts, isLoading: accountsLoading, refetch: refetchAccounts } = 
    useAccounts(currentHousehold?.id || null);
  const { budgetData, getTotalSpent, getTotalBudget, getBudgetUtilization } =
    useBudgetData(currentHousehold?.id || null);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  if (authLoading || householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Household Found</h2>
          <p className="text-gray-600 mb-4">You need to join a household to get started.</p>
          <a href="/setup" className="btn-primary">Setup Household</a>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();
  const monthlyIncome = transactions
    .filter(t => t.direction === 'inflow' && new Date(t.occurred_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const budgetPct = getBudgetUtilization();

  // Quick action handlers
  const handleAddExpense = () => {
    setTransactionType('expense');
    setShowAddTransaction(true);
  };

  const handleAddIncome = () => {
    setTransactionType('income');
    setShowAddTransaction(true);
  };

  const handleTransactionSuccess = () => {
    refetchTransactions();
    setShowAddTransaction(false);
  };

  const handleAccountSuccess = () => {
    refetchAccounts();
    setShowAddAccount(false);
  };

  // Filter transactions based on quick filter
  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (quickFilter) {
      case 'today':
        filtered = transactions.filter(t => t.occurred_at.startsWith(today));
        break;
      case 'week':
        filtered = transactions.filter(t => t.occurred_at >= weekAgo);
        break;
      case 'month':
        filtered = transactions.filter(t => t.occurred_at >= monthAgo);
        break;
      default:
        filtered = transactions;
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => 
        t.categories?.some((cat: any) => cat.category_id === selectedCategory)
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Get unique categories for filter dropdown
  const getAvailableCategories = () => {
    const categorySet = new Set();
    transactions.forEach(t => {
      if (t.categories) {
        t.categories.forEach((cat: any) => {
          if (cat.category_id && cat.category_name) {
            categorySet.add(JSON.stringify({
              id: cat.category_id,
              name: cat.category_name,
              icon: cat.icon || '📝'
            }));
          }
        });
      }
    });
    return Array.from(categorySet).map(str => JSON.parse(str as string));
  };

  const availableCategories = getAvailableCategories();

  return (
    <div className="min-h-screen pb-20 animate-fade-in">
      <header className="card-glass border-0 shadow-2xl shadow-blue-500/10 mb-6">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="animate-float">
              <div className="text-4xl mb-2">💰</div>
            </div>
            <button onClick={() => signOut()} className="btn-secondary">
              <Settings size={20} />
            </button>
          </div>
          <div>
            <h1 className="text-display mb-2">Dashboard</h1>
            <p className="text-body mb-1">Welcome back, {user.email?.split('@')[0]}</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-caption font-medium text-blue-600">{currentHousehold.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <div className="card-premium p-6 hover-lift animate-slide-up">
          <div className="flex items-center justify-between">
            <button 
              onClick={goToPreviousMonth} 
              className="p-3 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={24} className="text-blue-600" />
            </button>
            <div className="text-center">
              <h2 className="text-heading mb-1">{monthDisplay}</h2>
              <p className="text-micro text-blue-600 font-medium">Tap to navigate</p>
            </div>
            <button 
              onClick={goToNextMonth} 
              className="p-3 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronRight size={24} className="text-blue-600" />
            </button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card-premium p-8 text-center hover-glow animate-scale-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-3xl animate-bounce-gentle">🎯</div>
            <h3 className="text-heading">Budget Overview</h3>
          </div>
          <div className="mb-8">
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={budgetPct >= 100 ? 'stop-red-400' : budgetPct >= 80 ? 'stop-yellow-400' : 'stop-blue-400'} />
                    <stop offset="100%" className={budgetPct >= 100 ? 'stop-red-600' : budgetPct >= 80 ? 'stop-yellow-600' : 'stop-blue-600'} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200/50" />
                <circle
                  cx="60" cy="60" r="54" stroke="url(#progressGradient)" strokeWidth="6" fill="transparent"
                  strokeDasharray={`${(budgetPct / 100) * 339.292} 339.292`}
                  strokeLinecap="round"
                  className="drop-shadow-lg"
                  style={{ 
                    animation: 'drawCircle 2s ease-out forwards',
                    strokeDashoffset: (budgetPct / 100) * 339.292
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="value-large text-4xl animate-counter">{Math.round(budgetPct)}%</div>
                  <div className="text-micro font-medium text-gray-500 uppercase tracking-wide">budget used</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {totalBudget > 0 ? (
              <>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-caption font-medium">💸 Spent</span>
                    <span className="value-currency text-xl text-red-600">{fmtCurrency(totalSpent)}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50/30 to-gray-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-caption font-medium">🎯 Budget</span>
                    <span className="value-currency text-xl text-blue-600">{fmtCurrency(totalBudget)}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50/30 to-gray-50 rounded-2xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-caption font-medium">💰 Remaining</span>
                    <span className={`value-currency text-xl ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtCurrency(totalBudget - totalSpent)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-3">📊</div>
                <p className="text-caption text-gray-500 mb-3">No budgets set yet</p>
                <a
                  href="/budgets"
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Budgets
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="card-glass p-6 text-center hover-lift animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="text-3xl mb-3 animate-float" style={{animationDelay: '0s'}}>💳</div>
            <p className="text-caption font-medium mb-2">Total Balance</p>
            <div className="value-large text-2xl mb-2">
              {accountsLoading ? <LoadingSpinner size="sm" inline /> : (
                <span className="value-positive animate-counter">{fmtCurrency(totalBalance)}</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <p className="text-micro font-medium text-green-600">{accounts.length} accounts</p>
            </div>
          </div>
          <div className="card-glass p-6 text-center hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="text-3xl mb-3 animate-float" style={{animationDelay: '0.5s'}}>📈</div>
            <p className="text-caption font-medium mb-2">Monthly Income</p>
            <div className="value-large text-2xl mb-2">
              {transactionsLoading ? <LoadingSpinner size="sm" inline /> : (
                <span className="text-blue-600 animate-counter">{fmtCurrency(monthlyIncome)}</span>
              )}
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <p className="text-micro font-medium text-blue-600">This month</p>
            </div>
          </div>
        </div>

        {/* Accounts Breakdown */}
        <div className="card-premium p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce-gentle">💳</div>
              <h3 className="text-heading">Account Balances</h3>
            </div>
            <a
              href="/accounts"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
            >
              Manage Accounts
              <ChevronRight size={16} />
            </a>
          </div>
          <AccountsBreakdown accounts={accounts} fmtCurrency={fmtCurrency} />
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <button 
              onClick={() => refetchTransactions()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh data"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleAddExpense}
              className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-red-600" />
              </div>
              <span className="font-medium text-red-700">Add Expense</span>
            </button>
            
            <button 
              onClick={handleAddIncome}
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <span className="font-medium text-green-700">Add Income</span>
            </button>
            
            <button 
              onClick={() => setShowAddAccount(true)}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium text-blue-700">Add Account</span>
            </button>
            
            <a 
              href="/insights" 
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <PieChart className="w-6 h-6 text-orange-600" />
              </div>
              <span className="font-medium text-orange-700">View Insights</span>
            </a>
          </div>
        </div>

        {/* Transaction Filters */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Filter Transactions</h4>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 text-sm"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex gap-2 mb-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: '7 Days' },
              { key: 'month', label: '30 Days' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setQuickFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  quickFilter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="space-y-3">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setQuickFilter('all');
                  setSelectedCategory('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Reset Filters
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>

        {/* Recent Transactions */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <a href="/transactions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All →</a>
          </div>

          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{t.primary_category_icon || (t.direction === 'outflow' ? '💸' : '💰')}</div>
                    <div>
                      <p className="font-medium">{t.merchant || t.description}</p>
                      <p className="text-sm text-gray-500">{fmtDate(t.occurred_at)} • {t.account_name}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${t.direction === 'outflow' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.direction === 'outflow' ? '-' : '+'}{fmtCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500 mb-4">No transactions yet</p>
              <button onClick={handleAddExpense} className="btn-primary">Add Your First Transaction</button>
            </div>
          )}
        </div>

        {/* Category Summary */}
        {budgetData?.categories && budgetData.categories.filter(c => c.category_kind === 'expense' && c.spent > 0).length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-3">
              {budgetData.categories
                .filter(c => c.category_kind === 'expense' && c.spent > 0)
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 3)
                .map(c => (
                  <div key={c.category_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: c.color }}>
                        {c.icon}
                      </div>
                      <span className="font-medium">{c.category_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmtCurrency(c.spent)}</p>
                      <p className="text-xs text-gray-500">of {fmtCurrency(c.budget)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-white/20 px-4 py-3 shadow-2xl shadow-slate-300/20">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <a href="/dashboard" className="nav-item active">
            <div className="text-2xl mb-1">🏠</div>
            <span className="text-xs font-medium">Home</span>
          </a>
          <a href="/transactions" className="nav-item">
            <div className="text-2xl mb-1">💳</div>
            <span className="text-xs font-medium">Transactions</span>
          </a>
          <button 
            onClick={handleAddExpense} 
            className="relative flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl -mt-6 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="text-3xl font-light relative z-10">+</div>
          </button>
          <a href="/insights" className="nav-item">
            <div className="text-2xl mb-1">📊</div>
            <span className="text-xs font-medium">Insights</span>
          </a>
          <a href="/settings" className="nav-item">
            <div className="text-2xl mb-1">⚙️</div>
            <span className="text-xs font-medium">Settings</span>
          </a>
        </div>
      </nav>

      {/* Modals */}
      {currentHousehold && (
        <>
          <AddTransactionModal
            isOpen={showAddTransaction}
            onClose={() => setShowAddTransaction(false)}
            householdId={currentHousehold.id}
            onSuccess={handleTransactionSuccess}
          />
          
          <AddAccountModal
            isOpen={showAddAccount}
            onClose={() => setShowAddAccount(false)}
            householdId={currentHousehold.id}
            onSuccess={handleAccountSuccess}
          />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
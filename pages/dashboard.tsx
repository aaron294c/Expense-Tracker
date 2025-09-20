// pages/dashboard.tsx - Updated with functional buttons and enhanced filtering
import React, { useState, useEffect } from 'react';
import { Screen } from '../components/_layout/Screen';
import { BottomDock } from '../components/navigation/BottomDock';
import { StatGrid } from '../components/layout/StatGrid';
import { StatCard } from '../components/mobile/StatCard';
import { AccordionSection } from '../components/mobile/AccordionSection';
import { MonthPickerPill } from '../components/ui/MonthPickerPill';
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
import Link from 'next/link';

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
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="size-10 rounded-full grid place-items-center bg-emerald-50 text-emerald-600 mb-4">💰</div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Assets</div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{fmtCurrency(totalAssets)}</div>
        </div>
        <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
          <div className="size-10 rounded-full grid place-items-center bg-red-50 text-red-600 mb-4">💳</div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Debt</div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">{fmtCurrency(totalDebt)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6 text-center">
          <div className={`size-12 rounded-full grid place-items-center mx-auto mb-4 ${netWorth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{netWorth >= 0 ? '📈' : '📉'}</div>
          <div className="text-sm font-medium text-gray-600 mb-1">Net Worth</div>
          <div className={`text-3xl font-semibold tabular-nums ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmtCurrency(netWorth)}
          </div>
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
                className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-5 flex items-center justify-between transition-all hover:shadow-xl hover:shadow-gray-900/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-full grid place-items-center bg-gradient-to-br ${gradientColor}`}>
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {account.type === 'current' ? 'Checking' : account.type}
                    </p>
                  </div>
                </div>
                <div className="text-xl font-semibold tabular-nums text-right">
                  <span className={
                    isCredit ? 'text-red-600' : balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }>
                    {isCredit && displayBalance > 0 ? '-' : ''}{fmtCurrency(displayBalance)}
                  </span>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center p-8 rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-lg text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center p-12 rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg">
          <div className="text-8xl mb-6">🏠</div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">No Household Found</h2>
          <p className="text-lg text-gray-600 mb-8">You need to join a household to get started.</p>
          <a href="/setup" className="py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium transition-colors">Setup Household</a>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Screen>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-base text-gray-600 mt-1">Your financial overview</p>
          </div>
          <Link href="/settings" className="p-3 hover:bg-gray-100/80 rounded-full transition-all">
            <Settings className="w-6 h-6 text-gray-600" />
          </Link>
        </div>


        {/* KPI Overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
            <div className="size-12 rounded-full grid place-items-center bg-blue-50 text-blue-600 mb-4">💎</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Total Balance</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">
              {accountsLoading ? "..." : fmtCurrency(totalBalance)}
            </div>
            <div className="text-sm text-gray-500 mt-1">{accounts.length} accounts</div>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
            <div className="size-12 rounded-full grid place-items-center bg-green-50 text-green-600 mb-4">
              <TrendingUp size={24} />
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">Monthly Income</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">
              {transactionsLoading ? "..." : fmtCurrency(monthlyIncome)}
            </div>
            <div className="text-sm text-gray-500 mt-1">{monthDisplay}</div>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
            <div className="size-12 rounded-full grid place-items-center bg-purple-50 text-purple-600 mb-4">🎯</div>
            <div className="text-sm font-medium text-gray-600 mb-1">Budget Used</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">{Math.round(budgetPct)}%</div>
            <div className="text-sm text-gray-500 mt-1">
              {totalBudget > 0 ? `${fmtCurrency(totalBudget - totalSpent)} remaining` : 'No budget set'}
            </div>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
            <div className="size-12 rounded-full grid place-items-center bg-red-50 text-red-600 mb-4">
              <TrendingDown size={24} />
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">This Month</div>
            <div className="text-2xl font-semibold tabular-nums text-gray-900">
              {transactionsLoading ? "..." : fmtCurrency(totalSpent)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Spending</div>
          </div>
        </div>

        {/* Month Navigation */}
        <MonthPickerPill
          label={monthDisplay}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
        />

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={handleAddExpense}
              className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6 text-left active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-gray-900/10"
            >
              <div className="size-12 rounded-full bg-blue-500 grid place-items-center mb-4">
                <Plus size={20} className="text-white" />
              </div>
              <div className="text-base font-medium text-gray-900">Add Transaction</div>
              <div className="text-sm text-gray-500 mt-1">Record expense</div>
            </button>

            <button
              onClick={() => setShowAddAccount(true)}
              className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6 text-left active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-gray-900/10"
            >
              <div className="size-12 rounded-full bg-green-500 grid place-items-center mb-4">
                <Building2 size={20} className="text-white" />
              </div>
              <div className="text-base font-medium text-gray-900">Add Account</div>
              <div className="text-sm text-gray-500 mt-1">Link bank account</div>
            </button>

            <button
              onClick={() => window.location.href = '/budgets'}
              className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6 text-left active:scale-[0.98] transition-all hover:shadow-xl hover:shadow-gray-900/10"
            >
              <div className="size-12 rounded-full bg-purple-500 grid place-items-center mb-4">
                <PieChart size={20} className="text-white" />
              </div>
              <div className="text-base font-medium text-gray-900">Set Budget</div>
              <div className="text-sm text-gray-500 mt-1">Manage spending</div>
            </button>
          </div>
        </div>

        {/* Accounts */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Account Balances</h2>
            <a href="/accounts" className="text-base text-blue-600 font-medium hover:text-blue-700 transition-colors">
              Manage Accounts →
            </a>
          </div>
          <AccountsBreakdown accounts={accounts.slice(0, 3)} fmtCurrency={fmtCurrency} />
          {accounts.length > 3 && (
            <div className="mt-6 text-center">
              <a href="/accounts" className="text-base text-blue-600 font-medium hover:text-blue-700 transition-colors">
                View all {accounts.length} accounts →
              </a>
            </div>
          )}
        </div>



        {/* Recent Transactions */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              <a href="/transactions" className="text-base text-blue-600 font-medium hover:text-blue-700 transition-colors">
                View All →
              </a>
            </div>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-24" />
                      </div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-1">
                {filteredTransactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-4 px-4 hover:bg-gray-50/80 rounded-xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-gray-100 grid place-items-center text-lg">
                        {t.primary_category_icon || (t.direction === 'outflow' ? '💸' : '💰')}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{t.merchant || t.description}</h3>
                        <p className="text-sm text-gray-500">{fmtDate(t.occurred_at)} • {t.account_name}</p>
                      </div>
                    </div>
                    <div className="text-xl font-semibold tabular-nums text-right">
                      <span className={t.direction === 'outflow' ? 'text-red-600' : 'text-green-600'}>
                        {t.direction === 'outflow' ? '-' : '+'}{fmtCurrency(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg text-gray-500 mb-6">No transactions yet</p>
                <button onClick={handleAddExpense} className="py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium transition-colors">
                  Add Your First Transaction
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Summary */}
        {budgetData?.categories && budgetData.categories.filter(c => c.category_kind === 'expense' && c.spent > 0).length > 0 && (
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-100/50 shadow-lg shadow-gray-900/5 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Categories</h3>
            <div className="space-y-4">
              {budgetData.categories
                .filter(c => c.category_kind === 'expense' && c.spent > 0)
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 3)
                .map(c => (
                  <div key={c.category_id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: c.color }}>
                        {c.icon}
                      </div>
                      <span className="text-lg font-medium text-gray-900">{c.category_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{fmtCurrency(c.spent)}</p>
                      <p className="text-sm text-gray-500">of {fmtCurrency(c.budget)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

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
      </Screen>

      <BottomDock onAdd={handleAddExpense} />
    </div>
  );
}

export default DashboardPage;
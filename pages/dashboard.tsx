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
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">💰</div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Total Assets</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-emerald-600">{fmtCurrency(totalAssets)}</div>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">💳</div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Total Debt</div>
          <div className="mt-1 text-[18px] font-semibold tabular-nums text-rose-600">{fmtCurrency(totalDebt)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 mt-3">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 text-center">
          <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600 mx-auto">{netWorth >= 0 ? '📈' : '📉'}</div>
          <div className="mt-2 text-[12.5px] text-gray-500 truncate">Net Worth</div>
          <div className={`mt-1 text-[18px] font-semibold tabular-nums ${netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                className="rounded-2xl bg-white border border-gray-100 shadow p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-gray-50 grid place-items-center">
                    <IconComponent size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold truncate text-gray-900">{account.name}</h3>
                    <p className="text-[12px] text-gray-500 truncate capitalize">
                      {account.type === 'current' ? 'Checking' : account.type}
                    </p>
                  </div>
                </div>
                <div className="text-[18px] font-semibold tabular-nums text-right min-w-[96px]">
                  <span className={
                    isCredit ? 'text-rose-600' : balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
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
    <>
      <Screen>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px]/[1.2] font-semibold tracking-[-0.02em] text-gray-900">Dashboard</h1>
            <p className="text-[13px] text-gray-500">Your financial overview</p>
          </div>
          <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>
        </div>


        {/* KPI Overview */}
        <StatGrid>
          <StatCard
            icon={<span className="text-xl">💎</span>}
            label="Total Balance"
            value={accountsLoading ? "..." : `$${totalBalance.toFixed(2)}`}
            sub={`${accounts.length} accounts`}
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Monthly Income"
            value={transactionsLoading ? "..." : `$${monthlyIncome.toFixed(2)}`}
            sub={monthDisplay}
          />
          <StatCard
            icon={<span className="text-xl">🎯</span>}
            label="Budget Used"
            value={`${Math.round(budgetPct)}%`}
            sub={totalBudget > 0 ? `$${(totalBudget - totalSpent).toFixed(2)} remaining` : 'No budget set'}
          />
          <StatCard
            icon={<TrendingDown size={20} />}
            label="This Month"
            value={transactionsLoading ? "..." : `$${totalSpent.toFixed(2)}`}
            sub="Spending"
          />
        </StatGrid>

        {/* Month Navigation */}
        <MonthPickerPill
          label={monthDisplay}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
        />

        {/* Quick Actions */}
        <div className="mt-4">
          <h2 className="text-[18px] font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleAddExpense}
              className="rounded-2xl bg-white border border-gray-100 shadow p-3 text-left active:scale-95 transition"
            >
              <div className="size-8 rounded-lg bg-gray-50 grid place-items-center">
                <Plus size={16} />
              </div>
              <div className="mt-2 text-[14px] font-medium truncate">Add Transaction</div>
              <div className="text-[12px] text-gray-500 truncate">Record expense</div>
            </button>

            <button
              onClick={() => setShowAddAccount(true)}
              className="rounded-2xl bg-white border border-gray-100 shadow p-3 text-left active:scale-95 transition"
            >
              <div className="size-8 rounded-lg bg-gray-50 grid place-items-center">
                <Building2 size={16} />
              </div>
              <div className="mt-2 text-[14px] font-medium truncate">Add Account</div>
              <div className="text-[12px] text-gray-500 truncate">Link bank account</div>
            </button>

            <button
              onClick={() => window.location.href = '/budgets'}
              className="rounded-2xl bg-white border border-gray-100 shadow p-3 text-left active:scale-95 transition"
            >
              <div className="size-8 rounded-lg bg-gray-50 grid place-items-center">
                <PieChart size={16} />
              </div>
              <div className="mt-2 text-[14px] font-medium truncate">Set Budget</div>
              <div className="text-[12px] text-gray-500 truncate">Manage spending</div>
            </button>
          </div>
        </div>

        {/* Accounts */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold text-gray-900">Account Balances</h2>
            <a href="/accounts" className="text-[13px] text-blue-600 font-medium">
              Manage Accounts →
            </a>
          </div>
          <AccountsBreakdown accounts={accounts.slice(0, 3)} fmtCurrency={fmtCurrency} />
          {accounts.length > 3 && (
            <div className="mt-3 text-center">
              <a href="/accounts" className="text-[13px] text-blue-600 font-medium">
                View all {accounts.length} accounts →
              </a>
            </div>
          )}
        </div>



        {/* Recent Transactions */}
        <div className="mt-4">
          <AccordionSection title="Recent Transactions">
            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-3.5 px-3 bg-gray-50 rounded-lg animate-pulse">
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
              <>
                <div className="space-y-2">
                  {filteredTransactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-start justify-between py-3.5 px-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gray-50 grid place-items-center">
                          {t.primary_category_icon || (t.direction === 'outflow' ? '💸' : '💰')}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-semibold text-gray-900 truncate">{t.merchant || t.description}</h3>
                          <p className="text-[12px] text-gray-500 truncate">{fmtDate(t.occurred_at)} • {t.account_name}</p>
                        </div>
                      </div>
                      <div className="min-w-[96px] text-right text-[22px] font-semibold tabular-nums">
                        <span className="text-[14px] text-gray-500 align-top mr-0.5">$</span>
                        <span className={t.direction === 'outflow' ? 'text-red-600' : 'text-green-600'}>
                          {t.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <a href="/transactions" className="text-[15px] text-blue-600 font-medium">
                    View all transactions →
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-[13px] text-gray-500 mb-4">No transactions yet</p>
                <button onClick={handleAddExpense} className="py-3.5 px-3 bg-blue-600 text-white rounded-2xl text-[15px] font-medium">
                  Add Your First Transaction
                </button>
              </div>
            )}
          </AccordionSection>
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
    </>
  );
}

export default DashboardPage;
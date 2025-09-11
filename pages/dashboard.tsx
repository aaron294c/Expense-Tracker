// pages/dashboard.tsx - Updated with functional buttons
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../hooks/useHousehold';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategorySummary } from '../hooks/useCategorySummary';
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
  ChevronRight 
} from 'lucide-react';

function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } =
    useTransactions(currentHousehold?.id || null, { limit: 5 });
  const { accounts, isLoading: accountsLoading, refetch: refetchAccounts } = 
    useAccounts(currentHousehold?.id || null);
  const { summaries, getTotalSpent, getTotalBudget } =
    useCategorySummary(currentHousehold?.id || null, currentMonth);

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

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
  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
            <p className="text-sm text-blue-600">{currentHousehold.name}</p>
          </div>
          <button onClick={() => signOut()} className="btn-secondary">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
          <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-medium text-gray-900">{monthDisplay}</h2>
          <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Budget Overview */}
        <div className="card p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
          <div className="mb-4">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                <circle
                  cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={`${(budgetPct / 100) * 339.292} 339.292`}
                  strokeLinecap="round"
                  className={budgetPct >= 100 ? 'text-red-500' : budgetPct >= 80 ? 'text-yellow-500' : 'text-blue-500'}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(budgetPct)}%</div>
                  <div className="text-xs text-gray-500">used</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Spent</span>
              <span className="font-semibold">{fmtCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Budget</span>
              <span className="font-semibold">{fmtCurrency(totalBudget)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <p className="text-sm text-gray-600">Total Balance</p>
            <p className="text-xl font-bold text-green-600">
              {accountsLoading ? <LoadingSpinner size="sm" inline /> : fmtCurrency(totalBalance)}
            </p>
            <p className="text-xs text-gray-500">{accounts.length} accounts</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-sm text-gray-600">Monthly Income</p>
            <p className="text-xl font-bold text-blue-600">
              {transactionsLoading ? <LoadingSpinner size="sm" inline /> : fmtCurrency(monthlyIncome)}
            </p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
        </div>

        {/* Quick Actions - FUNCTIONAL */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
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
          
          {/* Secondary Actions */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button 
              className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Scan Receipt (Coming Soon)"
            >
              <Camera className="w-5 h-5 mr-2" />
              <span className="text-sm">Scan Receipt</span>
            </button>
            
            <button 
              className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Import Data (Coming Soon)"
            >
              <Upload className="w-5 h-5 mr-2" />
              <span className="text-sm">Import</span>
            </button>
          </div>
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
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map(t => (
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
        {summaries.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
            <div className="space-y-3">
              {summaries
                .filter(s => s.category_kind === 'expense' && s.spent > 0)
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-md mx-auto flex justify-around">
          <a href="/dashboard" className="nav-item active">
            <div className="text-2xl">🏠</div>
            <span className="text-xs">Home</span>
          </a>
          <a href="/insights" className="nav-item">
            <div className="text-2xl">📊</div>
            <span className="text-xs">Insights</span>
          </a>
          <button onClick={handleAddExpense} className="flex flex-col items-center p-2 bg-blue-600 text-white rounded-full -mt-4 shadow-lg">
            <div className="text-2xl">+</div>
          </button>
          <a href="/accounts" className="nav-item">
            <div className="text-2xl">💳</div>
            <span className="text-xs">Accounts</span>
          </a>
          <a href="/settings" className="nav-item">
            <div className="text-2xl">⚙️</div>
            <span className="text-xs">Settings</span>
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
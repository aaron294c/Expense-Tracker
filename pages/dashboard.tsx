import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../hooks/useHousehold';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';

function DashboardPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions(
    currentHousehold?.id || null
  );
  const { accounts, isLoading: accountsLoading } = useAccounts(currentHousehold?.id || null);
  
  const [showAddTransaction, setShowAddTransaction] = useState(false);

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

  // Calculate totals from real data
  const totalBalance = accounts.reduce((sum, account) => sum + (account.current_balance || 0), 0);
  const monthlySpending = transactions
    .filter(t => t.direction === 'outflow' && new Date(t.occurred_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncome = transactions
    .filter(t => t.direction === 'inflow' && new Date(t.occurred_at).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
            {currentHousehold && (
              <p className="text-sm text-blue-600">{currentHousehold.name}</p>
            )}
          </div>
          <button onClick={() => signOut()} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!currentHousehold ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Household Found</h2>
            <p className="text-gray-600 mb-4">You need to join a household to get started.</p>
            <button className="btn-primary">Join Demo Household</button>
          </div>
        ) : (
          <>
            {/* Stats Cards - Now with REAL data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {accountsLoading ? <LoadingSpinner size="sm" /> : formatCurrency(totalBalance)}
                    </p>
                  </div>
                  <div className="text-3xl">💰</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Across {accounts.length} accounts</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Spending</p>
                    <p className="text-2xl font-bold text-red-600">
                      {transactionsLoading ? <LoadingSpinner size="sm" /> : formatCurrency(monthlySpending)}
                    </p>
                  </div>
                  <div className="text-3xl">💸</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Income</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {transactionsLoading ? <LoadingSpinner size="sm" /> : formatCurrency(monthlyIncome)}
                    </p>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>
            </div>

            {/* Quick Actions - Now FUNCTIONAL */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setShowAddTransaction(true)}
                  className="card p-6 text-center hover:shadow-md transition-all hover:scale-105"
                >
                  <div className="text-4xl mb-2">💰</div>
                  <p className="font-medium text-gray-900">Add Income</p>
                  <p className="text-sm text-gray-500">Record earnings</p>
                </button>
                <button 
                  onClick={() => setShowAddTransaction(true)}
                  className="card p-6 text-center hover:shadow-md transition-all hover:scale-105"
                >
                  <div className="text-4xl mb-2">💸</div>
                  <p className="font-medium text-gray-900">Add Expense</p>
                  <p className="text-sm text-gray-500">Track spending</p>
                </button>
                <button className="card p-6 text-center hover:shadow-md transition-all hover:scale-105">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="font-medium text-gray-900">View Budget</p>
                  <p className="text-sm text-gray-500">Manage limits</p>
                </button>
                <button className="card p-6 text-center hover:shadow-md transition-all hover:scale-105">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="font-medium text-gray-900">Insights</p>
                  <p className="text-sm text-gray-500">View reports</p>
                </button>
              </div>
            </div>

            {/* Recent Transactions - Now with REAL data */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <button 
                  onClick={() => refetchTransactions()}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>
              
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(transaction => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {transaction.primary_category_icon || (transaction.direction === 'outflow' ? '💸' : '💰')}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.merchant || transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.occurred_at)} • {transaction.account_name}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.direction === 'outflow' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-500 mb-4">No transactions yet</p>
                  <button 
                    onClick={() => setShowAddTransaction(true)}
                    className="btn-primary"
                  >
                    Add Your First Transaction
                  </button>
                </div>
              )}
              
              {transactions.length > 0 && (
                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium">
                  View All Transactions →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {currentHousehold && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          householdId={currentHousehold.id}
          onSuccess={() => {
            refetchTransactions();
            setShowAddTransaction(false);
          }}
        />
      )}
    </div>
  );
}

export default DashboardPage;

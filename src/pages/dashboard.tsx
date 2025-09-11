import React from 'react';
import Layout from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useHousehold } from '../hooks/useHousehold';
import { useTransactions } from '../hooks/useTransactions';
import { PlusIcon, CreditCardIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const router = useRouter();
  const { currentHousehold, isLoading: householdLoading } = useHousehold();
  const { transactions, isLoading: transactionsLoading } = useTransactions(
    currentHousehold?.id || null, 
    { limit: 5 }
  );

  if (householdLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!currentHousehold) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Expense Tracker</h2>
            <p className="text-gray-600 mb-4">Get started by setting up your household and accounts.</p>
            <Button onClick={() => router.push('/setup')}>
              Get Started
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate simple metrics
  const recentTransactions = transactions.slice(0, 5);
  const totalExpenses = transactions
    .filter(t => t.direction === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter(t => t.direction === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">{currentHousehold.name}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            onClick={() => router.push('/transactions/add')}
            className="h-16 flex flex-col items-center justify-center gap-2"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="text-sm">Add Transaction</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => router.push('/accounts')}
            className="h-16 flex flex-col items-center justify-center gap-2"
          >
            <CreditCardIcon className="h-6 w-6" />
            <span className="text-sm">Accounts</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => router.push('/budgets')}
            className="h-16 flex flex-col items-center justify-center gap-2"
          >
            <ChartBarIcon className="h-6 w-6" />
            <span className="text-sm">Budgets</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Income</span>
                <span className="font-semibold text-green-600">
                  +£{totalIncome.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-semibold text-red-600">
                  -£{totalExpenses.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-gray-900">Net</span>
                <span className={`font-semibold ${
                  totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalIncome - totalExpenses >= 0 ? '+' : ''}£{(totalIncome - totalExpenses).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-semibold text-gray-900">
                  {transactions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg per Transaction</span>
                <span className="font-semibold text-gray-900">
                  £{transactions.length > 0 ? (totalExpenses / transactions.filter(t => t.direction === 'outflow').length || 0).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/transactions')}
            >
              View All
            </Button>
          </div>
          
          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.direction === 'outflow' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <span className="text-lg">
                      {transaction.primary_category_icon || (transaction.direction === 'outflow' ? '💳' : '💰')}
                    </span>
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
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <ChartBarIcon className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">No transactions yet</p>
              <Button onClick={() => router.push('/transactions/add')}>
                Add Your First Transaction
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
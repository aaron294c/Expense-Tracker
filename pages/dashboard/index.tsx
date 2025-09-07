// /pages/dashboard/index.tsx
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useHousehold } from '@/hooks/useHousehold'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategorySummary } from '@/hooks/useCategorySummary'
import { useMonth } from '@/hooks/useMonth'

interface DashboardProps {
  householdId: string
  burnRate: any
}

export default function DashboardPage({ householdId, burnRate: initialBurnRate }: DashboardProps) {
  const { currentHousehold } = useHousehold()
  const { accounts, getTotalBalance } = useAccounts(householdId)
  const { currentMonth } = useMonth()
  const { getTotalSpent, getBudgetUtilization } = useCategorySummary(householdId, currentMonth)
  const { transactions } = useTransactions(householdId, { limit: 5 })

  const totalBalance = getTotalBalance()
  const totalSpent = getTotalSpent()
  const budgetUtilization = getBudgetUtilization()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Layout title="Dashboard - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back!
            </h1>
            <p className="text-gray-600">
              {currentHousehold?.name || 'Your Dashboard'}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {currentHousehold?.name?.charAt(0) || 'U'}
            </span>
          </div>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-500 text-xl">
                account_balance
              </span>
              <h3 className="text-sm font-semibold text-gray-600">
                Total Balance
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Across {accounts.length} accounts
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">
                trending_up
              </span>
              <h3 className="text-sm font-semibold text-gray-600">
                This Month
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {budgetUtilization.toFixed(1)}% of budget
            </p>
          </div>
        </div>

        {/* Burn Rate Card */}
        {initialBurnRate && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Budget Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Daily Average</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(initialBurnRate.daily_average)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining Budget</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(initialBurnRate.remaining)}
                </p>
              </div>
            </div>

            {initialBurnRate.remaining < 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">
                  You're over budget by {formatCurrency(Math.abs(initialBurnRate.remaining))}
                </p>
              </div>
            )}

            {initialBurnRate.suggested_daily_spend > 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Suggested daily spend:</span> {formatCurrency(initialBurnRate.suggested_daily_spend)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/transactions/new"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="material-symbols-outlined text-blue-600">add</span>
              <span className="font-medium text-blue-800">Add Expense</span>
            </Link>
            
            <Link
              href="/budgets"
              className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="material-symbols-outlined text-green-600">pie_chart</span>
              <span className="font-medium text-green-800">View Budget</span>
            </Link>

            <Link
              href="/accounts"
              className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="material-symbols-outlined text-purple-600">account_balance_wallet</span>
              <span className="font-medium text-purple-800">Accounts</span>
            </Link>

            <Link
              href="/insights"
              className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="material-symbols-outlined text-orange-600">bar_chart</span>
              <span className="font-medium text-orange-800">Insights</span>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <Link 
              href="/transactions" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="material-symbols-outlined text-gray-600">
                      {transaction.primary_category_icon || 'receipt'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.primary_category_name} • {formatDate(transaction.occurred_at)}
                    </p>
                  </div>
                  
                  <p className={`font-bold ${
                    transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.direction === 'outflow' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">
                  receipt_long
                </span>
                <p className="text-gray-500">No transactions yet</p>
                <Link
                  href="/transactions/new"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Add your first transaction
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = requireHousehold(
  async (context, { household, supabase }) => {
    // Get burn rate data
    const { data: burnRate } = await supabase
      .from('v_simple_burn_rate')
      .select('*')
      .eq('household_id', household.id)
      .single()

    return {
      props: {
        householdId: household.id,
        burnRate: burnRate || null,
      },
    }
  }
)
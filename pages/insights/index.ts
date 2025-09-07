// /pages/insights/index.tsx
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useCategorySummary } from '@/hooks/useCategorySummary'
import { useMonth } from '@/hooks/useMonth'

interface InsightsPageProps {
  householdId: string
}

export default function InsightsPage({ householdId }: InsightsPageProps) {
  const { 
    currentMonth, 
    monthDisplay, 
    goToPreviousMonth, 
    goToNextMonth 
  } = useMonth()
  
  const { 
    summaries, 
    isLoading, 
    error,
    getTopCategories,
    getTotalSpent,
    getTotalBudget,
    getBudgetUtilization
  } = useCategorySummary(householdId, currentMonth)

  const [viewType, setViewType] = useState<'expense' | 'income'>('expense')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getColorForCategory = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-orange-500'
    ]
    return colors[index % colors.length]
  }

  const topCategories = getTopCategories(viewType, 8)
  const totalSpent = getTotalSpent()
  const totalBudget = getTotalBudget()
  const budgetUtilization = getBudgetUtilization()

  // Calculate spending trends (mock data for now)
  const spendingTrend = totalSpent > 0 ? Math.random() > 0.5 ? 'up' : 'down' : 'flat'
  const trendPercentage = Math.floor(Math.random() * 20) + 1

  if (error) {
    return (
      <Layout title="Insights - Expense Tracker">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Insights - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header with month navigation */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <h2 className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
              {monthDisplay}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </header>

        {/* View type toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('expense')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewType === 'expense'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setViewType('income')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              viewType === 'income'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Income
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">
                {viewType === 'expense' ? 'trending_down' : 'trending_up'}
              </span>
              <h3 className="text-sm font-semibold text-gray-600">
                Total {viewType === 'expense' ? 'Spent' : 'Earned'}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {viewType === 'expense' ? formatCurrency(totalSpent) : formatCurrency(0)}
            </p>
            {viewType === 'expense' && totalBudget > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {budgetUtilization.toFixed(1)}% of budget
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-xl ${
                spendingTrend === 'up' ? 'text-red-500' : 
                spendingTrend === 'down' ? 'text-green-500' : 'text-gray-500'
              }`}>
                {spendingTrend === 'up' ? 'trending_up' : 
                 spendingTrend === 'down' ? 'trending_down' : 'trending_flat'}
              </span>
              <h3 className="text-sm font-semibold text-gray-600">
                vs Last Month
              </h3>
            </div>
            <p className={`text-2xl font-bold ${
              spendingTrend === 'up' ? 'text-red-600' : 
              spendingTrend === 'down' ? 'text-green-600' : 'text-gray-900'
            }`}>
              {spendingTrend === 'flat' ? '0%' : `${spendingTrend === 'up' ? '+' : '-'}${trendPercentage}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {spendingTrend === 'up' ? 'Higher than' : 
               spendingTrend === 'down' ? 'Lower than' : 'Same as'} last month
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top {viewType === 'expense' ? 'Expense' : 'Income'} Categories
          </h3>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading insights...</p>
            </div>
          ) : topCategories.length > 0 ? (
            <div className="space-y-4">
              {topCategories.map((category, index) => {
                const amount = viewType === 'expense' ? category.spent : category.earned
                const maxAmount = Math.max(...topCategories.map(c => 
                  viewType === 'expense' ? c.spent : c.earned
                ))
                const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                
                return (
                  <div key={category.category_id} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <span className="material-symbols-outlined text-gray-600">
                        {category.icon || 'category'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-gray-900">
                          {category.category_name}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getColorForCategory(index)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{category.transaction_count} transactions</span>
                        {viewType === 'expense' && category.budget > 0 && (
                          <span className={
                            category.budget_percentage > 100 ? 'text-red-600' :
                            category.budget_percentage > 75 ? 'text-yellow-600' : 'text-green-600'
                          }>
                            {category.budget_percentage.toFixed(1)}% of budget
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
                bar_chart
              </span>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No {viewType} data
              </h4>
              <p className="text-gray-500">
                Start tracking your {viewType}s to see insights here
              </p>
            </div>
          )}
        </div>

        {/* Quick Insights */}
        {viewType === 'expense' && topCategories.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Insights
            </h3>
            
            <div className="space-y-4">
              {/* Top spending category */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                  <span className="material-symbols-outlined text-xl">star</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Top Spending Category</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{topCategories[0]?.category_name}</span> accounts for{' '}
                    {totalSpent > 0 ? ((topCategories[0]?.spent / totalSpent) * 100).toFixed(1) : 0}% 
                    of your total spending this month.
                  </p>
                </div>
              </div>

              {/* Budget performance */}
              {totalBudget > 0 && (
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    budgetUtilization <= 75 ? 'bg-green-100 text-green-500' :
                    budgetUtilization <= 100 ? 'bg-yellow-100 text-yellow-500' :
                    'bg-red-100 text-red-500'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {budgetUtilization <= 75 ? 'check_circle' :
                       budgetUtilization <= 100 ? 'warning' : 'error'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Budget Status</p>
                    <p className="text-sm text-gray-500">
                      You've used {budgetUtilization.toFixed(1)}% of your budget.{' '}
                      {budgetUtilization <= 75 ? 'Great job staying on track!' :
                       budgetUtilization <= 100 ? 'You\'re approaching your budget limit.' :
                       'You\'re over budget this month.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction frequency */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-500">
                  <span className="material-symbols-outlined text-xl">receipt</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Transaction Activity</p>
                  <p className="text-sm text-gray-500">
                    You've made {summaries.reduce((sum, cat) => sum + cat.transaction_count, 0)} transactions 
                    this month across {summaries.filter(cat => cat.transaction_count > 0).length} categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = requireHousehold(
  async (context, { household }) => {
    return {
      props: {
        householdId: household.id,
      },
    }
  }
)
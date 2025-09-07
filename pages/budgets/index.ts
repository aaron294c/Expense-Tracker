// /pages/budgets/index.tsx
import { GetServerSideProps } from 'next'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useBudgets } from '@/hooks/useBudgets'
import { useMonth } from '@/hooks/useMonth'

interface BudgetsPageProps {
  householdId: string
}

export default function BudgetsPage({ householdId }: BudgetsPageProps) {
  const { 
    currentMonth, 
    monthDisplay, 
    goToPreviousMonth, 
    goToNextMonth,
    isCurrentCalendarMonth 
  } = useMonth()
  
  const { 
    data: budgetData, 
    isLoading, 
    error, 
    updateBudgets,
    applyRollover 
  } = useBudgets(householdId, currentMonth)

  const [editingBudgets, setEditingBudgets] = useState<{ [categoryId: string]: number }>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage <= 75) return 'bg-green-500'
    if (percentage <= 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleEditBudget = (categoryId: string, amount: number) => {
    setEditingBudgets(prev => ({
      ...prev,
      [categoryId]: amount
    }))
  }

  const handleSaveBudgets = async () => {
    if (!budgetData) return
    
    setIsSaving(true)
    try {
      const budgetUpdates = Object.entries(editingBudgets).map(([categoryId, amount]) => ({
        category_id: categoryId,
        amount,
        rollover_enabled: true
      }))

      const success = await updateBudgets(budgetUpdates)
      if (success) {
        setIsEditing(false)
        setEditingBudgets({})
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingBudgets({})
  }

  const handleRollover = async () => {
    const previousMonth = new Date(currentMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    const fromMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}-01`
    
    const success = await applyRollover(fromMonth, currentMonth)
    if (success) {
      // Budgets will be refreshed automatically
    }
  }

  // Initialize editing budgets when budget data loads
  useEffect(() => {
    if (budgetData?.categories && !isEditing) {
      const initialBudgets: { [categoryId: string]: number } = {}
      budgetData.categories.forEach(category => {
        initialBudgets[category.category_id] = category.budget
      })
      setEditingBudgets(initialBudgets)
    }
  }, [budgetData, isEditing])

  if (error) {
    return (
      <Layout title="Budgets - Expense Tracker">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Budgets - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header with month navigation */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          
          <div className="flex items-center gap-4">
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

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBudgets}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Burn rate overview */}
        {budgetData?.burn_rate && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Spent This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(budgetData.burn_rate.spent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget Remaining</p>
                <p className={`text-2xl font-bold ${
                  budgetData.burn_rate.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(budgetData.burn_rate.remaining)}
                </p>
              </div>
            </div>

            {/* Daily spending info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Daily Average</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(budgetData.burn_rate.daily_average)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Suggested Daily Spend</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(budgetData.burn_rate.suggested_daily_spend)}
                </p>
              </div>
            </div>

            {/* Rollover option */}
            {!isCurrentCalendarMonth && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRollover}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Apply rollover from previous month
                </button>
              </div>
            )}
          </div>
        )}

        {/* Category budgets */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading budgets...</p>
            </div>
          ) : budgetData?.categories && budgetData.categories.length > 0 ? (
            budgetData.categories
              .filter(category => category.category_kind === 'expense')
              .map((category) => {
                const percentage = category.budget > 0 
                  ? Math.min((category.spent / category.budget) * 100, 100)
                  : 0
                
                return (
                  <div key={category.category_id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-600">
                          {category.icon || 'category'}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {category.category_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(category.spent)} spent
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingBudgets[category.category_id] || 0}
                            onChange={(e) => handleEditBudget(
                              category.category_id, 
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-24 px-3 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <>
                            <p className="font-bold text-gray-900">
                              {formatCurrency(category.budget)}
                            </p>
                            <p className={`text-sm ${
                              category.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(category.remaining)} remaining
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{percentage.toFixed(1)}% used</span>
                      {percentage > 100 && (
                        <span className="text-red-600 font-medium">
                          Over budget by {formatCurrency(category.spent - category.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
                pie_chart
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No budgets set
              </h3>
              <p className="text-gray-500 mb-4">
                Start by setting budgets for your expense categories
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Up Budgets
              </button>
            </div>
          )}
        </div>
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
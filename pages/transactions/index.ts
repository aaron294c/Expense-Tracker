// /pages/transactions/index.tsx
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'

interface TransactionsPageProps {
  householdId: string
  accounts: any[]
  categories: any[]
}

export default function TransactionsPage({ 
  householdId, 
  accounts: initialAccounts,
  categories 
}: TransactionsPageProps) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const { 
    transactions, 
    isLoading, 
    error, 
    hasMore, 
    loadMore,
    setFilters 
  } = useTransactions(householdId, {
    account_id: selectedAccount || undefined,
    category_id: selectedCategory || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    search: search || undefined,
    limit: 20
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleFilterChange = () => {
    setFilters({
      account_id: selectedAccount || undefined,
      category_id: selectedCategory || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
    })
  }

  const clearFilters = () => {
    setSelectedAccount('')
    setSelectedCategory('')
    setDateFrom('')
    setDateTo('')
    setSearch('')
    setFilters({})
  }

  return (
    <Layout title="Transactions - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <Link
            href="/transactions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add
          </Link>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Filters
          </h3>
          
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter selects */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Accounts</option>
                {initialAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(selectedAccount || selectedCategory || dateFrom || dateTo || search) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Transactions list */}
        <div className="space-y-3">
          {transactions.length > 0 ? (
            <>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <span className="material-symbols-outlined text-gray-600">
                        {transaction.primary_category_icon || 'receipt'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {transaction.description}
                        </p>
                        <p className={`font-bold ${
                          transaction.direction === 'outflow' 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {transaction.direction === 'outflow' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span>{transaction.primary_category_name}</span>
                          {transaction.account_name && (
                            <>
                              <span>•</span>
                              <span>{transaction.account_name}</span>
                            </>
                          )}
                        </div>
                        <span>{formatDate(transaction.occurred_at)}</span>
                      </div>

                      {transaction.merchant && (
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.merchant}
                        </p>
                      )}

                      {/* Multiple categories */}
                      {transaction.categories && transaction.categories.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {transaction.categories.map((cat: any, index: number) => (
                            <span
                              key={cat.category_id}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {cat.category_name} ({Math.round(cat.weight * 100)}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
                receipt_long
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedAccount || selectedCategory || dateFrom || dateTo || search
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first transaction'
                }
              </p>
              <Link
                href="/transactions/new"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add Transaction
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = requireHousehold(
  async (context, { household, supabase }) => {
    // Get accounts for filter dropdown
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('household_id', household.id)
      .eq('is_archived', false)
      .order('name')

    // Get categories for filter dropdown
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', household.id)
      .order('name')

    return {
      props: {
        householdId: household.id,
        accounts: accounts || [],
        categories: categories || [],
      },
    }
  }
)
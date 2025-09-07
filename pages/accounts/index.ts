// /pages/accounts/index.tsx
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { requireHousehold } from '@/lib/auth'
import { useAccounts } from '@/hooks/useAccounts'

interface AccountsPageProps {
  householdId: string
}

export default function AccountsPage({ householdId }: AccountsPageProps) {
  const { 
    accounts, 
    isLoading, 
    error, 
    createAccount, 
    updateAccount,
    deleteAccount,
    getTotalBalance,
    getAccountsByType 
  } = useAccounts(householdId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'current' as const,
    initial_balance: 0,
    currency: 'USD'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return 'payments'
      case 'current': return 'account_balance'
      case 'savings': return 'savings'
      case 'credit': return 'credit_card'
      default: return 'account_balance_wallet'
    }
  }

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'cash': return 'Cash'
      case 'current': return 'Checking'
      case 'savings': return 'Savings'
      case 'credit': return 'Credit Card'
      default: return type
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const account = await createAccount({
      household_id: householdId,
      ...newAccount
    })

    if (account) {
      setShowAddForm(false)
      setNewAccount({
        name: '',
        type: 'current',
        initial_balance: 0,
        currency: 'USD'
      })
    }
  }

  const handleUpdateBalance = async (accountId: string, newBalance: number) => {
    await updateAccount(accountId, {
      initial_balance: newBalance
    })
    setEditingAccount(null)
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      await deleteAccount(accountId)
    }
  }

  const totalBalance = getTotalBalance()
  const accountsByType = {
    cash: getAccountsByType('cash'),
    current: getAccountsByType('current'),
    savings: getAccountsByType('savings'),
    credit: getAccountsByType('credit')
  }

  if (error) {
    return (
      <Layout title="Accounts - Expense Tracker">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Accounts - Expense Tracker">
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Add Account
          </button>
        </header>

        {/* Total Balance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Worth</h3>
          <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Across {accounts.length} active accounts
          </p>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Account</h3>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g., Chase Checking"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="current">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.initial_balance}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, initial_balance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts by Type */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading accounts...</p>
          </div>
        ) : accounts.length > 0 ? (
          Object.entries(accountsByType).map(([type, typeAccounts]) => 
            typeAccounts.length > 0 && (
              <div key={type} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {getAccountTypeName(type)} Accounts
                </h3>
                
                {typeAccounts.map((account) => (
                  <div key={account.account_id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                        <span className="material-symbols-outlined text-gray-600">
                          {getAccountIcon(account.type)}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{account.name}</h4>
                        <p className="text-sm text-gray-500">
                          {account.transaction_count} transactions
                          {account.last_transaction_at && (
                            <> • Last: {new Date(account.last_transaction_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {editingAccount === account.account_id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={account.current_balance}
                              onBlur={(e) => handleUpdateBalance(account.account_id, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateBalance(account.account_id, parseFloat(e.currentTarget.value) || 0)
                                } else if (e.key === 'Escape') {
                                  setEditingAccount(null)
                                }
                              }}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className={`text-xl font-bold ${
                                account.type === 'credit' 
                                  ? (account.current_balance <= 0 ? 'text-green-600' : 'text-red-600')
                                  : (account.current_balance >= 0 ? 'text-green-600' : 'text-red-600')
                              }`}>
                                {formatCurrency(account.current_balance)}
                              </p>
                              {account.current_balance !== account.initial_balance && (
                                <p className="text-sm text-gray-500">
                                  Initial: {formatCurrency(account.initial_balance)}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => setEditingAccount(account.account_id)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(account.account_id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
              account_balance_wallet
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No accounts yet
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first account to start tracking your finances
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Account
            </button>
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
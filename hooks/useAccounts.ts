// /hooks/useAccounts.ts
import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { fetcher, mutationFetcher, buildUrl } from '@/lib/fetcher'

interface Account {
  account_id: string
  household_id: string
  name: string
  type: 'cash' | 'current' | 'credit' | 'savings'
  initial_balance: number
  currency: string
  current_balance: number
  transaction_count: number
  last_transaction_at: string | null
  is_archived: boolean
  created_at: string
}

interface CreateAccountData {
  household_id: string
  name: string
  type: 'cash' | 'current' | 'credit' | 'savings'
  initial_balance?: number
  currency?: string
}

interface UpdateAccountData {
  name?: string
  initial_balance?: number
  is_archived?: boolean
}

interface UseAccountsReturn {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  mutate: () => Promise<void>
  createAccount: (data: CreateAccountData) => Promise<Account | null>
  updateAccount: (id: string, data: UpdateAccountData) => Promise<Account | null>
  deleteAccount: (id: string) => Promise<boolean>
  getTotalBalance: () => number
  getAccountsByType: (type: string) => Account[]
  getActiveAccounts: () => Account[]
}

export function useAccounts(householdId: string | null): UseAccountsReturn {
  const [error, setError] = useState<string | null>(null)

  // Build URL with household filter
  const url = householdId 
    ? buildUrl('/api/accounts', { household_id: householdId })
    : null

  const { data: accounts = [], error: swrError, isLoading, mutate } = useSWR<Account[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (err) => {
        console.error('Error fetching accounts:', err)
        setError(err.message || 'Failed to fetch accounts')
      },
      onSuccess: () => {
        setError(null)
      }
    }
  )

  // Update error state from SWR
  useEffect(() => {
    if (swrError) {
      setError(swrError.message || 'Failed to fetch accounts')
    }
  }, [swrError])

  const createAccount = useCallback(async (
    data: CreateAccountData
  ): Promise<Account | null> => {
    try {
      setError(null)

      const newAccount = await mutationFetcher<Account>('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // Optimistically update the cache
      await mutate()
      
      return newAccount

    } catch (err: any) {
      console.error('Error creating account:', err)
      setError(err.message || 'Failed to create account')
      return null
    }
  }, [mutate])

  const updateAccount = useCallback(async (
    id: string,
    data: UpdateAccountData
  ): Promise<Account | null> => {
    try {
      setError(null)

      const updatedAccount = await mutationFetcher<Account>(`/api/accounts?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      // Optimistically update the cache
      await mutate()
      
      return updatedAccount

    } catch (err: any) {
      console.error('Error updating account:', err)
      setError(err.message || 'Failed to update account')
      return null
    }
  }, [mutate])

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)

      await mutationFetcher(`/api/accounts?id=${id}`, {
        method: 'DELETE',
      })

      // Optimistically update the cache
      await mutate()
      
      return true

    } catch (err: any) {
      console.error('Error deleting account:', err)
      setError(err.message || 'Failed to delete account')
      return false
    }
  }, [mutate])

  const getTotalBalance = useCallback((): number => {
    return accounts
      .filter(account => !account.is_archived)
      .reduce((total, account) => {
        // For credit accounts, negative balance is good (less debt)
        // For other accounts, positive balance is good
        if (account.type === 'credit') {
          return total - account.current_balance // Subtract debt
        } else {
          return total + account.current_balance // Add assets
        }
      }, 0)
  }, [accounts])

  const getAccountsByType = useCallback((type: string): Account[] => {
    return accounts.filter(account => 
      account.type === type && !account.is_archived
    )
  }, [accounts])

  const getActiveAccounts = useCallback((): Account[] => {
    return accounts.filter(account => !account.is_archived)
  }, [accounts])

  return {
    accounts,
    isLoading,
    error,
    mutate: async () => { await mutate() },
    createAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance,
    getAccountsByType,
    getActiveAccounts
  }
}
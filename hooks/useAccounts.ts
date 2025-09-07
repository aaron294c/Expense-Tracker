// hooks/useAccounts.ts
import { useState, useEffect, useCallback } from 'react';
import type { API, Hooks, AccountWithBalance } from '@/types/app.contracts';

export function useAccounts(householdId: string | null): Hooks.UseAccountsReturn {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!householdId) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ household_id: householdId });
      const response = await fetch(`/api/accounts?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch accounts');
      }

      const result: API.AccountsResponse = await response.json();
      setAccounts(result.data);

    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  const createAccount = useCallback(async (
    data: API.CreateAccountRequest
  ): Promise<AccountWithBalance | null> => {
    if (!householdId) return null;

    try {
      setError(null);

      const params = new URLSearchParams({ household_id: householdId });
      const response = await fetch(`/api/accounts?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const result = await response.json();
      const newAccount = result.data;

      // Add to the list
      setAccounts(prev => [...prev, newAccount].sort((a, b) => a.name.localeCompare(b.name)));
      
      return newAccount;

    } catch (err) {
      console.error('Error creating account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      return null;
    }
  }, [householdId]);

  const updateAccount = useCallback(async (
    id: string, 
    data: API.UpdateAccountRequest
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/accounts?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }

      const result = await response.json();
      const updatedAccount = result.data;

      // Update in the list
      setAccounts(prev => 
        prev.map(account => 
          account.account_id === id ? { ...account, ...updatedAccount } : account
        )
      );
      
      return true;

    } catch (err) {
      console.error('Error updating account:', err);
      setError(err instanceof Error ? err.message : 'Failed to update account');
      return false;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/accounts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Remove from the list (or mark as archived based on response)
      setAccounts(prev => prev.filter(account => account.account_id !== id));
      
      return true;

    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      return false;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount
  };
}
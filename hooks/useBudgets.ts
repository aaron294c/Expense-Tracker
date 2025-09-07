// hooks/useBudgets.ts (Updated)
import { useState, useEffect, useCallback } from 'react';
import type { API, Hooks } from '@/types/app.contracts';

export function useBudgets(householdId: string | null, month: string): Hooks.UseBudgetsReturn {
  const [data, setData] = useState<API.BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!householdId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        household_id: householdId,
        month: month
      });

      const response = await fetch(`/api/budgets?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch budgets');
      }

      const result: API.BudgetsResponse = await response.json();
      setData(result.data);

    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, month]);

  const updateBudgets = useCallback(async (
    budgets: { category_id: string; amount: number; rollover_enabled?: boolean }[]
  ): Promise<boolean> => {
    if (!householdId) return false;

    try {
      setError(null);

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: month,
          category_budgets: budgets
        } satisfies API.CreateBudgetRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update budgets');
      }

      // Refresh data after successful update
      await fetchBudgets();
      return true;

    } catch (err) {
      console.error('Error updating budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to update budgets');
      return false;
    }
  }, [householdId, month, fetchBudgets]);

  const applyRollover = useCallback(async (
    fromMonth: string,
    toMonth: string
  ): Promise<boolean> => {
    if (!householdId) return false;

    try {
      setError(null);

      const response = await fetch('/api/budgets?action=rollover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_month: fromMonth,
          to_month: toMonth,
          household_id: householdId
        } satisfies API.ApplyRolloverRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply rollover');
      }

      // Refresh data if we're viewing the target month
      if (month === toMonth) {
        await fetchBudgets();
      }
      
      return true;

    } catch (err) {
      console.error('Error applying rollover:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply rollover');
      return false;
    }
  }, [householdId, month, fetchBudgets]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchBudgets,
    updateBudgets,
    applyRollover
  };
}

// hooks/useTransactions.ts (Updated with optimistic updates)
import { useState, useEffect, useCallback } from 'react';
import type { API, Hooks, TransactionWithDetails } from '@/types/app.contracts';

export function useTransactions(
  householdId: string | null,
  initialFilters: API.TransactionFilters = {}
): Hooks.UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<API.TransactionFilters>({
    limit: 20,
    offset: 0,
    ...initialFilters
  });

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!householdId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        household_id: householdId,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        )
      });

      const response = await fetch(`/api/transactions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const result: API.TransactionsResponse = await response.json();
      const newTransactions = result.data || [];

      if (reset) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }

      setHasMore(result.pagination?.hasMore || false);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, filters]);

  const refetch = useCallback(async () => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    await fetchTransactions(true);
  }, [fetchTransactions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20)
    }));
  }, [hasMore, isLoading]);

  const createTransaction = useCallback(async (
    data: API.CreateTransactionRequest
  ): Promise<TransactionWithDetails | null> => {
    try {
      setError(null);

      // Optimistic update - add temporary transaction
      const tempTransaction: TransactionWithDetails = {
        id: `temp-${Date.now()}`,
        household_id: householdId!,
        account_id: data.account_id,
        account_name: 'Loading...', // Will be updated when real response comes
        user_id: 'current-user',
        occurred_at: data.occurred_at || new Date().toISOString(),
        description: data.description,
        merchant: data.merchant || null,
        amount: data.amount,
        direction: data.direction,
        currency: data.currency || 'USD',
        attachment_url: data.attachment_url || null,
        created_at: new Date().toISOString(),
        categories: data.categories?.map(cat => ({
          category_id: cat.category_id,
          category_name: 'Loading...',
          icon: '',
          color: '',
          weight: cat.weight
        })) || [],
        primary_category_name: 'Loading...',
        primary_category_icon: ''
      };

      setTransactions(prev => [tempTransaction, ...prev]);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Remove optimistic update on error
        setTransactions(prev => prev.filter(t => t.id !== tempTransaction.id));
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      const newTransaction = result.data;

      // Replace optimistic update with real data
      setTransactions(prev => 
        prev.map(t => t.id === tempTransaction.id ? newTransaction : t)
      );
      
      return newTransaction;

    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      return null;
    }
  }, [householdId]);

  const updateFilters = useCallback((newFilters: API.TransactionFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset offset when filters change
    }));
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions(true);
  }, [filters.household_id, filters.account_id, filters.category_id, filters.date_from, filters.date_to, filters.search]);

  // Load more when offset changes (but not on initial load)
  useEffect(() => {
    if (filters.offset && filters.offset > 0) {
      fetchTransactions(false);
    }
  }, [filters.offset]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    refetch,
    loadMore,
    createTransaction,
    setFilters: updateFilters,
    filters
  };
}
// /hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';

interface TransactionCategory {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  weight: number;
}

interface Transaction {
  id: string;
  household_id: string;
  account_id: string;
  account_name: string;
  user_id: string;
  occurred_at: string;
  description: string;
  merchant: string | null;
  amount: number;
  direction: 'inflow' | 'outflow';
  currency: string;
  attachment_url: string | null;
  created_at: string;
  categories: TransactionCategory[];
  primary_category_name: string;
  primary_category_icon: string;
}

interface TransactionFilters {
  account_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface CreateTransactionData {
  account_id: string;
  occurred_at?: string;
  description: string;
  merchant?: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  currency?: string;
  attachment_url?: string;
  categories?: {
    category_id: string;
    weight: number;
  }[];
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  createTransaction: (data: CreateTransactionData) => Promise<Transaction | null>;
  setFilters: (filters: TransactionFilters) => void;
  filters: TransactionFilters;
}

export function useTransactions(
  householdId: string | null,
  initialFilters: TransactionFilters = {}
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
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

      const result = await response.json();
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
    data: CreateTransactionData
  ): Promise<Transaction | null> => {
    try {
      setError(null);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      const newTransaction = result.data;

      // Add to the beginning of the list
      setTransactions(prev => [newTransaction, ...prev]);
      
      return newTransaction;

    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      return null;
    }
  }, []);

  const updateFilters = useCallback((newFilters: TransactionFilters) => {
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
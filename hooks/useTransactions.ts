/ hooks/useTransactions.ts - Fixed version  
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseBrowser';
import { useAuth } from '../contexts/AuthContext';

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

export function useTransactions(
  householdId: string | null,
  initialFilters: any = {}
) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!householdId || !user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        household_id: householdId,
        limit: (filters.limit || 20).toString(),
        offset: reset ? '0' : transactions.length.toString(),
        ...(filters.account_id && { account_id: filters.account_id }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.search && { search: filters.search }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const result = await response.json();
      
      if (reset) {
        setTransactions(result.data || []);
      } else {
        setTransactions(prev => [...prev, ...(result.data || [])]);
      }
      
      setHasMore(result.pagination?.hasMore || false);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user, filters, transactions.length]);

  const createTransaction = useCallback(async (
    data: CreateTransactionData
  ): Promise<Transaction | null> => {
    if (!user || !householdId) throw new Error('User not authenticated or no household');

    try {
      setError(null);

      const response = await fetch(`/api/transactions?household_id=${householdId}`, {
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
  }, [user, householdId]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchTransactions(false);
    }
  }, [fetchTransactions, isLoading, hasMore]);

  const refetch = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions(true);
  }, [householdId, user, filters]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    refetch,
    loadMore,
    createTransaction,
    setFilters,
    filters,
  };
}

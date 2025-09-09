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

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!householdId || !user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: transactionData, error: transactionError } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('household_id', householdId)
        .order('occurred_at', { ascending: false })
        .limit(10);

      if (transactionError) {
        throw transactionError;
      }

      setTransactions(transactionData || []);
      setHasMore(false); // For now, just load 10

    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user]);

  const createTransaction = useCallback(async (
    data: CreateTransactionData
  ): Promise<Transaction | null> => {
    if (!user) throw new Error('User not authenticated');

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
  }, [user]);

  useEffect(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    refetch: () => fetchTransactions(true),
    loadMore: () => {}, // Implement if needed
    createTransaction,
  };
}

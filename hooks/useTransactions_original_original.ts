// hooks/useTransactions.ts (Enhanced version)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "../lib/supabaseBrowser";
import { useAuth } from '@/components/auth/AuthProvider';

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
  categories: TransactionCategory[];
  primary_category_name: string;
  primary_category_icon: string;
}

interface TransactionCategory {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  weight: number;
}

interface CreateTransactionData {
  account_id: string;
  occurred_at?: string;
  description: string;
  merchant?: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  currency?: string;
  categories?: {
    category_id: string;
    weight: number;
  }[];
}

export function useTransactions(householdId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!householdId || !user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/transactions?household_id=${householdId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      setTransactions(result.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, user]);

  const createTransaction = useCallback(async (data: CreateTransactionData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      const newTransaction = result.data;

      // Optimistically update the UI
      setTransactions(prev => [newTransaction, ...prev]);
      
      return newTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time subscription
  useEffect(() => {
    if (!householdId) return;

    const subscription = supabase
      .channel(`transactions_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [householdId, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    createTransaction,
  };
}
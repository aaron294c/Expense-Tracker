
// hooks/useAccounts.ts - Fixed version
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseBrowser';

interface AccountWithBalance {
  account_id: string;
  household_id: string;
  name: string;
  type: string;
  current_balance: number;
  currency: string;
  is_archived: boolean;
  transaction_count: number;
  last_transaction_at?: string;
}

export function useAccounts(householdId: string | null) {
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

      const result = await response.json();
      setAccounts(result.data || []);

    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
  };
}
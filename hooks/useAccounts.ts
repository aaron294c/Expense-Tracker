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

      const { data: accountData, error: accountError } = await supabase
        .from('v_account_balances')
        .select('*')
        .eq('household_id', householdId)
        .eq('is_archived', false)
        .order('name');

      if (accountError) {
        throw accountError;
      }

      setAccounts(accountData || []);

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

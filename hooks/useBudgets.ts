// /hooks/useBudgets.ts
import { useState, useEffect, useCallback } from 'react';

interface CategorySummary {
  household_id: string;
  month: string;
  category_id: string;
  category_name: string;
  category_kind: 'expense' | 'income';
  icon: string;
  color: string;
  budget: number;
  spent: number;
  earned: number;
  remaining: number;
  budget_percentage: number;
  transaction_count: number;
  rollover_enabled: boolean;
}

interface BurnRate {
  household_id: string;
  month: string;
  spent: number;
  budget: number;
  remaining: number;
  daily_average: number;
  daily_burn_rate: number;
  projected_monthly_spend: number;
  remaining_days: number;
  suggested_daily_spend: number;
}

interface Category {
  id: string;
  name: string;
  kind: 'expense' | 'income';
  icon: string;
  color: string;
}

interface BudgetData {
  month: string;
  household_id: string;
  categories: CategorySummary[];
  burn_rate: BurnRate | null;
  all_categories: Category[];
}

interface UseBudgetsReturn {
  data: BudgetData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateBudgets: (budgets: { category_id: string; amount: number; rollover_enabled?: boolean }[]) => Promise<boolean>;
  applyRollover: (fromMonth: string, toMonth: string) => Promise<boolean>;
}

export function useBudgets(householdId: string | null, month: string): UseBudgetsReturn {
  const [data, setData] = useState<BudgetData | null>(null);
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

      const result = await response.json();
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
        }),
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
        }),
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
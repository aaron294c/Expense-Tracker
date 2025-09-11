// /hooks/useCategorySummary.ts
import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../lib/api';

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

interface UseCategorySummaryReturn {
  summaries: CategorySummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTopCategories: (kind: 'expense' | 'income', limit?: number) => CategorySummary[];
  getTotalSpent: () => number;
  getTotalBudget: () => number;
  getBudgetUtilization: () => number;
}

export function useCategorySummary(
  householdId: string | null,
  month: string
): UseCategorySummaryReturn {
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!householdId || !month) {
      setSummaries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use API route instead of direct Supabase query to bypass RLS issues
      const data = await authenticatedFetch(`/api/category-summary?household_id=${householdId}&month=${month}`);
      setSummaries(data.summaries || []);

    } catch (err) {
      console.error('Error fetching category summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch category summaries');
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, month]);

  const getTopCategories = useCallback((
    kind: 'expense' | 'income',
    limit = 5
  ): CategorySummary[] => {
    return summaries
      .filter(s => s.category_kind === kind)
      .sort((a, b) => {
        if (kind === 'expense') {
          return b.spent - a.spent;
        } else {
          return b.earned - a.earned;
        }
      })
      .slice(0, limit);
  }, [summaries]);

  const getTotalSpent = useCallback((): number => {
    return summaries
      .filter(s => s.category_kind === 'expense')
      .reduce((total, s) => total + s.spent, 0);
  }, [summaries]);

  const getTotalBudget = useCallback((): number => {
    return summaries
      .filter(s => s.category_kind === 'expense')
      .reduce((total, s) => total + s.budget, 0);
  }, [summaries]);

  const getBudgetUtilization = useCallback((): number => {
    const totalBudget = getTotalBudget();
    const totalSpent = getTotalSpent();
    
    if (totalBudget === 0) return 0;
    return (totalSpent / totalBudget) * 100;
  }, [getTotalBudget, getTotalSpent]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return {
    summaries,
    isLoading,
    error,
    refetch: fetchSummaries,
    getTopCategories,
    getTotalSpent,
    getTotalBudget,
    getBudgetUtilization
  };
}

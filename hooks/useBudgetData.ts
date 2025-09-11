// hooks/useBudgetData.ts - Consistent budget data hook for all pages
import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../lib/api';

interface BudgetItem {
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  budget: number;
  spent: number;
  remaining: number;
  budget_percentage: number;
  category_kind: 'expense' | 'income';
}

interface BudgetData {
  categories: BudgetItem[];
  all_categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    kind: 'expense' | 'income';
  }>;
  household_id: string;
}

interface UseBudgetDataReturn {
  budgetData: BudgetData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTotalSpent: () => number;
  getTotalBudget: () => number;
  getBudgetUtilization: () => number;
  getExpenseCategories: () => BudgetItem[];
}

export function useBudgetData(householdId: string | null): UseBudgetDataReturn {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetData = useCallback(async () => {
    if (!householdId) {
      setBudgetData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `/api/budgets-minimal?household_id=${householdId}`
      );

      if (response?.error) {
        throw new Error(response.error);
      }

      setBudgetData(response?.data || null);
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budget data');
      setBudgetData(null);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  const getTotalSpent = useCallback((): number => {
    if (!budgetData?.categories) return 0;
    return budgetData.categories
      .filter(c => c.category_kind === 'expense')
      .reduce((total, c) => total + (c.spent || 0), 0);
  }, [budgetData]);

  const getTotalBudget = useCallback((): number => {
    if (!budgetData?.categories) return 0;
    return budgetData.categories
      .filter(c => c.category_kind === 'expense')
      .reduce((total, c) => total + (c.budget || 0), 0);
  }, [budgetData]);

  const getBudgetUtilization = useCallback((): number => {
    const totalBudget = getTotalBudget();
    const totalSpent = getTotalSpent();
    
    if (totalBudget === 0) return 0;
    return (totalSpent / totalBudget) * 100;
  }, [getTotalBudget, getTotalSpent]);

  const getExpenseCategories = useCallback((): BudgetItem[] => {
    if (!budgetData?.categories) return [];
    return budgetData.categories.filter(c => c.category_kind === 'expense');
  }, [budgetData]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  return {
    budgetData,
    isLoading,
    error,
    refetch: fetchBudgetData,
    getTotalSpent,
    getTotalBudget,
    getBudgetUtilization,
    getExpenseCategories
  };
}
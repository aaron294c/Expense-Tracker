// /hooks/useRules.ts
import { useState, useEffect, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  kind: 'expense' | 'income';
  icon: string;
  color: string;
}

interface CategorizationRule {
  id: string;
  household_id: string;
  match_type: 'merchant_exact' | 'merchant_contains' | 'description_contains';
  match_value: string;
  category_id: string;
  priority: number;
  created_at: string;
  categories: Category;
}

interface CreateRuleData {
  household_id: string;
  match_type: 'merchant_exact' | 'merchant_contains' | 'description_contains';
  match_value: string;
  category_id: string;
  priority?: number;
}

interface CreateRuleFromTransactionData {
  transaction_id: string;
  category_id: string;
  rule_type: 'merchant_exact' | 'merchant_contains';
}

interface UseRulesReturn {
  rules: CategorizationRule[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createRule: (data: CreateRuleData) => Promise<CategorizationRule | null>;
  createRuleFromTransaction: (data: CreateRuleFromTransactionData) => Promise<CategorizationRule | null>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  getRulesByPriority: () => CategorizationRule[];
  getRulesByMatchType: (matchType: string) => CategorizationRule[];
}

export function useRules(householdId: string | null): UseRulesReturn {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!householdId) {
      setRules([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({ household_id: householdId });
      const response = await fetch(`/api/rules?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rules');
      }

      const result = await response.json();
      setRules(result.data || []);

    } catch (err) {
      console.error('Error fetching rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  const createRule = useCallback(async (
    data: CreateRuleData
  ): Promise<CategorizationRule | null> => {
    try {
      setError(null);

      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rule');
      }

      const result = await response.json();
      const newRule = result.data;

      // Add to the list and sort by priority
      setRules(prev => [...prev, newRule].sort((a, b) => a.priority - b.priority));
      
      return newRule;

    } catch (err) {
      console.error('Error creating rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create rule');
      return null;
    }
  }, []);

  const createRuleFromTransaction = useCallback(async (
    data: CreateRuleFromTransactionData
  ): Promise<CategorizationRule | null> => {
    try {
      setError(null);

      const response = await fetch('/api/rules?action=from_transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rule from transaction');
      }

      const result = await response.json();
      const newRule = result.data.rule;

      // Add to the list and sort by priority
      setRules(prev => [...prev, newRule].sort((a, b) => a.priority - b.priority));
      
      return newRule;

    } catch (err) {
      console.error('Error creating rule from transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create rule from transaction');
      return null;
    }
  }, []);

  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/rules?id=${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rule');
      }

      // Remove from the list
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      
      return true;

    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      return false;
    }
  }, []);

  const getRulesByPriority = useCallback((): CategorizationRule[] => {
    return [...rules].sort((a, b) => a.priority - b.priority);
  }, [rules]);

  const getRulesByMatchType = useCallback((matchType: string): CategorizationRule[] => {
    return rules.filter(rule => rule.match_type === matchType);
  }, [rules]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    isLoading,
    error,
    refetch: fetchRules,
    createRule,
    createRuleFromTransaction,
    deleteRule,
    getRulesByPriority,
    getRulesByMatchType
  };
}
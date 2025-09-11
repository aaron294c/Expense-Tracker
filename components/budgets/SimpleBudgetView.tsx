// components/budgets/SimpleBudgetView.tsx - Simple budget view without complex dependencies
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { authenticatedFetch } from '../../lib/api';
import { useHousehold } from '../../hooks/useHousehold';

interface BudgetSummary {
  category_id: string;
  category_name: string;
  category_kind: 'expense' | 'income';
  icon: string;
  color: string;
  spent: number;
  budget: number;
  remaining: number;
}

interface SimpleBudgetViewProps {
  currentMonth: string;
}

export function SimpleBudgetView({ currentMonth }: SimpleBudgetViewProps) {
  const { currentHousehold } = useHousehold();
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentHousehold?.id && currentMonth) {
      fetchBudgets();
    }
  }, [currentHousehold?.id, currentMonth]);

  const fetchBudgets = async () => {
    if (!currentHousehold?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await authenticatedFetch(
        `/api/category-summary?household_id=${currentHousehold.id}&month=${currentMonth}-01`
      );
      setBudgets(data.summaries || []);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Loading budgets...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold">Unable to load budgets</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <Button onClick={fetchBudgets} variant="secondary">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const expenseBudgets = budgets.filter(b => b.category_kind === 'expense');
  const totalBudget = expenseBudgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = expenseBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (expenseBudgets.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets found</h3>
          <p className="text-gray-600 mb-4">Start tracking your spending by setting up category budgets.</p>
          <Button variant="primary">
            Set Up Budgets
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Budget Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Spent</span>
            <span className="font-semibold text-gray-900">£{totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Budget</span>
            <span className="font-semibold text-gray-900">£{totalBudget.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-gray-600">Remaining</span>
            <span className={`font-semibold ${
              totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              £{(totalBudget - totalSpent).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                overallProgress >= 100 ? 'bg-red-500' : 
                overallProgress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Category Budgets */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Category Budgets</h3>
        {expenseBudgets.map((budget) => {
          const progress = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
          const isOverBudget = progress >= 100;
          
          return (
            <Card key={budget.category_id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: budget.color }}
                >
                  {budget.icon || '📊'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{budget.category_name}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>£{budget.spent.toFixed(2)} of £{budget.budget.toFixed(2)}</span>
                    <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isOverBudget ? 'bg-red-500' : 
                    progress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              
              {budget.remaining < 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  £{Math.abs(budget.remaining).toFixed(2)} over budget
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
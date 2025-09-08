import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CategoryBudget {
  category_id: string;
  category_name: string;
  category_kind: 'expense' | 'income';
  icon: string;
  color: string;
  budget: number;
  spent: number;
  rollover_enabled: boolean;
}

interface BudgetEditorProps {
  categories: CategoryBudget[];
  onUpdateBudgets: (budgets: { category_id: string; amount: number; rollover_enabled?: boolean }[]) => Promise<boolean>;
  isLoading?: boolean;
}

export function BudgetEditor({ categories, onUpdateBudgets, isLoading = false }: BudgetEditorProps) {
  const [editingCategories, setEditingCategories] = useState<Set<string>>(new Set());
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});
  const [rolloverEnabled, setRolloverEnabled] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize budget values when categories change
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    const initialRollover: Record<string, boolean> = {};
    
    categories.forEach(category => {
      initialValues[category.category_id] = category.budget.toString();
      initialRollover[category.category_id] = category.rollover_enabled;
    });
    
    setBudgetValues(initialValues);
    setRolloverEnabled(initialRollover);
  }, [categories]);

  const startEditing = (categoryId: string) => {
    setEditingCategories(prev => new Set(prev).add(categoryId));
  };

  const cancelEditing = (categoryId: string) => {
    setEditingCategories(prev => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
    
    // Reset to original value
    const category = categories.find(c => c.category_id === categoryId);
    if (category) {
      setBudgetValues(prev => ({
        ...prev,
        [categoryId]: category.budget.toString()
      }));
    }
  };

  const saveBudget = async (categoryId: string) => {
    const newAmount = parseFloat(budgetValues[categoryId]) || 0;
    const rollover = rolloverEnabled[categoryId];
    
    setIsSaving(true);
    
    const success = await onUpdateBudgets([{
      category_id: categoryId,
      amount: newAmount,
      rollover_enabled: rollover
    }]);
    
    setIsSaving(false);
    
    if (success) {
      setEditingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  const updateBudgetValue = (categoryId: string, value: string) => {
    setBudgetValues(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const toggleRollover = (categoryId: string) => {
    setRolloverEnabled(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const expenseCategories = categories.filter(c => c.category_kind === 'expense');

  const renderCategoryCard = (category: CategoryBudget) => {
    const isEditing = editingCategories.has(category.category_id);
    const currentValue = budgetValues[category.category_id] || '0';
    const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
    const isOverBudget = percentage > 100;

    return (
      <Card key={category.category_id} className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <span className="text-2xl">{category.icon}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{category.category_name}</h3>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => saveBudget(category.category_id)}
                      loading={isSaving}
                      disabled={isSaving}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEditing(category.category_id)}
                      disabled={isSaving}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(category.category_id)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => updateBudgetValue(category.category_id, e.target.value)}
                    className="flex-1"
                    step="0.01"
                    min="0"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rolloverEnabled[category.category_id]}
                    onChange={() => toggleRollover(category.category_id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Enable rollover
                </label>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(category.spent)} spent
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(category.budget)} budget
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: category.color 
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-gray-500'}`}>
                    {isOverBudget && `Over by ${formatCurrency(category.spent - category.budget)}`}
                    {!isOverBudget && `${formatCurrency(category.budget - category.spent)} remaining`}
                  </span>
                  {category.rollover_enabled && (
                    <span className="text-xs text-blue-600 font-medium">Rollover enabled</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {expenseCategories.length > 0 && (
        <div>
          <h2 className="section-header">Expense Categories</h2>
          <div className="space-y-3">
            {expenseCategories.map(renderCategoryCard)}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_kind: 'expense' | 'income';
  icon: string;
  color: string;
  budget: number;
  spent: number;
  budget_percentage: number;
}

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  totalSpent: number;
}

export function CategoryBreakdown({ categories, totalSpent }: CategoryBreakdownProps) {
  const expenseCategories = categories
    .filter(c => c.category_kind === 'expense' && c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6); // Top 6 categories

  const calculatePercentage = (spent: number) => {
    return totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
  };

  const getTrendIcon = (category: CategorySummary) => {
    const percentage = category.budget_percentage;
    if (percentage > 100) return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
    if (percentage > 80) return <ArrowTrendingUpIcon className="h-4 w-4 text-orange-500" />;
    if (percentage > 50) return <MinusIcon className="h-4 w-4 text-gray-500" />;
    return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
  };

  const getTrendText = (category: CategorySummary) => {
    const percentage = category.budget_percentage;
    if (percentage > 100) return 'Over budget';
    if (percentage > 80) return 'High usage';
    if (percentage > 50) return 'On track';
    return 'Under budget';
  };

  const getTrendColor = (category: CategorySummary) => {
    const percentage = category.budget_percentage;
    if (percentage > 100) return 'text-red-600';
    if (percentage > 80) return 'text-orange-600';
    if (percentage > 50) return 'text-gray-600';
    return 'text-green-600';
  };

  return (
    <Card className="p-6">
      <h2 className="section-header">Category Breakdown</h2>
      
      {/* Total Spent Display */}
      <div className="relative h-48 flex items-center justify-center mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-500">Total Spent This Month</p>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {expenseCategories.map((category) => {
          const categoryPercentage = calculatePercentage(category.spent);
          const budgetUtilization = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
          
          return (
            <div key={category.category_id} className="flex items-center gap-4">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <span className="text-lg">{category.icon}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-gray-900">{category.category_name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getTrendColor(category)}`}>
                      {getTrendText(category)}
                    </span>
                    {getTrendIcon(category)}
                    <p className="font-bold text-gray-900">{formatCurrency(category.spent)}</p>
                  </div>
                </div>
                
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(budgetUtilization, 100)}%`,
                      backgroundColor: category.color 
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPercentage(categoryPercentage)} of total
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

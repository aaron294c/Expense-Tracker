import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';

interface BudgetOverviewProps {
  spent: number;
  budget: number;
  currency?: string;
}

export function BudgetOverview({ spent, budget, currency = 'USD' }: BudgetOverviewProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;
  const isOverBudget = spent > budget;
  const isNearBudget = percentage > 80 && !isOverBudget;

  const getTrendIcon = () => {
    if (isOverBudget) return TrendingUp;
    if (isNearBudget) return Minus;
    return TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <h2 className="section-header mb-0">Budget Overview</h2>
        <div className={`p-2 rounded-xl ${
          isOverBudget 
            ? 'bg-red-50 text-red-600' 
            : isNearBudget 
            ? 'bg-yellow-50 text-yellow-600'
            : 'bg-green-50 text-green-600'
        }`}>
          <TrendIcon size={16} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-4xl font-bold text-text-primary tracking-tight mb-1">
            {formatCurrency(spent, currency)}
          </p>
          <p className="text-sm text-text-secondary">
            of {formatCurrency(budget, currency)}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-20 h-20 mx-auto">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-border/subtle"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="32"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className={
                isOverBudget 
                  ? 'text-red-500' 
                  : isNearBudget 
                  ? 'text-yellow-500'
                  : 'text-brand'
              }
              strokeDasharray={`${2 * Math.PI * 32}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 32 * (1 - Math.min(percentage, 100) / 100)
              }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${
              isOverBudget ? 'text-red-600' : 'text-text-primary'
            }`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
          isOverBudget
            ? 'bg-red-50 text-red-600'
            : remaining > 0
            ? 'bg-green-50 text-green-600'
            : 'bg-border/subtle text-text-secondary'
        }`}>
          {isOverBudget 
            ? `Over by ${formatCurrency(Math.abs(remaining), currency)}`
            : remaining > 0
            ? `${formatCurrency(remaining, currency)} remaining`
            : 'Budget met'
          }
        </div>

        {/* Hero Add Transaction Button */}
        <div className="mt-3 flex justify-center">
          <button className="size-20 rounded-full bg-[#2563eb] text-white grid place-items-center shadow-[0_20px_40px_rgba(37,99,235,0.35)] ring-8 ring-white active:scale-95 transition">
            <Plus className="size-8" />
          </button>
          <p className="text-[12px] text-gray-500 mt-1 absolute translate-y-[84px]">Add transaction</p>
        </div>
      </div>
    </motion.div>
  );
}

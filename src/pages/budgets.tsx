import React from 'react';
import { Layout } from '../components/Layout';
import { BudgetEditor } from '../components/budgets/BudgetEditor';
import { BurnRateCard } from '../components/budgets/BurnRateCard';
import { useBudgets } from '../hooks/useBudgets';
import { useHousehold } from '../hooks/useHousehold';
import { useMonth } from '../hooks/useMonth';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

export default function BudgetsPage() {
  const { currentHousehold } = useHousehold();
  const { 
    currentMonth, 
    monthDisplay, 
    goToPreviousMonth, 
    goToNextMonth,
    isCurrentCalendarMonth 
  } = useMonth();
  
  const { data: budgetData, isLoading, updateBudgets } = useBudgets(
    currentHousehold?.id || null, 
    currentMonth
  );

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{monthDisplay}</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth}
            disabled={isCurrentCalendarMonth}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Burn Rate Analysis */}
        <BurnRateCard burnRate={budgetData?.burn_rate || null} />

        {/* Budget Editor */}
        <BudgetEditor
          categories={budgetData?.categories || []}
          onUpdateBudgets={updateBudgets}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}

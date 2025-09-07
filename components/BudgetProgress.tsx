import React from 'react'

export function BudgetProgress({
  name, spent, budget, color = '#999'
}: { name: string; spent: number; budget: number; color?: string }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = budget > 0 && spent > budget
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span>{spent.toFixed(2)} / {budget.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full rounded bg-gray-200">
        <div
          className={`h-2 rounded ${over ? 'bg-red-500' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: over ? undefined : color || '#3b82f6' }}
        />
      </div>
    </div>
  )
}

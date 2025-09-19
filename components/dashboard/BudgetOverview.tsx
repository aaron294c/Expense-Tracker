// components/dashboard/BudgetOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface BudgetOverviewProps {
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  remainingBudget: number;
  percentageUsed: number;
}

export function BudgetOverview({
  totalBudget,
  totalSpent,
  totalIncome,
  remainingBudget,
  percentageUsed
}: BudgetOverviewProps) {
  const isOverBudget = percentageUsed > 100;
  const isNearLimit = percentageUsed > 80;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Monthly allocation
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {percentageUsed.toFixed(1)}% of budget
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          {isOverBudget ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            isOverBudget ? 'text-destructive' : ''
          }`}>
            ${remainingBudget.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isOverBudget ? 'Over budget' : 'Available to spend'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Spent</span>
              <span>{percentageUsed.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(percentageUsed, 100)} 
              className={`h-2 ${
                isOverBudget ? '[&>div]:bg-destructive' : 
                isNearLimit ? '[&>div]:bg-yellow-500' : ''
              }`}
            />
            {isOverBudget && (
              <p className="text-sm text-destructive font-medium">
                You are ${Math.abs(remainingBudget).toFixed(2)} over budget this month
              </p>
            )}
            {isNearLimit && !isOverBudget && (
              <p className="text-sm text-yellow-600 font-medium">
                You are approaching your budget limit
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
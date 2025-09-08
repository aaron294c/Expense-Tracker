import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { 
  ClockIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline';

interface InsightData {
  burnRate?: {
    daily_average: number;
    daily_burn_rate: number;
    projected_monthly_spend: number;
    budget: number;
  };
  topCategory?: {
    name: string;
    spent: number;
    budget: number;
  };
  savings?: {
    amount: number;
    category: string;
  };
}

interface QuickInsightsProps {
  data: InsightData;
}

export function QuickInsights({ data }: QuickInsightsProps) {
  const insights = [];

  // Spending velocity insight
  if (data.burnRate) {
    const isSpendingFast = data.burnRate.projected_monthly_spend > data.burnRate.budget * 1.1;
    if (isSpendingFast) {
      insights.push({
        icon: <ClockIcon className="h-5 w-5" />,
        title: 'Spending Velocity',
        description: `You're spending ${Math.round(((data.burnRate.projected_monthly_spend / data.burnRate.budget) - 1) * 100)}% faster this month. Consider reviewing your largest expense categories.`,
        color: 'orange'
      });
    }
  }

  // Top category insight
  if (data.topCategory && data.topCategory.spent > data.topCategory.budget) {
    insights.push({
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      title: 'Budget Alert',
      description: `You've exceeded your ${data.topCategory.name} budget by ${formatCurrency(data.topCategory.spent - data.topCategory.budget)}.`,
      color: 'red'
    });
  }

  // Savings suggestion
  if (data.savings && data.savings.amount > 0) {
    insights.push({
      icon: <LightBulbIcon className="h-5 w-5" />,
      title: 'Smart Suggestion',
      description: `You've saved ${formatCurrency(data.savings.amount)} on ${data.savings.category}. Consider moving that to your savings goal!`,
      color: 'green'
    });
  }

  // Achievement
  insights.push({
    icon: <TrophyIcon className="h-5 w-5" />,
    title: 'Achievement Unlocked',
    description: 'You\'ve tracked expenses for 7 days straight! Keep up the great work.',
    color: 'blue'
  });

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="section-header">Quick Insights</h2>
      
      {insights.map((insight, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getColorClasses(insight.color)}`}>
              {insight.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{insight.title}</p>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

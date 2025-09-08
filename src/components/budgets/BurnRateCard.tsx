import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface BurnRateData {
  household_id: string;
  month: string;
  spent: number;
  budget: number;
  remaining: number;
  daily_average: number;
  daily_burn_rate: number;
  projected_monthly_spend: number;
  remaining_days: number;
  suggested_daily_spend: number;
}

interface BurnRateCardProps {
  burnRate: BurnRateData | null;
}

export function BurnRateCard({ burnRate }: BurnRateCardProps) {
  if (!burnRate) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Spending Analysis</h3>
        <p className="text-gray-500 text-sm">No spending data available yet.</p>
      </Card>
    );
  }

  const isOnTrack = burnRate.projected_monthly_spend <= burnRate.budget;
  const overspendAmount = Math.max(0, burnRate.projected_monthly_spend - burnRate.budget);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {isOnTrack ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
        )}
        <h3 className="font-semibold text-gray-900">Spending Analysis</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Daily Average</p>
          <p className="text-lg font-semibold">{formatCurrency(burnRate.daily_average)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Projected Spend</p>
          <p className={`text-lg font-semibold ${
            isOnTrack ? 'text-green-600' : 'text-orange-600'
          }`}>
            {formatCurrency(burnRate.projected_monthly_spend)}
          </p>
        </div>
      </div>

      {!isOnTrack && (
        <div className="bg-orange-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-800">
            <strong>Heads up!</strong> You're projected to overspend by{' '}
            <strong>{formatCurrency(overspendAmount)}</strong> this month.
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          To stay on budget, try to spend no more than{' '}
          <strong>{formatCurrency(burnRate.suggested_daily_spend)}</strong> per day
          for the remaining {burnRate.remaining_days} days.
        </p>
      </div>
    </Card>
  );
}

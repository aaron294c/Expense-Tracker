import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../utils/formatters';
import { useTransactions } from '../../../hooks/useTransactions';
import { useHousehold } from '../../../hooks/useHousehold';

export function RecentTransactions() {
  const { currentHousehold } = useHousehold();
  const { transactions, isLoading } = useTransactions(currentHousehold?.id || null, {
    limit: 5
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-4">Recent Transactions</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
              <div className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-4">Recent Transactions</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-8">
          <p className="text-gray-500 mb-4">No transactions yet</p>
          <Link href="/transactions/add" className="text-blue-600 font-medium">
            Add your first expense
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Link href="/transactions" className="text-blue-600 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">
                  {transaction.primary_category_icon || '💳'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {transaction.merchant || transaction.description}
                </p>
                <p className="text-sm text-gray-500">
                  {transaction.primary_category_name}
                </p>
              </div>
              <p className={`font-bold ${
                transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.direction === 'outflow' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

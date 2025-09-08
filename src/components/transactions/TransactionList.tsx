import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTransactions } from '../../hooks/useTransactions';
import { useHousehold } from '../../hooks/useHousehold';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FunnelIcon } from '@heroicons/react/24/outline';

export function TransactionList() {
  const { currentHousehold } = useHousehold();
  const { transactions, isLoading, hasMore, loadMore } = useTransactions(
    currentHousehold?.id || null
  );
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FunnelIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="p-4">
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
                  {transaction.primary_category_name} • {formatDate(transaction.occurred_at)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {transaction.account_name}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${
                  transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.direction === 'outflow' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(transaction.occurred_at, 'short')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="secondary"
            onClick={loadMore}
            loading={isLoading}
          >
            Load More
          </Button>
        </div>
      )}

      {transactions.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">No transactions found</p>
          <Button onClick={() => window.location.href = '/transactions/add'}>
            Add Transaction
          </Button>
        </Card>
      )}
    </div>
  );
}

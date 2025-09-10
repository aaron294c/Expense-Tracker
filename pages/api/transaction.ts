// pages/transactions.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTransactions } from '../hooks/useTransactions';
import { useHousehold } from '../hooks/useHousehold';
import { formatCurrency, formatDate, getCurrencyFromHousehold } from '../lib/utils';

function TransactionsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold, 'USD');

  const { transactions, isLoading, hasMore, loadMore } = useTransactions(currentHousehold?.id || null);
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="p-4 space-y-3">
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters">
          🔍
        </Button>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        {transactions.map((t) => (
          <Card key={t.id}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <span className="text-2xl">{t.primary_category_icon || '💳'}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{t.merchant || t.description}</p>
                <p className="text-sm text-gray-500">
                  {t.primary_category_name} • {formatDate(t.occurred_at, 'short')}
                </p>
                <p className="text-xs text-gray-400 truncate">{t.account_name}</p>
              </div>

              <div className="text-right">
                <p className={`font-bold ${t.direction === 'outflow' ? 'text-red-600' : 'text-green-600'}`}>
                  {t.direction === 'outflow' ? '-' : '+'}
                  {formatCurrency(t.amount, currency)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(t.occurred_at, 'short')}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button variant="secondary" onClick={loadMore} disabled={isLoading} loading={isLoading}>
            Load More
          </Button>
        </div>
      )}

      {transactions.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500 mb-4">No transactions found</p>
          <Link href="/transactions/add" className="inline-block">
            <Button>Add Transaction</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <AuthWrapper>
      <AppLayout title="Transactions">
        <TransactionsContent />
      </AppLayout>
    </AuthWrapper>
  );
}

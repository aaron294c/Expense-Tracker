// components/features/transactions/TransactionList.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { PlusIcon, FilterIcon } from 'lucide-react';

interface TransactionListProps {
  householdId: string;
  limit?: number;
  showFilters?: boolean;
}

export function TransactionList({ householdId, limit, showFilters = false }: TransactionListProps) {
  const [filters, setFilters] = useState({});
  const { transactions, isLoading, error, hasMore, loadMore } = useTransactions(householdId, {
    limit,
    ...filters
  });

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600" role="alert">
            Failed to load transactions: {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<PlusIcon className="h-12 w-12" />}
            title="No transactions yet"
            description="Start tracking your expenses by adding your first transaction."
            action={{
              label: "Add Transaction",
              onClick: () => {
                // Open transaction modal
                window.dispatchEvent(new CustomEvent('open-transaction-modal'));
              }
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <FilterIcon className="h-5 w-5 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value || undefined })}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {/* Categories would be populated from useCategories hook */}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
            />
          ))}
          
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="text-blue-600 hover:underline disabled:opacity-50"
                aria-label="Load more transactions"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Load More'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionItem({ transaction }) {
  const amount = transaction.direction === 'outflow' ? -transaction.amount : transaction.amount;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: transaction.currency || 'USD'
  }).format(amount);

  return (
    <div 
      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
      role="listitem"
    >
      {/* Category Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
        {transaction.primary_category_icon ? (
          <span className="material-symbols-outlined text-xl text-gray-600">
            {transaction.primary_category_icon}
          </span>
        ) : (
          <span className="text-gray-400 text-lg">?</span>
        )}
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {transaction.merchant || transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {transaction.primary_category_name && (
            <span className="text-sm text-gray-500">
              {transaction.primary_category_name}
            </span>
          )}
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500">
            {new Date(transaction.occurred_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`font-bold ${
          transaction.direction === 'outflow' 
            ? 'text-red-600' 
            : 'text-green-600'
        }`}>
          {transaction.direction === 'outflow' ? '-' : '+'}{formattedAmount}
        </p>
        <p className="text-sm text-gray-500">
          {transaction.account_name}
        </p>
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={60} />
      </div>
    </div>
  );
}

// components/features/
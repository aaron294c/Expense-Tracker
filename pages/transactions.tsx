// pages/transactions.tsx - Comprehensive transaction management page
import React, { useState, useEffect, useMemo } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useHousehold } from '../hooks/useHousehold';
import { AddTransactionModal } from '../components/transactions/AddTransactionModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';
import { authenticatedFetch } from '../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Download, 
  Upload,
  MoreHorizontal,
  Check,
  ChevronDown,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  X
} from 'lucide-react';

interface FilterState {
  search: string;
  account_id: string;
  category_id: string;
  date_from: string;
  date_to: string;
  direction: 'all' | 'inflow' | 'outflow';
  amount_min: string;
  amount_max: string;
}

function TransactionsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold, 'USD');
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    account_id: '',
    category_id: '',
    date_from: '',
    date_to: '',
    direction: 'all',
    amount_min: '',
    amount_max: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data hooks
  const { accounts } = useAccounts(currentHousehold?.id || null);
  const [categories, setCategories] = useState<any[]>([]);

  // Simple categories fetch
  useEffect(() => {
    if (currentHousehold?.id) {
      // Add a small delay to ensure session is available
      setTimeout(() => {
        authenticatedFetch(`/api/categories?household_id=${currentHousehold.id}`)
          .then(data => setCategories(data.data || []))
          .catch(err => console.error('Error fetching categories:', err));
      }, 100);
    }
  }, [currentHousehold?.id]);
  
  // Build API filters from UI state
  const apiFilters = useMemo(() => {
    const result: any = { limit: 50 };
    
    if (filters.search) result.search = filters.search;
    if (filters.account_id) result.account_id = filters.account_id;
    if (filters.category_id) result.category_id = filters.category_id;
    if (filters.date_from) result.date_from = filters.date_from;
    if (filters.date_to) result.date_to = filters.date_to;
    
    return result;
  }, [filters]);

  const { 
    transactions, 
    isLoading, 
    hasMore, 
    loadMore, 
    refetch 
  } = useTransactions(currentHousehold?.id || null, apiFilters);

  // Filter and sort transactions locally for direction and amount filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Direction filter
    if (filters.direction !== 'all') {
      filtered = filtered.filter(t => t.direction === filters.direction);
    }

    // Amount filters
    if (filters.amount_min) {
      const min = parseFloat(filters.amount_min);
      filtered = filtered.filter(t => t.amount >= min);
    }
    if (filters.amount_max) {
      const max = parseFloat(filters.amount_max);
      filtered = filtered.filter(t => t.amount <= max);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.occurred_at).getTime();
          bValue = new Date(b.occurred_at).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, filters, sortBy, sortOrder]);

  const resetFilters = () => {
    setFilters({
      search: '',
      account_id: '',
      category_id: '',
      date_from: '',
      date_to: '',
      direction: 'all',
      amount_min: '',
      amount_max: ''
    });
  };

  const toggleTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedTransactions(new Set());
  };

  const handleBulkDelete = async () => {
    if (!currentHousehold || selectedTransactions.size === 0) return;

    if (!confirm(`Delete ${selectedTransactions.size} selected transactions? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedTransactions).map(id =>
        authenticatedFetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      
      setSelectedTransactions(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert('Failed to delete some transactions. Please try again.');
    }
  };

  const exportTransactions = () => {
    if (!filteredTransactions.length) return;

    const csvHeaders = ['Date', 'Description', 'Merchant', 'Account', 'Category', 'Amount', 'Type'];
    const csvRows = filteredTransactions.map(t => [
      new Date(t.occurred_at).toLocaleDateString(),
      t.description,
      t.merchant || '',
      t.account_name,
      t.primary_category_name || '',
      t.amount.toString(),
      t.direction
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'direction' ? value : value !== 'all'
  );

  if (isLoading && !transactions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredTransactions.length} transactions
            {hasActiveFilters && ` (filtered from ${transactions.length})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportTransactions}
            disabled={!filteredTransactions.length}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                {Object.entries(filters).filter(([key, value]) => 
                  key !== 'direction' ? value : value !== 'all'
                ).length}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={filters.account_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={filters.category_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.direction}
                onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value as any }))}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All transactions</option>
                <option value="outflow">Expenses only</option>
                <option value="inflow">Income only</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Min"
                    value={filters.amount_min}
                    onChange={(e) => setFilters(prev => ({ ...prev, amount_min: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Max"
                    value={filters.amount_max}
                    onChange={(e) => setFilters(prev => ({ ...prev, amount_max: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={resetFilters}
                className="btn-secondary w-full"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedTransactions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedTransactions.size} selected
            </span>
            <button
              onClick={deselectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Deselect all
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportTransactions}
              className="btn-secondary text-sm"
            >
              Export Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn-destructive text-sm"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: 'date', label: 'Date' },
              { key: 'amount', label: 'Amount' },
              { key: 'description', label: 'Description' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (sortBy === key) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(key as any);
                    setSortOrder('desc');
                  }
                }}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                  sortBy === key 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label} {sortBy === key && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={selectedTransactions.size > 0 ? deselectAll : selectAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {selectedTransactions.size > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first transaction'
              }
            </p>
            <div className="space-x-2">
              {hasActiveFilters && (
                <button onClick={resetFilters} className="btn-secondary">
                  Clear Filters
                </button>
              )}
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Add Transaction
              </button>
            </div>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              currency={currency}
              isSelected={selectedTransactions.has(transaction.id)}
              onToggleSelect={() => toggleTransaction(transaction.id)}
              onEdit={() => setEditingTransaction(transaction.id)}
              onDelete={async () => {
                if (confirm('Delete this transaction? This action cannot be undone.')) {
                  try {
                    await authenticatedFetch(`/api/transactions?id=${transaction.id}`, { method: 'DELETE' });
                    refetch();
                  } catch (error) {
                    alert('Failed to delete transaction');
                  }
                }
              }}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredTransactions.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading...
              </>
            ) : (
              'Load More Transactions'
            )}
          </button>
        </div>
      )}

      {/* Add Transaction Modal */}
      {currentHousehold && (
        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          householdId={currentHousehold.id}
          onSuccess={() => {
            refetch();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// Transaction Row Component
interface TransactionRowProps {
  transaction: any;
  currency: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionRow({ 
  transaction, 
  currency, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onDelete 
}: TransactionRowProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggleSelect}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isSelected && <Check size={12} />}
        </button>

        {/* Category Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
            {transaction.primary_category_icon || (transaction.direction === 'outflow' ? '💸' : '💰')}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
              <p className="text-sm text-gray-600">
                {transaction.merchant && `${transaction.merchant} • `}
                {formatDate(transaction.occurred_at)} • {transaction.account_name}
              </p>
              {transaction.primary_category_name && (
                <div className="flex items-center gap-1 mt-1">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{transaction.primary_category_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Amount */}
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.direction === 'outflow' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.direction === 'outflow' ? '-' : '+'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
              </div>

              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActions(false)}
                    />
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                      <button
                        onClick={() => {
                          onEdit();
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
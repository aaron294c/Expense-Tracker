// components/transactions/AddTransactionModal.tsx - Enhanced with full database integration
import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Plus, Minus, CreditCard, Building2, PiggyBank, Wallet } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { authenticatedFetch } from '../../lib/api';

interface Account {
  id: string;
  name: string;
  type: string;
  current_balance: number;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: 'expense' | 'income';
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  defaultDirection?: 'inflow' | 'outflow';
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const ACCOUNT_ICONS = {
  current: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet
};

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  householdId, 
  defaultDirection = 'outflow',
  onSuccess 
}: AddTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    merchant: '',
    direction: defaultDirection,
    category_id: '',
    occurred_at: new Date().toISOString().split('T')[0],
  });

  // Fetch accounts and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset form when opening
      setFormData({
        account_id: '',
        amount: '',
        description: '',
        merchant: '',
        direction: defaultDirection,
        category_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
      });
      setError(null);
    }
  }, [isOpen, householdId, defaultDirection]);

  const createDefaultCategories = async () => {
    const defaultCategories = [
      // Expense categories
      { name: 'Food & Dining', kind: 'expense', icon: '🍽️', color: '#F59E0B' },
      { name: 'Transportation', kind: 'expense', icon: '🚗', color: '#3B82F6' },
      { name: 'Shopping', kind: 'expense', icon: '🛍️', color: '#EC4899' },
      { name: 'Entertainment', kind: 'expense', icon: '🎬', color: '#8B5CF6' },
      { name: 'Bills & Utilities', kind: 'expense', icon: '⚡', color: '#EF4444' },
      { name: 'Healthcare', kind: 'expense', icon: '🏥', color: '#10B981' },
      // Income categories
      { name: 'Salary', kind: 'income', icon: '💼', color: '#059669' },
      { name: 'Freelance', kind: 'income', icon: '💻', color: '#0EA5E9' },
      { name: 'Investment', kind: 'income', icon: '📈', color: '#7C3AED' },
      { name: 'Other Income', kind: 'income', icon: '💰', color: '#059669' }
    ];

    try {
      const promises = defaultCategories.map((category, index) => 
        authenticatedFetch(`/api/categories?household_id=${householdId}`, {
          method: 'POST',
          body: JSON.stringify({ ...category, position: index }),
        })
      );
      
      const results = await Promise.all(promises);
      const createdCategories = results.map(result => result.data);
      setCategories(createdCategories);
    } catch (err) {
      console.error('Error creating default categories:', err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch accounts and categories in parallel
      const [accountsData, categoriesData] = await Promise.all([
        authenticatedFetch(`/api/accounts?household_id=${householdId}`),
        authenticatedFetch(`/api/categories?household_id=${householdId}`)
      ]);

      setAccounts(accountsData.data || []);
      setCategories(categoriesData.data || []);

      // Create default categories if none exist
      if (!categoriesData.data || categoriesData.data.length === 0) {
        await createDefaultCategories();
      }

      // Auto-select first account if available
      if (accountsData.data?.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accountsData.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id || !formData.amount || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const transactionData = {
        account_id: formData.account_id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        merchant: formData.merchant || undefined,
        direction: formData.direction,
        occurred_at: formData.occurred_at,
        categories: formData.category_id ? [{
          category_id: formData.category_id,
          weight: 1.0
        }] : undefined
      };

      await authenticatedFetch(`/api/transactions?household_id=${householdId}`, {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      // Success!
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const incrementAmount = () => {
    const current = parseFloat(formData.amount) || 0;
    setFormData(prev => ({ ...prev, amount: (current + 1).toString() }));
  };

  const decrementAmount = () => {
    const current = parseFloat(formData.amount) || 0;
    if (current > 1) {
      setFormData(prev => ({ ...prev, amount: (current - 1).toString() }));
    }
  };

  if (!isOpen) return null;

  // Filter categories by transaction direction
  const currentCategories = categories.filter(category => {
    if (formData.direction === 'outflow') {
      return category.kind === 'expense';
    } else {
      return category.kind === 'income';
    }
  });
  const selectedAccount = accounts.find(a => a.id === formData.account_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-6 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600">Loading accounts and categories...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!isLoading && !error && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Transaction Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'outflow', category_id: '' }))}
                  className={`p-3 rounded-lg border text-center transition-colors flex items-center justify-center gap-2 ${
                    formData.direction === 'outflow'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Minus size={16} />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'inflow', category_id: '' }))}
                  className={`p-3 rounded-lg border text-center transition-colors flex items-center justify-center gap-2 ${
                    formData.direction === 'inflow'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus size={16} />
                  Income
                </button>
              </div>
            </div>

            {/* Amount with Quick Buttons */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    onClick={decrementAmount}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={incrementAmount}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                Account *
              </label>
              <select
                id="account"
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => {
                  const IconComponent = ACCOUNT_ICONS[account.type as keyof typeof ACCOUNT_ICONS] || Building2;
                  return (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type}) - ${account.current_balance?.toFixed(2) || '0.00'}
                    </option>
                  );
                })}
              </select>
              {selectedAccount && (
                <p className="mt-1 text-sm text-gray-500">
                  Current balance: ${selectedAccount.current_balance?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What was this for?"
                required
              />
            </div>

            {/* Merchant (Optional) */}
            <div>
              <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
                Merchant (Optional)
              </label>
              <input
                id="merchant"
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Store or company name"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              {currentCategories.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {currentCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        category_id: prev.category_id === category.id ? '' : category.id 
                      }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.category_id === category.id
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs font-medium">{category.name}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Tag size={24} className="mx-auto mb-2" />
                  <p className="text-sm">No {formData.direction === 'outflow' ? 'expense' : 'income'} categories available</p>
                  <p className="text-xs mt-1">You can add categories in Settings</p>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="date"
                  type="date"
                  value={formData.occurred_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 text-gray-600 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors flex items-center justify-center ${
                  formData.direction === 'outflow'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
                disabled={isSubmitting || !formData.account_id || !formData.amount || !formData.description}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  `Add ${formData.direction === 'outflow' ? 'Expense' : 'Income'}`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
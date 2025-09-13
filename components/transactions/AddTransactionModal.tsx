// components/transactions/AddTransactionModal.tsx - WORKING transaction form with guaranteed submit
import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Plus, Minus, CreditCard, Building2, PiggyBank, Wallet } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { authenticatedFetch } from '../../lib/api';

interface Account {
  account_id: string;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
      setSuccessMessage(null);
    }
  }, [isOpen, householdId, defaultDirection]);

  // Auto-select first account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id && isOpen) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].account_id }));
    }
  }, [accounts, formData.account_id, isOpen]);

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

      console.log('Fetched accounts:', accountsData.data);
      console.log('Fetched categories:', categoriesData.data);

      setAccounts(accountsData.data || []);
      setCategories(categoriesData.data || []);

      // Create default categories if none exist
      if (!categoriesData.data || categoriesData.data.length === 0) {
        await createDefaultCategories();
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
    
    console.log('Form submitted:', formData);
    
    if (!formData.account_id || !formData.amount || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
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

      console.log('Submitting transaction:', transactionData);

      const result = await authenticatedFetch(`/api/transactions-fixed?household_id=${householdId}`, {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      console.log('Transaction created:', result);
      
      // Show immediate success feedback
      setSuccessMessage(`🎉 ${formData.direction === 'outflow' ? 'Expense' : 'Income'} of $${formData.amount} added successfully! Transaction saved to your account.`);
      
      // Trigger success callback immediately for data refresh
      onSuccess?.();
      
      // Reset form for "add another" functionality
      setFormData({
        account_id: accounts.length > 0 ? accounts[0].account_id : '',
        amount: '',
        description: '',
        merchant: '',
        direction: formData.direction,
        category_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
      });
      
      // Close modal after success message is shown
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
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
  const selectedAccount = accounts.find(a => a.account_id === formData.account_id);

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-3xl bg-white border border-gray-100 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
        <div className="mx-auto my-2 h-1.5 w-10 rounded-full bg-gray-300"></div>
        <div className="max-h-[85dvh] overflow-y-auto px-4 pb-24">
          <div className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-[20px] font-semibold text-gray-900">Add Transaction</h2>
              <p className="text-[13px] text-gray-500">Record your expense or income</p>
            </div>
            <button
              onClick={onClose}
              className="size-9 rounded-xl grid place-items-center text-gray-600 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
              aria-label="Close modal"
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

          {/* Success Message */}
          {successMessage && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
                {!isLoading && (
                  <button
                    onClick={fetchData}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          {!isLoading && (
          <form 
            onSubmit={handleSubmit} 
            className="p-6 space-y-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmitting && formData.account_id && formData.amount && formData.description) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          >
            {/* Expense/Income Segmented Control */}
            <div>
              <label className="block text-[13px] text-gray-500 mb-3">Transaction Type</label>
              <div className="inline-flex rounded-xl bg-gray-50 p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'outflow', category_id: '' }))}
                  className={`px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${
                    formData.direction === 'outflow'
                      ? 'bg-white shadow font-semibold text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, direction: 'inflow', category_id: '' }))}
                  className={`px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${
                    formData.direction === 'inflow'
                      ? 'bg-white shadow font-semibold text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-[13px] text-gray-500 mb-3">
                Amount *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                placeholder="0.00"
                required
              />

              {/* Quick Amount Chips */}
              <div className="flex gap-2 flex-wrap mt-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-[14px] bg-white hover:bg-gray-50"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection */}
            <div>
              <label htmlFor="account" className="block text-[13px] text-gray-500 mb-3">
                Account *
              </label>
              <select
                id="account"
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                required
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.name} ({account.type}) - ${account.current_balance?.toFixed(2) || '0.00'}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="mt-1 text-[12px] text-gray-500">
                  Current balance: ${selectedAccount.current_balance?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-[13px] text-gray-500 mb-3">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                placeholder="What was this for?"
                required
              />
            </div>

            {/* Merchant (Optional) */}
            <div>
              <label htmlFor="merchant" className="block text-[13px] text-gray-500 mb-3">
                Merchant (Optional)
              </label>
              <input
                id="merchant"
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                placeholder="Store or company name"
              />
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-[13px] text-gray-500 mb-3">
                Category (Optional)
              </label>
              {currentCategories.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {currentCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        category_id: prev.category_id === category.id ? '' : category.id
                      }))}
                      className={`size-[64px] rounded-xl bg-white ring-1 ring-gray-100 shadow-inner grid place-items-center hover:shadow transition-all duration-200 cursor-pointer ${
                        formData.category_id === category.id
                          ? 'ring-2 ring-blue-400/70 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]'
                          : ''
                      }`}
                    >
                      <span className="size-6">{category.icon}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-[13px] text-gray-500 mb-4">No categories yet</p>
                  <p className="text-[12px] text-gray-400">
                    Categories will be created automatically
                  </p>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-[13px] text-gray-500 mb-3">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={formData.occurred_at}
                onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
                required
              />
            </div>

          <div className="sticky bottom-0 left-0 right-0 -mx-4 rounded-t-2xl bg-white border-t border-gray-100 px-4 py-3 mt-6">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 text-white py-3 text-[15px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !formData.account_id || !formData.amount || !formData.description}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Adding...
                </div>
              ) : (
                `Add ${formData.direction === 'outflow' ? 'Expense' : 'Income'}`
              )}
            </button>
          </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
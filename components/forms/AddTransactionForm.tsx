// components/forms/AddTransactionForm.tsx - Complete form with react-hook-form + zod
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, DollarSign, Plus, Minus, CreditCard, Building2, PiggyBank, Wallet } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { authenticatedFetch } from '../../lib/api';
import { useHousehold } from '../../hooks/useHousehold';

// Zod schema for form validation
const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  account_id: z.string().min(1, 'Account is required'),
  description: z.string().min(1, 'Description is required').max(255),
  merchant: z.string().max(255).optional(),
  category_id: z.string().optional(),
  occurred_at: z.string().min(1, 'Date is required'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

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

interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: 'expense' | 'income';
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const ACCOUNT_ICONS = {
  current: Building2,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet
};

export function AddTransactionForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultType = 'expense' 
}: AddTransactionFormProps) {
  const { currentHousehold } = useHousehold();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      account_id: '',
      description: '',
      merchant: '',
      category_id: '',
      occurred_at: new Date().toISOString().split('T')[0],
    }
  });

  const watchType = watch('type');
  const watchAmount = watch('amount');

  // Fetch accounts and categories when modal opens
  useEffect(() => {
    if (isOpen && currentHousehold?.id) {
      fetchData();
      setError(null);
    }
  }, [isOpen, currentHousehold?.id]);

  // Auto-select first account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !watch('account_id')) {
      setValue('account_id', accounts[0].id);
    }
  }, [accounts, setValue, watch]);

  const fetchData = async () => {
    if (!currentHousehold?.id) return;
    
    setIsLoading(true);
    try {
      const [accountsData, categoriesData] = await Promise.all([
        authenticatedFetch(`/api/accounts?household_id=${currentHousehold.id}`),
        authenticatedFetch(`/api/categories?household_id=${currentHousehold.id}`)
      ]);

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

  const createDefaultCategories = async () => {
    if (!currentHousehold?.id) return;

    const defaultCategories = [
      { name: 'Food & Dining', kind: 'expense', icon: '🍽️', color: '#F59E0B' },
      { name: 'Transportation', kind: 'expense', icon: '🚗', color: '#3B82F6' },
      { name: 'Shopping', kind: 'expense', icon: '🛍️', color: '#EC4899' },
      { name: 'Entertainment', kind: 'expense', icon: '🎬', color: '#8B5CF6' },
      { name: 'Bills & Utilities', kind: 'expense', icon: '⚡', color: '#EF4444' },
      { name: 'Healthcare', kind: 'expense', icon: '🏥', color: '#10B981' },
      { name: 'Salary', kind: 'income', icon: '💼', color: '#059669' },
      { name: 'Freelance', kind: 'income', icon: '💻', color: '#0EA5E9' },
      { name: 'Investment', kind: 'income', icon: '📈', color: '#7C3AED' },
      { name: 'Other Income', kind: 'income', icon: '💰', color: '#059669' }
    ];

    try {
      const promises = defaultCategories.map((category, index) => 
        authenticatedFetch(`/api/categories?household_id=${currentHousehold.id}`, {
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

  const onSubmit = async (data: TransactionFormData) => {
    if (!currentHousehold?.id) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const transactionData = {
        account_id: data.account_id,
        amount: data.amount,
        description: data.description,
        merchant: data.merchant || undefined,
        direction: data.type === 'expense' ? 'outflow' : 'inflow',
        occurred_at: data.occurred_at,
        categories: data.category_id ? [{
          category_id: data.category_id,
          weight: 1.0
        }] : undefined
      };

      await authenticatedFetch(`/api/transactions?household_id=${currentHousehold.id}`, {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });

      // Show success message (you can add a toast here)
      console.log('Transaction created successfully!');
      
      if (saveAndAddAnother) {
        // Reset form but keep modal open
        reset({
          type: data.type, // Keep same type
          amount: 0,
          account_id: data.account_id, // Keep same account
          description: '',
          merchant: '',
          category_id: '',
          occurred_at: new Date().toISOString().split('T')[0],
        });
        setSaveAndAddAnother(false);
      } else {
        // Close modal
        reset();
        onClose();
      }
      
      onSuccess?.();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount, { shouldValidate: true });
  };

  const currentCategories = categories.filter(category => 
    category.kind === watchType
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Add {watchType === 'expense' ? 'Expense' : 'Income'}
          </h2>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
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
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Transaction Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('type', 'expense', { shouldValidate: true })}
                  className={`p-3 rounded-lg border text-center transition-colors flex items-center justify-center gap-2 ${
                    watchType === 'expense'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Minus size={16} />
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'income', { shouldValidate: true })}
                  className={`p-3 rounded-lg border text-center transition-colors flex items-center justify-center gap-2 ${
                    watchType === 'income'
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
                  {...register('amount', { valueAsNumber: true })}
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
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
                {...register('account_id')}
                id="account"
                className={`w-full py-3 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.account_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type}) - ${account.current_balance?.toFixed(2) || '0.00'}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                {...register('description')}
                id="description"
                type="text"
                className={`w-full py-3 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="What was this for?"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Merchant (Optional) */}
            <div>
              <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
                Merchant (Optional)
              </label>
              <input
                {...register('merchant')}
                id="merchant"
                type="text"
                className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Store or company name"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category (Optional)
              </label>
              {currentCategories.length > 0 ? (
                <select
                  {...register('category_id')}
                  id="category"
                  className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {currentCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
                  <p className="text-sm">No {watchType} categories available</p>
                  <p className="text-xs mt-1">Categories will be created automatically</p>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  {...register('occurred_at')}
                  id="date"
                  type="date"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.occurred_at ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.occurred_at && (
                <p className="mt-1 text-sm text-red-600">{errors.occurred_at.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 bg-white pt-6 border-t space-y-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 text-gray-600 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors flex items-center justify-center ${
                    watchType === 'expense'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50`}
                  disabled={isSubmitting || !isValid}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    `Add ${watchType === 'expense' ? 'Expense' : 'Income'}`
                  )}
                </button>
              </div>
              
              {/* Save & Add Another */}
              <button
                type="submit"
                onClick={() => setSaveAndAddAnother(true)}
                className="w-full py-2 px-4 text-sm text-blue-600 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting && saveAndAddAnother ? 'Saving...' : 'Save & Add Another'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
// pages/transactions/new.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import type { API, TransactionDirection, CategoryKind } from '@/types/app.contracts';

export default function NewTransactionPage() {
  const router = useRouter();
  const { user, currentHousehold, isLoading: authLoading } = useAuth();
  const { createTransaction } = useTransactions(currentHousehold?.id || null);
  const { accounts } = useAccounts(currentHousehold?.id || null);
  const { categories } = useCategories(currentHousehold?.id || null);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    merchant: '',
    direction: 'outflow' as TransactionDirection,
    account_id: '',
    occurred_at: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    categories: [] as { category_id: string; weight: number }[]
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Quick amount buttons
  const quickAmounts = [5, 10, 25, 50, 100];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Set default account
  useEffect(() => {
    if (accounts.length > 0 && !formData.account_id) {
      setFormData(prev => ({ ...prev, account_id: accounts[0].account_id }));
    }
  }, [accounts, formData.account_id]);

  if (authLoading || !user || !currentHousehold) {
    return <NewTransactionSkeleton />;
  }

  const expenseCategories = categories.filter(cat => cat.kind === 'expense');
  const incomeCategories = categories.filter(cat => cat.kind === 'income');
  const currentCategories = formData.direction === 'outflow' ? expenseCategories : incomeCategories;

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.account_id) {
      return;
    }

    setIsLoading(true);

    const transactionData: API.CreateTransactionRequest = {
      account_id: formData.account_id,
      occurred_at: formData.occurred_at,
      description: formData.description.trim(),
      merchant: formData.merchant.trim() || undefined,
      amount: parseFloat(formData.amount),
      direction: formData.direction,
      categories: selectedCategory ? [{ category_id: selectedCategory, weight: 1.0 }] : undefined
    };

    const success = await createTransaction(transactionData);
    setIsLoading(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleDirectionChange = (direction: TransactionDirection) => {
    setFormData(prev => ({ ...prev, direction }));
    setSelectedCategory(''); // Reset category when changing direction
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'groceries': '🛒',
      'dining': '🍽️',
      'transport': '🚗',
      'utilities': '💡',
      'rent': '🏠',
      'entertainment': '🎬',
      'shopping': '🛍️',
      'bills': '📄',
      'salary': '💰',
      'freelance': '💼',
      'investment': '📈',
      'gift': '🎁'
    };
    
    const key = categoryName.toLowerCase();
    return iconMap[key] || '📝';
  };

  if (showSuccess) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 flex-1 flex items-end">
        <div className="bg-white rounded-t-[28px] w-full flex flex-col min-h-[80vh] shadow-2xl">
          {/* Handle */}
          <div className="flex h-5 w-full items-center justify-center pt-2">
            <div className="h-1.5 w-10 rounded-full bg-gray-300"></div>
          </div>

          <div className="flex-1 px-4 pt-6 pb-6">
            {/* Amount Input */}
            <div className="px-2 mb-6">
              <div className="relative flex items-center justify-center">
                <span className="text-4xl font-light text-gray-400 self-start pt-1.5 pr-1">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border-none bg-transparent p-0 text-center text-[56px] font-light text-black placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 transition-transform hover:scale-105 active:scale-95"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Transaction Type Toggle */}
            <div className="flex mb-6 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => handleDirectionChange('outflow')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  formData.direction === 'outflow'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                💸 Expense
              </button>
              <button
                onClick={() => handleDirectionChange('inflow')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  formData.direction === 'inflow'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                💰 Income
              </button>
            </div>

            {/* Description Input */}
            <div className="px-2 mb-6">
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-xl border-none bg-gray-100 py-3.5 pl-4 pr-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                placeholder="Description (e.g., Coffee at Starbucks)"
              />
            </div>

            {/* Merchant Input */}
            <div className="px-2 mb-6">
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                className="w-full rounded-xl border-none bg-gray-100 py-3.5 pl-4 pr-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                placeholder="Merchant (optional)"
              />
            </div>

            {/* Account Selection */}
            <div className="px-2 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Account
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full rounded-xl border-none bg-gray-100 py-3.5 pl-4 pr-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.name} (${account.current_balance?.toLocaleString() || '0'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date/Time */}
            <div className="px-2 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.occurred_at}
                onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                className="w-full rounded-xl border-none bg-gray-100 py-3.5 pl-4 pr-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              />
            </div>

            {/* Categories */}
            <div className="px-2 mb-8">
              <h3 className="text-base font-semibold tracking-tight text-gray-700 uppercase mb-4">
                Category
              </h3>
              
              {currentCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No {formData.direction === 'outflow' ? 'expense' : 'income'} categories yet
                  </p>
                  <button
                    onClick={() => router.push('/categories')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Add categories
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {currentCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 ring-2 ring-blue-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <span className={`text-3xl ${
                        selectedCategory === category.id ? 'text-blue-500' : 'text-gray-600'
                      }`}>
                        {category.icon || getCategoryIcon(category.name)}
                      </span>
                      <p className={`text-xs font-medium text-center px-1 ${
                        selectedCategory === category.id ? 'text-blue-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {category.name}
                      </p>
                    </button>
                  ))}
                  
                  {/* Add Category Button */}
                  <button
                    onClick={() => router.push('/categories')}
                    className="flex h-[88px] flex-col items-center justify-center gap-y-2 rounded-2xl bg-gray-100 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-3xl text-gray-600">+</span>
                    <p className="text-xs font-medium text-gray-600">Add</p>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="px-2">
              <button
                onClick={handleSubmit}
                disabled={!formData.amount || !formData.description || !formData.account_id || isLoading}
                className="w-full bg-blue-500 text-white py-4 rounded-full text-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 hover:bg-blue-600"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </div>
                ) : (
                  `Add ${formData.direction === 'outflow' ? 'Expense' : 'Income'}`
                )}
              </button>
            </div>

            {/* Cancel Button */}
            <div className="text-center mt-4">
              <button
                onClick={() => router.back()}
                disabled={isLoading}
                className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Screen Component
function SuccessScreen() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-4xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Added!</h2>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

// Loading Skeleton
function NewTransactionSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-black/30 flex-1 flex items-end">
        <div className="bg-white rounded-t-[28px] w-full flex flex-col min-h-[80vh]">
          <div className="flex h-5 w-full items-center justify-center pt-2">
            <div className="h-1.5 w-10 rounded-full bg-gray-300"></div>
          </div>
          <div className="flex-1 px-4 pt-6 space-y-6">
            <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 w-16 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[88px] bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
// components/accounts/AddAccountModal.tsx
import React, { useState } from 'react';
import { authenticatedFetch } from '../../lib/api';
import { X, DollarSign, Building2, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  {
    value: 'current' as const,
    label: 'Checking Account',
    icon: Building2,
    description: 'For daily transactions and bills',
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    value: 'savings' as const,
    label: 'Savings Account',
    icon: PiggyBank,
    description: 'For saving money and earning interest',
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    value: 'credit' as const,
    label: 'Credit Card',
    icon: CreditCard,
    description: 'For credit purchases and building credit',
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    value: 'cash' as const,
    label: 'Cash',
    icon: Wallet,
    description: 'Physical cash on hand',
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  }
] as const;

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

type AccountType = 'current' | 'savings' | 'credit' | 'cash';

interface FormData {
  name: string;
  type: AccountType;
  initial_balance: string;
  currency: string;
}

export function AddAccountModal({ isOpen, onClose, householdId, onSuccess }: AddAccountModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'current',
    initial_balance: '',
    currency: 'USD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authenticatedFetch(`/api/accounts?household_id=${householdId}`, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          initial_balance: parseFloat(formData.initial_balance) || 0,
          currency: formData.currency
        }),
      });

      // Reset form
      setFormData({
        name: '',
        type: 'current',
        initial_balance: '',
        currency: 'USD'
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccountType = ACCOUNT_TYPES.find(type => type.value === formData.type);
  const selectedCurrency = CURRENCIES.find(curr => curr.code === formData.currency);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Account</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chase Checking, Emergency Fund"
              required
            />
          </div>

          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Type *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {ACCOUNT_TYPES.map((accountType) => {
                const Icon = accountType.icon;
                const isSelected = formData.type === accountType.value;
                
                return (
                  <button
                    key={accountType.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: accountType.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? accountType.color
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={24} />
                      <div>
                        <div className="font-medium">{accountType.label}</div>
                        <div className="text-sm opacity-80">{accountType.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">
                {selectedCurrency?.symbol}
              </span>
              <input
                id="balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: e.target.value }))}
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter the current balance of this account
            </p>
          </div>

          {/* Currency Selection */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

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
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
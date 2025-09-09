import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseBrowser';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Account {
  id: string;
  name: string;
  type: string;
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
  onSuccess?: () => void;
}

export function AddTransactionModal({ isOpen, onClose, householdId, onSuccess }: AddTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    merchant: '',
    direction: 'outflow' as 'inflow' | 'outflow',
    category_id: '',
    occurred_at: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, householdId]);

  const fetchData = async () => {
    try {
      const [accountsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('accounts')
          .select('*')
          .eq('household_id', householdId)
          .eq('is_archived', false),
        supabase
          .from('categories')
          .select('*')
          .eq('household_id', householdId)
          .order('name')
      ]);

      if (accountsResponse.data) setAccounts(accountsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.description) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          household_id: householdId,
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
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }
      
      // Reset form
      setFormData({
        account_id: '',
        amount: '',
        description: '',
        merchant: '',
        direction: 'outflow',
        category_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c.kind === 'expense');
  const incomeCategories = categories.filter(c => c.kind === 'income');
  const currentCategories = formData.direction === 'outflow' ? expenseCategories : incomeCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, direction: 'outflow', category_id: '' }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  formData.direction === 'outflow'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                💸 Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, direction: 'inflow', category_id: '' }))}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  formData.direction === 'inflow'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                💰 Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field pl-8"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
              Account *
            </label>
            <select
              id="account"
              value={formData.account_id}
              onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
              className="input-field"
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
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
              className="input-field"
              placeholder="What was this for?"
              required
            />
          </div>

          {/* Merchant */}
          <div>
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant (Optional)
            </label>
            <input
              id="merchant"
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
              className="input-field"
              placeholder="Where was this purchased?"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="input-field"
            >
              <option value="">Select category</option>
              {currentCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={formData.occurred_at}
              onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center"
              disabled={isSubmitting || !formData.account_id || !formData.amount || !formData.description}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

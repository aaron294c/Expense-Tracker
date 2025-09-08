import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useHousehold } from '../../hooks/useHousehold';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES, QUICK_AMOUNTS } from '../../utils/constants';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { currentHousehold } = useHousehold();
  const { createTransaction } = useTransactions(currentHousehold?.id || null);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [direction, setDirection] = useState<'inflow' | 'outflow'>('outflow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setSelectedCategory('');
      setDirection('outflow');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !selectedCategory || !currentHousehold) return;

    setIsSubmitting(true);
    try {
      // For demo purposes, use the first account (you'd normally let user select)
      const demoAccountId = '550e8400-e29b-41d4-a716-446655440002';
      
      await createTransaction({
        account_id: demoAccountId,
        description,
        amount: parseFloat(amount),
        direction,
        categories: [{
          category_id: selectedCategory,
          weight: 1.0
        }]
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const categories = direction === 'outflow' ? CATEGORIES.EXPENSE : CATEGORIES.INCOME;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <div className="text-center">
          <div className="relative flex items-center justify-center mb-4">
            <span className="text-4xl font-light text-gray-400 mr-2">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-5xl font-light text-center border-none bg-transparent focus:outline-none focus:ring-0 max-w-xs"
              step="0.01"
              required
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickAmount(quickAmount)}
              >
                ${quickAmount}
              </Button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="relative">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g., Starbucks coffee)"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Income/Expense Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setDirection('outflow')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              direction === 'outflow'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setDirection('inflow')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              direction === 'inflow'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Income
          </button>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center justify-center gap-2 h-20 rounded-2xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 ring-2 ring-blue-600 text-blue-600'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          disabled={!amount || !description || !selectedCategory}
        >
          Add {direction === 'outflow' ? 'Expense' : 'Income'}
        </Button>
      </form>
    </Modal>
  );
}

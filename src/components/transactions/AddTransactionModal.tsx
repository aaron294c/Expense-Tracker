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
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <form onSubmit={handleSubmit} className="modal-content space-y-4">
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
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g., Starbucks coffee)"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-200"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Income/Expense Segmented Control */}
        <div className="flex justify-center">
          <div className="segmented-control">
            <button
              type="button"
              onClick={() => setDirection('outflow')}
              className={`segmented-option motion-tap ${
                direction === 'outflow' ? 'active' : ''
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setDirection('inflow')}
              className={`segmented-option motion-tap ${
                direction === 'inflow' ? 'active' : ''
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-label font-medium uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`size-[64px] rounded-xl bg-white ring-1 ring-gray-100 shadow-inner grid place-items-center hover:shadow transition-all duration-200 ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-400/70' : ''
                }`}
              >
                <span className="text-xl">{category.icon}</span>
              </button>
            ))}
          </div>
          {selectedCategory && (
            <div className="mt-3 text-center">
              <span className="text-[14px] font-medium text-gray-700">
                {categories.find(cat => cat.id === selectedCategory)?.name}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!amount || !description || !selectedCategory || isSubmitting}
          className="w-full rounded-2xl py-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : `Add ${direction === 'outflow' ? 'Expense' : 'Income'}`}
        </button>
        </form>
      </div>
    </Modal>
  );
}

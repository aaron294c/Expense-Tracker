// components/forms/BasicTransactionForm.tsx - ABSOLUTELY BASIC FORM WITH GUARANTEED SUBMIT BUTTON
import React, { useState } from 'react';

interface BasicTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BasicTransactionForm({ isOpen, onClose }: BasicTransactionFormProps) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SUBMITTING TRANSACTION:', { type, amount, description });
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      alert(`SUCCESS: ${type} of $${amount} for "${description}" has been added!`);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '400px',
          maxWidth: '90vw'
        }}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          Add Transaction
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Type Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  padding: '12px 24px',
                  border: '2px solid',
                  borderColor: type === 'expense' ? '#ef4444' : '#d1d5db',
                  backgroundColor: type === 'expense' ? '#fef2f2' : 'white',
                  color: type === 'expense' ? '#dc2626' : '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                - Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  padding: '12px 24px',
                  border: '2px solid',
                  borderColor: type === 'income' ? '#10b981' : '#d1d5db',
                  backgroundColor: type === 'income' ? '#f0fdf4' : 'white',
                  color: type === 'income' ? '#059669' : '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                + Income
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Amount: *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="0.00"
            />
            
            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[5, 10, 25, 50, 100].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Description: *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="What was this for?"
            />
          </div>

          {/* SUBMIT BUTTONS - THIS IS THE CRITICAL PART */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '24px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !amount || !description}
              style={{
                flex: 1,
                padding: '12px 24px',
                backgroundColor: type === 'expense' ? '#dc2626' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting || !amount || !description ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                opacity: isSubmitting || !amount || !description ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Adding...' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
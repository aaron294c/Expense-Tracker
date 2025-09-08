import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
}

// Mock data - in real app this would come from API
const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Main Checking',
    type: 'checking',
    balance: 1234.56,
    currency: 'USD'
  },
  {
    id: '2',
    name: 'Emergency Savings',
    type: 'savings',
    balance: 5678.90,
    currency: 'USD'
  },
  {
    id: '3',
    name: 'Credit Card',
    type: 'credit',
    balance: -345.67,
    currency: 'USD'
  }
];

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking' as const, balance: 0 });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <BuildingLibraryIcon className="h-6 w-6" />;
      case 'savings':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'credit':
        return <CreditCardIcon className="h-6 w-6" />;
      default:
        return <BuildingLibraryIcon className="h-6 w-6" />;
    }
  };

  const startEditing = (accountId: string, currentBalance: number) => {
    setEditingAccount(accountId);
    setEditValue(Math.abs(currentBalance).toString());
  };

  const saveEdit = (accountId: string) => {
    const newBalance = parseFloat(editValue) || 0;
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, balance: account.type === 'credit' ? -Math.abs(newBalance) : newBalance }
        : account
    ));
    setEditingAccount(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setEditValue('');
  };

  const addAccount = () => {
    if (!newAccount.name.trim()) return;
    
    const account: Account = {
      id: Date.now().toString(),
      name: newAccount.name.trim(),
      type: newAccount.type,
      balance: newAccount.type === 'credit' ? -Math.abs(newAccount.balance) : newAccount.balance,
      currency: 'USD'
    };
    
    setAccounts(prev => [...prev, account]);
    setNewAccount({ name: '', type: 'checking', balance: 0 });
    setShowAddForm(false);
  };

  const totalAssets = accounts
    .filter(account => account.type !== 'credit')
    .reduce((sum, account) => sum + account.balance, 0);

  const totalDebt = accounts
    .filter(account => account.type === 'credit')
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const netWorth = totalAssets - totalDebt;

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h2>
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {formatCurrency(netWorth)}
        </p>
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <p className="text-gray-500">Assets</p>
            <p className="font-semibold text-green-600">{formatCurrency(totalAssets)}</p>
          </div>
          <div>
            <p className="text-gray-500">Debt</p>
            <p className="font-semibold text-red-600">{formatCurrency(totalDebt)}</p>
          </div>
        </div>
      </Card>

      {/* Add Account Button */}
      <Button
        onClick={() => setShowAddForm(true)}
        className="w-full"
        variant="secondary"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Account
      </Button>

      {/* Add Account Form */}
      {showAddForm && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Account</h3>
          <div className="space-y-4">
            <Input
              label="Account Name"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Chase Checking"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value as any }))}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            
            <Input
              label="Current Balance"
              type="number"
              value={newAccount.balance.toString()}
              onChange={(e) => setNewAccount(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              step="0.01"
            />
            
            <div className="flex gap-2">
              <Button onClick={addAccount} className="flex-1">
                Add Account
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Account List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                {getAccountIcon(account.type)}
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                <p className="font-semibold text-gray-900">{account.name}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {editingAccount === account.id ? (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 text-right text-xl font-semibold border-0 bg-transparent focus:ring-0"
                        step="0.01"
                        autoFocus
                      />
                    </div>
                    <Button size="sm" onClick={() => saveEdit(account.id)}>
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className={`text-xl font-semibold ${
                      account.balance < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatCurrency(account.balance)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => startEditing(account.id, account.balance)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// pages/accounts.tsx - Enhanced with full account management
import React, { useState } from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { useAccounts } from '../hooks/useAccounts';
import { useHousehold } from '../hooks/useHousehold';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';
import { authenticatedFetch } from '../lib/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Building2, 
  PiggyBank, 
  CreditCard, 
  Wallet, 
  Star,
  StarOff,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Account {
  account_id: string;
  household_id: string;
  name: string;
  type: string;
  current_balance: number;
  currency: string;
  is_archived: boolean;
  transaction_count: number;
  last_transaction_at?: string;
}

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account', icon: Building2 },
  { value: 'savings', label: 'Savings Account', icon: PiggyBank },
  { value: 'credit', label: 'Credit Card', icon: CreditCard },
  { value: 'cash', label: 'Cash/Wallet', icon: Wallet },
];

function AccountsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold || {}, 'USD');
  const { accounts, isLoading, refetch } = useAccounts(currentHousehold?.id || null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [defaultAccountId, setDefaultAccountId] = useState<string>('');

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalDebt = accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0);

  const netWorth = totalAssets - totalDebt;

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType?.icon || Building2;
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Archive this account? This will hide it from the list but preserve transaction history.')) {
      return;
    }

    try {
      await authenticatedFetch(`/api/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      refetch();
    } catch (error) {
      console.error('Error archiving account:', error);
      alert('Failed to archive account. Please try again.');
    }
  };

  const handleSetDefault = async (accountId: string) => {
    setDefaultAccountId(accountId);
    // In a real app, you'd save this to user preferences
    localStorage.setItem('defaultAccountId', accountId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-600 mt-1">{accounts.length} accounts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Sync
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {/* Net Worth Summary */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Net Worth</h2>
          <p className={`text-3xl font-bold mb-4 ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth, currency)}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-sm font-medium text-gray-700">Assets</span>
            </div>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(totalAssets, currency)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="text-red-500" size={20} />
              <span className="text-sm font-medium text-gray-700">Debt</span>
            </div>
            <p className="text-xl font-semibold text-red-600">{formatCurrency(totalDebt, currency)}</p>
          </div>
        </div>
      </Card>

      {/* Account List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.account_id}
            account={account}
            currency={currency}
            isDefault={defaultAccountId === account.account_id}
            onEdit={() => setEditingAccount(account)}
            onDelete={() => handleDeleteAccount(account.account_id)}
            onSetDefault={() => handleSetDefault(account.account_id)}
            getAccountIcon={getAccountIcon}
          />
        ))}

        {accounts.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
            <p className="text-gray-600 mb-6">Add your first account to start tracking expenses</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Account
            </button>
          </Card>
        )}
      </div>

      {/* Modals */}
      {currentHousehold && (
        <>
          <AddAccountModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            householdId={currentHousehold.id}
            onSuccess={() => {
              refetch();
              setShowAddModal(false);
            }}
          />
          
          {editingAccount && (
            <EditAccountModal
              isOpen={!!editingAccount}
              account={editingAccount}
              onClose={() => setEditingAccount(null)}
              onSuccess={() => {
                refetch();
                setEditingAccount(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Account Card Component
interface AccountCardProps {
  account: Account;
  currency: string;
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  getAccountIcon: (type: string) => any;
}

function AccountCard({ 
  account, 
  currency, 
  isDefault, 
  onEdit, 
  onDelete, 
  onSetDefault, 
  getAccountIcon 
}: AccountCardProps) {
  const [showActions, setShowActions] = useState(false);
  const IconComponent = getAccountIcon(account.type);

  const formatLastTransaction = (dateString?: string) => {
    if (!dateString) return 'No transactions';
    return `Last: ${new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Account Icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
          account.type === 'credit' ? 'bg-red-100 text-red-600' :
          account.type === 'savings' ? 'bg-green-100 text-green-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          <IconComponent size={24} />
        </div>

        {/* Account Details */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            {isDefault && (
              <Star className="text-yellow-500 fill-current" size={16} />
            )}
          </div>
          <p className="text-sm text-gray-500 capitalize">{account.type} account</p>
          <p className="text-xs text-gray-400">
            {account.transaction_count || 0} transactions • {formatLastTransaction(account.last_transaction_at)}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className={`text-xl font-semibold ${
            (account.current_balance || 0) < 0 
              ? 'text-red-600' 
              : account.type === 'credit'
                ? 'text-orange-600' 
                : 'text-gray-900'
          }`}>
            {formatCurrency(account.current_balance || 0, currency)}
          </p>
          {account.type === 'credit' && (
            <p className="text-xs text-gray-500">Available credit</p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <MoreHorizontal size={16} />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onSetDefault();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  {isDefault ? (
                    <>
                      <StarOff size={14} />
                      Remove Default
                    </>
                  ) : (
                    <>
                      <Star size={14} />
                      Set as Default
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Archive
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// Enhanced Add Account Modal
interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  onSuccess: () => void;
}

function AddAccountModal({ isOpen, onClose, householdId, onSuccess }: AddAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'current',
    initial_balance: '0',
    currency: 'USD'
  });

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

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chase Checking"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(({ value, label, icon: IconComponent }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value }))}
                  className={`p-4 rounded-lg border text-center transition-colors flex flex-col items-center gap-2 ${
                    formData.type === value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Balance
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current balance in this account
            </p>
          </div>

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
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Account Modal
interface EditAccountModalProps {
  isOpen: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

function EditAccountModal({ isOpen, account, onClose, onSuccess }: EditAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    currency: account.currency
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authenticatedFetch(`/api/accounts?id=${account.account_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          currency: formData.currency
        }),
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chase Checking"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(({ value, label, icon: IconComponent }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: value }))}
                  className={`p-4 rounded-lg border text-center transition-colors flex flex-col items-center gap-2 ${
                    formData.type === value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={24} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Balance</h4>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(account.current_balance || 0, account.currency)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Balance is calculated from transactions and cannot be edited directly
            </p>
          </div>

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
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <AuthWrapper>
      <AppLayout title="Accounts">
        <AccountsContent />
      </AppLayout>
    </AuthWrapper>
  );
}

// pages/accounts.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useAccounts } from '@/hooks/useAccounts';
import type { API, AccountType } from '@/types/app.contracts';

export default function AccountsPage() {
  const router = useRouter();
  const { user, currentHousehold, isLoading: authLoading } = useAuth();
  const { 
    accounts, 
    isLoading: accountsLoading, 
    error,
    createAccount,
    updateAccount,
    deleteAccount 
  } = useAccounts(currentHousehold?.id || null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || !currentHousehold) {
    return <AccountsSkeleton />;
  }

  const totalBalance = accounts.reduce((sum, account) => {
    if (account.type === 'credit') {
      return sum - (account.current_balance || 0);
    }
    return sum + (account.current_balance || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center p-4 pb-3 justify-between">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <span className="text-gray-600">←</span>
          </button>
          <h1 className="text-gray-900 text-xl font-semibold leading-tight tracking-tight flex-1 text-center">
            Accounts
          </h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center rounded-full h-10 w-10 text-gray-900 hover:bg-gray-100"
          >
            <span className="text-3xl">+</span>
          </button>
        </div>

        {/* Total Balance Summary */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-90">Total Net Worth</p>
            <p className="text-3xl font-bold">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {accountsLoading ? (
          <AccountCardsSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:text-blue-600"
            >
              Try again
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <EmptyAccounts onCreateAccount={() => setShowCreateModal(true)} />
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard 
                key={account.account_id} 
                account={account}
                isEditing={editingAccount === account.account_id}
                onEdit={() => setEditingAccount(account.account_id)}
                onCancelEdit={() => setEditingAccount(null)}
                onUpdate={updateAccount}
                onDelete={deleteAccount}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createAccount}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation currentPage="accounts" />
    </div>
  );
}

// Account Card Component
function AccountCard({ 
  account, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete 
}: {
  account: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, data: API.UpdateAccountRequest) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [name, setName] = useState(account.name);
  const [isLoading, setIsLoading] = useState(false);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'checking':
      case 'current':
        return '🏦';
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'cash':
        return '💵';
      default:
        return '🏦';
    }
  };

  const getAccountColor = (type: AccountType) => {
    switch (type) {
      case 'checking':
      case 'current':
        return 'bg-blue-100 text-blue-600';
      case 'savings':
        return 'bg-green-100 text-green-600';
      case 'credit':
        return 'bg-red-100 text-red-600';
      case 'cash':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleSave = async () => {
    if (name.trim() === account.name) {
      onCancelEdit();
      return;
    }

    setIsLoading(true);
    const success = await onUpdate(account.account_id, { name: name.trim() });
    setIsLoading(false);

    if (success) {
      onCancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${account.name}"?`)) return;
    
    setIsLoading(true);
    const success = await onDelete(account.account_id);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg size-12 flex items-center justify-center ${getAccountColor(account.type)}`}>
          <span className="text-2xl">{getAccountIcon(account.type)}</span>
        </div>
        
        <div className="flex-grow">
          <p className="text-gray-500 text-sm font-normal leading-normal capitalize">
            {account.type} Account
          </p>
          
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-gray-900 text-xl font-semibold leading-tight border border-gray-300 rounded px-2 py-1 flex-1"
                disabled={isLoading}
              />
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="text-blue-500 hover:text-blue-600 px-2 py-1"
              >
                Save
              </button>
              <button
                onClick={onCancelEdit}
                disabled={isLoading}
                className="text-gray-500 hover:text-gray-600 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-gray-900 text-xl font-semibold leading-tight">
                {account.name}
              </h3>
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        <div className="text-right">
          <p className={`text-2xl font-semibold leading-tight ${
            account.type === 'credit' ? 'text-red-600' : 'text-gray-900'
          }`}>
            {account.type === 'credit' && account.current_balance > 0 ? '-' : ''}
            ${Math.abs(account.current_balance || 0).toLocaleString('en-US', { 
              minimumFractionDigits: 2 
            })}
          </p>
          <p className="text-sm text-gray-500">
            {account.transaction_count || 0} transaction{account.transaction_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-500 hover:text-red-600 text-sm"
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}

// Create Account Modal
function CreateAccountModal({ 
  onClose, 
  onCreate 
}: {
  onClose: () => void;
  onCreate: (data: API.CreateAccountRequest) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as AccountType,
    initial_balance: 0,
    currency: 'USD'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    const success = await onCreate(formData);
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:w-96 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Account</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Main Checking"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AccountType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyAccounts({ onCreateAccount }: { onCreateAccount: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🏦</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No accounts yet</h3>
      <p className="text-gray-500 mb-6">Add your first account to start tracking your finances</p>
      <button
        onClick={onCreateAccount}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Add Account
      </button>
    </div>
  );
}

// Bottom Navigation Component
function BottomNavigation({ currentPage }: { currentPage: string }) {
  const router = useRouter();

  const navItems = [
    { icon: '🏠', label: 'Home', page: 'home', href: '/dashboard' },
    { icon: '📊', label: 'Insights', page: 'insights', href: '/insights' },
    { icon: '+', label: 'Add', page: 'add', href: '/transactions/new', isButton: true },
    { icon: '💳', label: 'Accounts', page: 'accounts', href: '/accounts' },
    { icon: '⚙️', label: 'Settings', page: 'settings', href: '/settings' },
  ];

  return (
    <nav className="bg-white border-t border-gray-100 fixed bottom-0 w-full">
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => (
          item.isButton ? (
            <div key={item.page} className="flex items-center justify-center w-1/5">
              <button
                onClick={() => router.push(item.href)}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
              >
                <span className="text-3xl">{item.icon}</span>
              </button>
            </div>
          ) : (
            <button
              key={item.page}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 w-1/5 transition-colors ${
                currentPage === item.page ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-medium">{item.label}</p>
            </button>
          )
        ))}
      </div>
    </nav>
  );
}

// Loading Skeletons
function AccountsSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function AccountCardsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-grow space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
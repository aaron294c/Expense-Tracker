// pages/accounts.tsx
import React from 'react';
import { AuthWrapper } from '../components/auth/AuthWrapper';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { useAccounts } from '../hooks/useAccounts';
import { useHousehold } from '../hooks/useHousehold';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, getCurrencyFromHousehold } from '../lib/utils';

function AccountsContent() {
  const { currentHousehold } = useHousehold();
  const currency = getCurrencyFromHousehold(currentHousehold, 'USD');
  const { accounts, isLoading } = useAccounts(currentHousehold?.id || null);

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const totalDebt = accounts
    .filter((a) => a.type === 'credit')
    .reduce((sum, a) => sum + Math.abs(a.current_balance || 0), 0);

  const netWorth = totalAssets - totalDebt;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'current': return '🏦';
      case 'savings': return '💰';
      case 'credit': return '💳';
      case 'cash': return '💵';
      default: return '🏦';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>

      {/* Net Worth Summary */}
      <Card className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h2>
        <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(netWorth, currency)}</p>
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <p className="text-gray-500">Assets</p>
            <p className="font-semibold text-green-600">{formatCurrency(totalAssets, currency)}</p>
          </div>
          <div>
            <p className="text-gray-500">Debt</p>
            <p className="font-semibold text-red-600">{formatCurrency(totalDebt, currency)}</p>
          </div>
        </div>
      </Card>

      {/* Account List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.account_id}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                {getAccountIcon(account.type)}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                <p className="font-semibold text-gray-900">{account.name}</p>
              </div>

              <div className="text-right">
                <p className={`text-xl font-semibold ${(account.current_balance || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(account.current_balance || 0, currency)}
                </p>
                <p className="text-xs text-gray-500">{account.transaction_count || 0} transactions</p>
              </div>
            </div>
          </Card>
        ))}

        {accounts.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-500 mb-4">No accounts found</p>
            <p className="text-sm text-gray-400">Accounts will appear here once they're set up</p>
          </Card>
        )}
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

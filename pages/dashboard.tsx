// pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonth } from '@/hooks/useMonth';
import { useCategorySummary } from '@/hooks/useCategorySummary';

export default function DashboardPage() {
  const router = useRouter();
  const { user, currentHousehold, isLoading: authLoading } = useAuth();
  const { currentMonth, monthDisplay } = useMonth();
  
  const { 
    data: budgetData, 
    isLoading: budgetLoading 
  } = useBudgets(currentHousehold?.id || null, currentMonth);
  
  const { 
    transactions, 
    isLoading: transactionsLoading 
  } = useTransactions(currentHousehold?.id || null, { limit: 5 });

  const {
    getTotalSpent,
    getTotalBudget,
    getBudgetUtilization,
    getTopCategories
  } = useCategorySummary(currentHousehold?.id || null, currentMonth);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || !currentHousehold) {
    return <DashboardSkeleton />;
  }

  const totalSpent = getTotalSpent();
  const totalBudget = getTotalBudget();
  const budgetUtilization = getBudgetUtilization();
  const topExpenses = getTopCategories('expense', 4);
  const burnRate = budgetData?.burn_rate;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center p-4 pb-2 justify-between bg-white sticky top-0">
        <div className="flex items-center gap-3">
          <img 
            alt="User avatar" 
            className="h-10 w-10 rounded-full object-cover bg-gray-200" 
            src={`https://ui-avatars.com/api/?name=${user.email}&background=random`}
          />
          <div>
            <p className="text-sm text-gray-500 font-medium">Hello,</p>
            <p className="font-bold text-gray-900 text-lg">
              {user.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
        <button className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full text-gray-500">
          <span className="text-2xl">🔔</span>
        </button>
      </header>

      <main className="flex-grow p-4 space-y-5">
        {/* Budget Overview Circle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Budget Overview</h2>
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
              <path 
                className="text-gray-100" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.8"
              />
              <path 
                className="text-blue-500 transition-all duration-1000 ease-out" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="currentColor" 
                strokeDasharray={`${budgetUtilization}, 100`}
                strokeLinecap="round" 
                strokeWidth="3.8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-light text-gray-900">
                ${totalSpent.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                of ${totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-500 text-xl">📈</span>
              <h3 className="text-sm font-semibold text-gray-500">Spending Velocity</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${burnRate?.daily_average?.toFixed(0) || '0'}/day
            </p>
            <p className="text-xs text-gray-500">
              vs ${burnRate?.suggested_daily_spend?.toFixed(0) || '0'}/day target
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Budget Forecast</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${burnRate?.projected_monthly_spend?.toFixed(0) || '0'}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right mt-0.5">by end of month</p>
          </div>
        </div>

        {/* Upcoming Bills (placeholder) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">Upcoming Bill</h3>
              <p className="text-lg font-bold text-gray-900">Netflix Subscription</p>
              <p className="text-sm text-gray-500">Due in 3 days - $15.99</p>
            </div>
            <button className="bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors">
              Pay Now
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4 px-2 text-gray-900">Recent Transactions</h2>
          <div className="space-y-3">
            {transactionsLoading ? (
              <TransactionsSkeleton />
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500">No transactions yet</p>
                <button 
                  onClick={() => router.push('/transactions/new')}
                  className="mt-2 text-blue-500 hover:text-blue-600"
                >
                  Add your first transaction
                </button>
              </div>
            ) : (
              transactions.slice(0, 4).map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 fixed bottom-0 w-full">
        <div className="flex justify-around items-center h-20 px-2">
          <NavItem icon="🏠" label="Home" active />
          <NavItem icon="📊" label="Insights" href="/insights" />
          <div className="flex items-center justify-center w-1/5">
            <button 
              onClick={() => router.push('/transactions/new')}
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <span className="text-3xl">+</span>
            </button>
          </div>
          <NavItem icon="💳" label="Accounts" href="/accounts" />
          <NavItem icon="⚙️" label="Settings" href="/settings" />
        </div>
      </nav>

      <div className="h-24" /> {/* Spacer for fixed nav */}
    </div>
  );
}

// Helper Components
function TransactionCard({ transaction }: { transaction: any }) {
  const router = useRouter();
  
  return (
    <div 
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/transactions/${transaction.id}`)}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
          {transaction.primary_category_icon ? (
            <span className="text-xl">{transaction.primary_category_icon}</span>
          ) : (
            <span className="text-xl">💳</span>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {transaction.merchant || transaction.description}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {transaction.primary_category_name || 'Uncategorized'}
          </p>
        </div>
        <p className={`font-bold ${
          transaction.direction === 'outflow' ? 'text-red-500' : 'text-green-500'
        }`}>
          {transaction.direction === 'outflow' ? '-' : '+'}${transaction.amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, active = false }: {
  icon: string;
  label: string;
  href?: string;
  active?: boolean;
}) {
  const router = useRouter();
  
  const handleClick = () => {
    if (href) router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-1 w-1/5 transition-colors ${
        active ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-xs font-medium">{label}</p>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-grow space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
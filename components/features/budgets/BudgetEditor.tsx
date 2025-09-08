// components/features/budgets/BudgetEditor.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBudgets } from '@/hooks/useBudgets';
import { PencilIcon, CheckIcon, XMarkIcon } from 'lucide-react';

interface BudgetEditorProps {
  householdId: string;
  month: string;
}

export function BudgetEditor({ householdId, month }: BudgetEditorProps) {
  const { data, isLoading, error, updateBudgets } = useBudgets(householdId, month);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (categoryId: string, currentAmount: number) => {
    setEditingCategory(categoryId);
    setEditValue(currentAmount.toString());
  };

  const handleSave = async (categoryId: string) => {
    const amount = parseFloat(editValue);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      await updateBudgets([{ category_id: categoryId, amount }]);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600" role="alert">Error loading budgets: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const expenseCategories = data?.categories.filter(cat => cat.category_kind === 'expense') || [];
  const totalBudget = expenseCategories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = expenseCategories.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Budget Overview</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                ${totalBudget.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Budgeted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSpent.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Spent</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(totalBudget - totalSpent).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {totalBudget - totalSpent >= 0 ? 'Remaining' : 'Over Budget'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Category Budgets</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {expenseCategories.map((category) => (
            <BudgetCategoryRow
              key={category.category_id}
              category={category}
              isEditing={editingCategory === category.category_id}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onEdit={() => handleEdit(category.category_id, category.budget)}
              onSave={() => handleSave(category.category_id)}
              onCancel={handleCancel}
              saving={saving}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface BudgetCategoryRowProps {
  category: any;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function BudgetCategoryRow({
  category,
  isEditing,
  editValue,
  onEditValueChange,
  onEdit,
  onSave,
  onCancel,
  saving
}: BudgetCategoryRowProps) {
  const progressPercentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  const isOverBudget = category.spent > category.budget;

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span 
              className="material-symbols-outlined text-lg"
              style={{ color: category.color }}
            >
              {category.icon}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{category.category_name}</h3>
            <p className="text-sm text-gray-500">
              ${category.spent.toFixed(2)} of ${category.budget.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                className="w-24 text-right"
                min="0"
                step="0.01"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave();
                  if (e.key === 'Escape') onCancel();
                }}
              />
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                aria-label="Save budget"
              >
                {saving ? <LoadingSpinner size="sm" /> : <CheckIcon className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={saving}
                aria-label="Cancel edit"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-gray-900">
                ${category.budget.toFixed(2)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                aria-label={`Edit budget for ${category.category_name}`}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{progressPercentage.toFixed(1)}% used</span>
          {isOverBudget && (
            <span className="text-red-600 font-medium">
              Over by ${(category.spent - category.budget).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// components/layout/AppLayout.tsx
import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { useHousehold } from '@/hooks/useHousehold';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNavigation?: boolean;
}

export function AppLayout({ children, title, showNavigation = true }: AppLayoutProps) {
  const { currentHousehold, isLoading } = useHousehold();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {title && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {currentHousehold && (
                <div className="text-sm text-gray-500">
                  {currentHousehold.name}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNavigation && <BottomNavigation />}
    </div>
  );
}

// components/layout/BottomNavigation.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  ChartBarIcon, 
  PlusIcon, 
  CreditCardIcon, 
  CogIcon 
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: HomeIcon, label: 'Home' },
  { href: '/insights', icon: ChartBarIcon, label: 'Insights' },
  { href: '/add', icon: PlusIcon, label: 'Add', isAction: true },
  { href: '/accounts', icon: CreditCardIcon, label: 'Accounts' },
  { href: '/settings', icon: CogIcon, label: 'Settings' },
];

export function BottomNavigation() {
  const router = useRouter();

  const handleAddClick = () => {
    // Open add transaction modal instead of navigating
    window.dispatchEvent(new CustomEvent('open-transaction-modal'));
  };

  return (
    <nav 
      className="bg-white border-t border-gray-200 px-4 py-2 sticky bottom-0"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;

          if (item.isAction) {
            return (
              <button
                key={item.href}
                onClick={handleAddClick}
                className="flex flex-col items-center p-2 text-white bg-blue-600 rounded-full -mt-6 shadow-lg hover:bg-blue-700 transition-colors"
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// README.md section for local setup
/*
# ExpenseTracker UI Refactor - Local Setup & Testing

## Environment Setup

1. **Install dependencies:**
```bash
npm install
npm install -D @playwright/test @axe-core/playwright
```

2. **Environment variables:**
Copy the provided `.env.local` values to your environment.

3. **Database setup:**
```bash
# Start Supabase locally
npm run db:start

# Run migrations
npm run db:push

# Seed demo data
npm run seed:demo
```

## Development Workflow

1. **Start development server:**
```bash
npm run dev
```

2. **Run tests:**
```bash
# E2E tests
npm run test:e2e

# Visual regression tests (update snapshots)
npm run test:visual-update

# Accessibility tests
npm run test:e2e -- --grep "accessibility"
```

## Demo User Login

- **Email:** test.user+ux@demo.local
- **Password:** demo-password-123
- **Household:** Demo Household (auto-assigned)

## Webhook Simulation

Since this is a budget tracking app (not a payment processor), webhook simulation would typically involve:

1. **Bank feed webhooks** (if connected to Plaid/similar):
```bash
curl -X POST http://localhost:3000/api/webhooks/bank-sync \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "550e8400-e29b-41d4-a716-446655440010",
    "transactions": [
      {
        "id": "tx_12345",
        "amount": 45.67,
        "description": "COFFEE SHOP PURCHASE",
        "date": "2025-01-15"
      }
    ]
  }'
```

2. **Budget alert webhooks**:
```bash
curl -X POST http://localhost:3000/api/webhooks/budget-alert \
  -H "Content-Type: application/json" \
  -d '{
    "household_id": "550e8400-e29b-41d4-a716-446655440001",
    "category_id": "550e8400-e29b-41d4-a716-446655440021",
    "threshold_percentage": 80,
    "current_spending": 240.50,
    "budget_amount": 300.00
  }'
```

## Testing the UI Changes

1. **Sign in with demo user**
2. **Navigate through all pages** to verify visual consistency
3. **Add a new transaction** to test the modal UX
4. **Edit budgets** to verify the inline editing experience
5. **Test responsive behavior** on mobile viewport
6. **Test keyboard navigation** throughout the app
7. **Run accessibility scanner** to verify WCAG compliance

## Production Checklist

- [ ] All design system components implemented
- [ ] Loading states added to all async operations
- [ ] Empty states with helpful CTAs
- [ ] Error boundaries with retry functionality
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Visual regression tests passing
- [ ] E2E tests covering critical paths
- [ ] Mobile responsiveness verified
- [ ] Performance metrics within targets
*/transactions/TransactionList.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTransactions } from '@/hooks/useTransactions';
import { PlusIcon, FilterIcon } from 'lucide-react';

interface TransactionListProps {
  householdId: string;
  limit?: number;
  showFilters?: boolean;
}

export function TransactionList({ householdId, limit, showFilters = false }: TransactionListProps) {
  const [filters, setFilters] = useState({});
  const { transactions, isLoading, error, hasMore, loadMore } = useTransactions(householdId, {
    limit,
    ...filters
  });

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600" role="alert">
            Failed to load transactions: {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={<PlusIcon className="h-12 w-12" />}
            title="No transactions yet"
            description="Start tracking your expenses by adding your first transaction."
            action={{
              label: "Add Transaction",
              onClick: () => {
                // Open transaction modal
                window.dispatchEvent(new CustomEvent('open-transaction-modal'));
              }
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <FilterIcon className="h-5 w-5 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value || undefined })}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {/* Categories would be populated from useCategories hook */}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="divide-y divide-gray-100">
          {transactions.map((transaction) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction}
            />
          ))}
          
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="text-blue-600 hover:underline disabled:opacity-50"
                aria-label="Load more transactions"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Load More'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionItem({ transaction }) {
  const amount = transaction.direction === 'outflow' ? -transaction.amount : transaction.amount;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: transaction.currency || 'USD'
  }).format(amount);

  return (
    <div 
      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
      role="listitem"
    >
      {/* Category Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
        {transaction.primary_category_icon ? (
          <span className="material-symbols-outlined text-xl text-gray-600">
            {transaction.primary_category_icon}
          </span>
        ) : (
          <span className="text-gray-400 text-lg">?</span>
        )}
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {transaction.merchant || transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {transaction.primary_category_name && (
            <span className="text-sm text-gray-500">
              {transaction.primary_category_name}
            </span>
          )}
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-500">
            {new Date(transaction.occurred_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`font-bold ${
          transaction.direction === 'outflow' 
            ? 'text-red-600' 
            : 'text-green-600'
        }`}>
          {transaction.direction === 'outflow' ? '-' : '+'}{formattedAmount}
        </p>
        <p className="text-sm text-gray-500">
          {transaction.account_name}
        </p>
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={60} />
      </div>
    </div>
  );
}

// components/features/
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/Lib/supabaseBrowser';
import { useCategorySummary } from '@/hooks/useCategorySummary';
import { useMonth } from '@/hooks/useMonth';

const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { currentMonth, monthDisplay, goToPreviousMonth, goToNextMonth } = useMonth();
  const { summaries, isLoading: summaryLoading, error: summaryError } = useCategorySummary(
    DEMO_HOUSEHOLD_ID,
    currentMonth
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalSpent = summaries
    .filter(s => s.category_kind === 'expense')
    .reduce((sum, s) => sum + s.spent, 0);

  const totalBudget = summaries
    .filter(s => s.category_kind === 'expense')
    .reduce((sum, s) => sum + s.budget, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">ExpenseTracker</h1>
              <p className="text-sm text-gray-500">Demo Household</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Previous
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{monthDisplay}</h2>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next →
          </button>
        </div>

        {summaryError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error loading data: {summaryError}</p>
          </div>
        )}

        {/* Budget Overview - Card Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Budget</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Spent</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Remaining</h3>
            <p className={`text-3xl font-bold ${
              totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Math.abs(totalBudget - totalSpent).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Categories - Card Style */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {summaries
                .filter(s => s.category_kind === 'expense')
                .map((category) => (
                  <div key={category.category_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.category_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{category.category_name}</h4>
                        <p className="text-sm text-gray-600">
                          ${category.spent.toFixed(2)} of ${category.budget.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900 mb-1">
                        {category.budget > 0 ? Math.round((category.spent / category.budget) * 100) : 0}%
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            category.spent > category.budget ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((category.spent / category.budget) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

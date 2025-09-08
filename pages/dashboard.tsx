import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={() => {
              // Add sign out functionality
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </header>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Budget Overview</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">$1,250</div>
              <div className="text-sm text-gray-500">of $2,000 budget</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
            <div className="text-center text-gray-500">
              <p>No transactions yet</p>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Transactions() {
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
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Your transactions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

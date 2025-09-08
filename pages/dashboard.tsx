// pages/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return <Dashboard />;
}
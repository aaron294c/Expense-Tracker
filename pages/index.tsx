// pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import AuthComponent from '@/components/auth/AuthComponent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return <AuthComponent />;
}
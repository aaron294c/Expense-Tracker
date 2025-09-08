import React from 'react';
import { Navigation } from './ui/Navigation';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../components/auth/AuthProvider';
import { useRouter } from 'next/router';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  title?: string;
}

export function Layout({ children, showNavigation = true, title }: LayoutProps) {
  const { user } = useAuth();
  const { currentHousehold, isLoading } = useHousehold();
  const router = useRouter();

  // Show loading while checking auth/household
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated (except on auth pages)
  if (!user && !router.pathname.includes('/login') && !router.pathname.includes('/setup')) {
    router.push('/login');
    return null;
  }

  // Redirect to setup if authenticated but no household (except on auth pages)
  if (user && !currentHousehold && !router.pathname.includes('/setup') && !router.pathname.includes('/login')) {
    router.push('/setup');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {title && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-lg mx-auto px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        </header>
      )}
      
      <main className={clsx(
        'max-w-lg mx-auto min-h-screen',
        showNavigation && 'pb-20'
      )}>
        {children}
      </main>
      
      {showNavigation && <Navigation />}
    </div>
  );
}

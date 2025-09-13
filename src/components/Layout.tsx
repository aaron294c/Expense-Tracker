import React from 'react';
import { Navigation } from './ui/Navigation';
import { useHousehold } from '../../hooks/useHousehold';
import { useAuth } from '../../components/auth/AuthProvider';
import { useRouter } from 'next/router';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f7f8fa] to-white">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand/20 border-t-brand"></div>
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
    <div className="min-h-screen bg-gradient-to-b from-[#f7f8fa] to-white">
      {title && (
        <header className="glass-header sticky top-0 z-30 safe-area-top">
          <div className="mx-auto max-w-[480px] px-4 py-3">
            <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-gray-900">{title}</h1>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-[480px] px-4 pt-3 pb-[96px] overflow-x-hidden">
        {children}
      </main>

      {showNavigation && <Navigation />}
    </div>
  );
}

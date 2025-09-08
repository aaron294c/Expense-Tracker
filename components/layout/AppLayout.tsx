import React from 'react';
import { Navigation } from '@/components/common/Navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <Navigation />
    </div>
  );
}

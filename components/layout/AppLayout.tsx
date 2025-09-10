// components/layout/AppLayout.tsx
import React from 'react';
import Head from 'next/head';
import { Navigation } from '@/components/common/Navigation'; // named export
// If you want user info in the layout, import from the real provider:
// import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  title?: string;
  showNavigation?: boolean; // default true; pass false for modals / wizards
  children: React.ReactNode;
}

export function AppLayout({ title, showNavigation = true, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Head>
        <title>{title ? `${title} · Expense Tracker` : 'Expense Tracker'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="max-w-md mx-auto">{children}</main>

      {showNavigation && <Navigation />}
    </div>
  );
}

// components/layout/AppLayout.tsx
import React from 'react';
import Head from 'next/head';
import { Navigation } from '../common/Navigation'; // named export
// If you want user info in the layout, import from the real provider:
// import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  title?: string;
  showNavigation?: boolean; // default true; pass false for modals / wizards
  children: React.ReactNode;
}

export function AppLayout({ title, showNavigation = true, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f8fa] to-white">
      <Head>
        <title>{title ? `${title} · Expense Tracker` : 'Expense Tracker'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Page Header */}
      <header className="page-header">
        <div className="header-inner">
          <h1 className="header-title">{title || 'Expense Tracker'}</h1>
        </div>
      </header>
      
      {/* Main Content with Screen Container */}
      <main className="screen-container">
        {children}
      </main>
      
      {showNavigation && <Navigation />}
    </div>
  );
}

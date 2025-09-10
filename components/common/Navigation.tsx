// components/common/Navigation.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const items = [
  { href: '/dashboard',   label: 'Dashboard',   icon: '🏠' },
  { href: '/transactions',label: 'Transactions',icon: '💳' },
  { href: '/budgets',     label: 'Budgets',     icon: '📊' },
  { href: '/settings',    label: 'Settings',    icon: '⚙️' },
];

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around">
        {items.map((item) => {
          const active = router.pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

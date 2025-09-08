import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Insights', href: '/insights' },
  { name: 'Add', href: '/transactions/add', isAction: true },
  { name: 'Accounts', href: '/accounts' },
  { name: 'Settings', href: '/settings' },
];

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16 px-4">
        {navigation.map((item) => {
          const isActive = router.pathname === item.href;
          
          if (item.isAction) {
            return (
              <Link key={item.name} href={item.href}>
                <div className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg transform transition-transform active:scale-95">
                  <span className="text-2xl">+</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              <div className={clsx(
                'flex flex-col items-center justify-center gap-1 w-16 h-16 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}>
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

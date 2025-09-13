import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import { Home, BarChart3, Plus, CreditCard, Settings } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Add', href: '/transactions/add', isAction: true, icon: Plus },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[480px] rounded-t-2xl bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="h-[68px] grid grid-cols-5 relative">
        {navigation.map((item, index) => {
          const isActive = router.pathname === item.href;
          const IconComponent = item.icon;

          if (item.isAction) {
            return (
              <div key={item.name} className="flex items-center justify-center relative">
                <Link href={item.href}>
                  <div className="absolute -top-8 size-[68px] rounded-full bg-[#2563eb] text-white grid place-items-center ring-6 ring-white shadow-[0_16px_36px_rgba(37,99,235,0.45)] active:scale-95 transition">
                    <IconComponent size={28} />
                  </div>
                </Link>
              </div>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              <div className="flex flex-col items-center justify-center gap-1 relative h-full">
                {isActive && (
                  <div className="absolute top-1 h-1 w-8 rounded-full bg-blue-600/80" />
                )}
                <IconComponent
                  size={20}
                  className={clsx(
                    'transition-all duration-200',
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  )}
                />
                <span className={clsx(
                  'text-[10px] font-medium mt-0.5',
                  isActive ? 'text-blue-600' : 'text-gray-600 opacity-80'
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// components/common/Navigation.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, CreditCard, Target, TrendingUp, Settings } from 'lucide-react';

const items = [
  { href: '/dashboard',    label: 'Home',        icon: Home },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/budgets',      label: 'Budgets',     icon: Target },
  { href: '/insights',     label: 'Insights',    icon: TrendingUp },
  { href: '/settings',     label: 'Settings',    icon: Settings },
];

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="bottom-dock">
      <div className="dock-grid">
        {items.map((item) => {
          const active = router.pathname === item.href || 
                          (item.href === '/dashboard' && router.pathname === '/');
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dock-item motion-tap ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <IconComponent className="dock-icon" />
              <span className="dock-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

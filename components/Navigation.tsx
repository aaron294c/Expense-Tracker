// /components/Navigation.tsx
import Link from 'next/link'
import { useRouter } from 'next/router'

const navItems = [
  {
    href: '/dashboard',
    icon: 'home',
    label: 'Home',
  },
  {
    href: '/insights',
    icon: 'bar_chart',
    label: 'Insights',
  },
  {
    href: '/transactions/new',
    icon: 'add',
    label: 'Add',
    isButton: true,
  },
  {
    href: '/accounts',
    icon: 'account_balance_wallet',
    label: 'Accounts',
  },
  {
    href: '/rules',
    icon: 'settings',
    label: 'Rules',
  },
]

export default function Navigation() {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const isActive = router.pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href)
          
          if (item.isButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-3xl">
                  {item.icon}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-16 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <span 
                className={`material-symbols-outlined text-2xl ${
                  isActive ? 'font-variation-settings-fill-1' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
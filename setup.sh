#!/bin/bash

# Create the complete directory structure for the expense tracker app
echo "Creating directory structure..."

# Create main directories
mkdir -p components/{auth,common,layout}
mkdir -p lib
mkdir -p pages/api/{budgets,rules,setup,transactions}
mkdir -p pages/auth
mkdir -p src/types
mkdir -p styles
mkdir -p supabase/{migrations,seeds}

# Fix the lib files first
echo "Creating lib/supabaseBrowser.ts..."
cat > lib/supabaseBrowser.ts << 'EOF'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export const supabase = createClientComponentClient<Database>();
EOF

echo "Creating lib/supabaseServer.ts..."
cat > lib/supabaseServer.ts << 'EOF'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/src/types/supabase';

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};
EOF

# Create the types file
echo "Creating src/types/supabase.ts..."
cat > src/types/supabase.ts << 'EOF'
export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          settings: any;
          base_currency: string;
        };
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['households']['Insert']>;
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          joined_at: string;
          invited_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['household_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['household_members']['Insert']>;
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: 'cash' | 'current' | 'credit' | 'savings';
          initial_balance: number;
          currency: string;
          created_at: string;
          is_archived: boolean;
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          kind: 'expense' | 'income';
          icon: string;
          color: string;
          created_at: string;
          position: number;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          user_id: string;
          occurred_at: string;
          description: string;
          merchant: string | null;
          amount: number;
          direction: 'inflow' | 'outflow';
          currency: string;
          attachment_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      transaction_categories: {
        Row: {
          id: string;
          transaction_id: string;
          category_id: string;
          weight: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transaction_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transaction_categories']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          period_id: string;
          category_id: string;
          amount: number;
          rollover_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      budget_periods: {
        Row: {
          id: string;
          household_id: string;
          month: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budget_periods']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['budget_periods']['Insert']>;
      };
      categorization_rules: {
        Row: {
          id: string;
          household_id: string;
          match_type: 'merchant_exact' | 'merchant_contains' | 'description_contains';
          match_value: string;
          category_id: string;
          priority: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categorization_rules']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categorization_rules']['Insert']>;
      };
    };
    Views: {
      v_recent_transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          account_name: string;
          user_id: string;
          occurred_at: string;
          description: string;
          merchant: string | null;
          amount: number;
          direction: 'inflow' | 'outflow';
          currency: string;
          attachment_url: string | null;
          created_at: string;
          categories: Array<{
            category_id: string;
            category_name: string;
            icon: string;
            color: string;
            weight: number;
          }>;
          primary_category_name: string;
          primary_category_icon: string;
        };
      };
      v_account_balances: {
        Row: {
          account_id: string;
          household_id: string;
          name: string;
          type: string;
          initial_balance: number;
          currency: string;
          is_archived: boolean;
          current_balance: number;
          transaction_count: number;
          last_transaction_at: string | null;
        };
      };
      v_monthly_category_summary: {
        Row: {
          household_id: string;
          month: string;
          category_id: string;
          category_name: string;
          kind: string;
          budget: number;
          spent: number;
          remaining: number;
          rollover_enabled: boolean;
        };
      };
      v_simple_burn_rate: {
        Row: {
          household_id: string;
          month: string;
          daily_average: number;
          days_remaining: number;
          projected_total: number;
        };
      };
    };
  };
}
EOF

# Create auth components
echo "Creating components/auth/AuthProvider.tsx..."
cat > components/auth/AuthProvider.tsx << 'EOF'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseBrowser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
EOF

echo "Creating components/auth/AuthComponent.tsx..."
cat > components/auth/AuthComponent.tsx << 'EOF'
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function AuthComponent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else if (isSignUp) {
        setMessage('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ExpenseTracker</h1>
          <p className="text-gray-600">Track your expenses, achieve your goals</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isSignUp ? 'Get started with your expense tracking' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Create common components
echo "Creating components/common/LoadingSpinner.tsx..."
cat > components/common/LoadingSpinner.tsx << 'EOF'
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`} />
    </div>
  );
}
EOF

echo "Creating components/common/ErrorBoundary.tsx..."
cat > components/common/ErrorBoundary.tsx << 'EOF'
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry, but something went wrong. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
EOF

echo "Creating components/common/Navigation.tsx..."
cat > components/common/Navigation.tsx << 'EOF'
import React from 'react';
import { useRouter } from 'next/router';
import { Home, CreditCard, PieChart, Settings } from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, href: '/transactions' },
  { id: 'budgets', label: 'Budgets', icon: PieChart, href: '/budgets' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
EOF

# Create layout components
echo "Creating components/layout/AppLayout.tsx..."
cat > components/layout/AppLayout.tsx << 'EOF'
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
EOF

# Create pages
echo "Creating pages/_app.tsx..."
cat > pages/_app.tsx << 'EOF'
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      </AuthProvider>
    </ErrorBoundary>
  );
}
EOF

echo "Creating pages/index.tsx..."
cat > pages/index.tsx << 'EOF'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import AuthComponent from '@/components/auth/AuthComponent';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return <AuthComponent />;
}
EOF

echo "Creating pages/auth/callback.tsx..."
cat > pages/auth/callback.tsx << 'EOF'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseBrowser';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          router.push('/?error=auth_callback_error');
          return;
        }

        if (data.session) {
          // Try to join demo household
          try {
            const response = await fetch('/api/setup/demo', {
              method: 'POST',
            });
            
            if (!response.ok) {
              console.warn('Could not join demo household');
            }
          } catch (err) {
            console.warn('Demo setup failed:', err);
          }

          router.push('/dashboard');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
EOF

echo "Creating pages/dashboard.tsx..."
cat > pages/dashboard.tsx << 'EOF'
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={() => {
              // Add sign out functionality
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </header>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Budget Overview</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">$1,250</div>
              <div className="text-sm text-gray-500">of $2,000 budget</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
            <div className="text-center text-gray-500">
              <p>No transactions yet</p>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Create styles
echo "Creating styles/globals.css..."
cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    @apply font-sans;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
  
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
  
  .nav-item {
    @apply flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700;
  }
  
  .nav-item.active {
    @apply text-blue-600;
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-in-out;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
EOF

# Create package.json dependencies
echo "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "expense-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.39.3",
    "lucide-react": "^0.263.1",
    "next": "14.0.4",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.0.4",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
EOF

# Create TypeScript config
echo "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Create Tailwind config
echo "Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
EOF

# Create PostCSS config
echo "Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create Next.js config
echo "Creating next.config.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false,
  },
}

module.exports = nextConfig
EOF

# Create environment file template
echo "Creating .env.local.example..."
cat > .env.local.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: For production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Create README with setup instructions
echo "Creating README.md..."
cat > README.md << 'EOF'
# Expense Tracker App

A modern expense tracking application built with Next.js, TypeScript, and Supabase.

## Features

- User authentication with Supabase Auth
- Household-based expense tracking
- Budget management
- Transaction categorization
- Automated categorization rules
- Real-time updates
- Responsive design

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase project URL and keys.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Set up Supabase (if using local development):**
   ```bash
   cd supabase
   npx supabase start
   ```

## Project Structure

```
├── components/
│   ├── auth/          # Authentication components
│   ├── common/        # Reusable UI components
│   └── layout/        # Layout components
├── lib/               # Utility functions and configs
├── pages/             # Next.js pages
│   └── api/           # API routes
├── src/types/         # TypeScript type definitions
├── styles/            # Global styles
└── supabase/          # Supabase configuration and migrations
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for API routes)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## API Routes

- `/api/transactions` - Transaction CRUD operations
- `/api/budgets` - Budget management
- `/api/rules` - Categorization rules
- `/api/setup/demo` - Demo data setup

## Authentication

The app uses Supabase Auth with email/password authentication. Users are automatically redirected to the dashboard after successful authentication.

## Database Schema

The app uses the following main tables:
- `households` - Household information
- `household_members` - User-household relationships
- `accounts` - Financial accounts
- `transactions` - Individual transactions
- `categories` - Expense/income categories
- `budgets` - Budget allocations
- `categorization_rules` - Auto-categorization rules

Views are used for complex queries:
- `v_recent_transactions` - Recent transactions with category info
- `v_account_balances` - Account balances and statistics
- `v_monthly_category_summary` - Monthly spending by category

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
EOF

# Create additional page stubs for completeness
echo "Creating pages/transactions.tsx..."
cat > pages/transactions.tsx << 'EOF'
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Transactions() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Your transactions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo "Creating pages/budgets.tsx..."
cat > pages/budgets.tsx << 'EOF'
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Budgets() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Manage your spending limits</p>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">
            <p>No budgets set</p>
            <p className="text-sm mt-2">Create your first budget to start tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

echo "Creating pages/settings.tsx..."
cat > pages/settings.tsx << 'EOF'
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Settings() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </header>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Account</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

# Create .gitignore
echo "Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Supabase
supabase/.branches
supabase/.temp
.env.keys
EOF

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📁 Created complete file structure with:"
echo "   - Fixed import paths (@/lib/supabaseBrowser)"
echo "   - Proper TypeScript configuration"
echo "   - Complete component structure"
echo "   - Authentication flow"
echo "   - API routes (already provided)"
echo "   - Tailwind CSS setup"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm install"
echo "   2. Copy .env.local.example to .env.local and fill in your Supabase credentials"
echo "   3. Run: npm run dev"
echo ""
echo "💡 Your Supabase environment variables should look like:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"

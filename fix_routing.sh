#!/bin/bash

echo "🔧 Fixing routing and CSS issues..."

# Step 1: Fix the CSS file
echo "📄 Fixing styles/globals.css..."
cat > styles/globals.css << 'CSS_EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'SF Pro Display', system-ui, sans-serif;
  }
  
  body {
    @apply text-gray-900 bg-gray-50;
  }
}

@layer components {
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .card {
    @apply bg-white rounded-xl border border-gray-100 shadow-sm;
  }
  
  .section-header {
    @apply text-lg font-semibold text-gray-900 mb-4;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-100 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors;
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

@layer utilities {
  .animate-counter {
    animation: counter 1.5s ease-out forwards;
  }
  
  @keyframes counter {
    from {
      --value: 0;
    }
    to {
      --value: 100;
    }
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
CSS_EOF

# Step 2: Fix pages/_app.tsx
echo "📄 Fixing pages/_app.tsx..."
cat > pages/_app.tsx << 'APP_EOF'
import type { AppProps } from 'next/app';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { supabase } from '../lib/supabaseBrowser';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </SessionContextProvider>
    </ErrorBoundary>
  );
}
APP_EOF

# Step 3: Fix pages/index.tsx
echo "📄 Fixing pages/index.tsx..."
cat > pages/index.tsx << 'INDEX_EOF'
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
INDEX_EOF

echo "✅ CSS and routing fixes applied!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Check for any remaining import errors"
echo "   3. Verify the app loads correctly"

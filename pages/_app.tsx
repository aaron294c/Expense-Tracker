// pages/_app.tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Component {...pageProps} />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
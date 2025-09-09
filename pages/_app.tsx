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

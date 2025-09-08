import type { AppProps } from 'next/app';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { AuthProvider } from '../../components/auth/AuthProvider';
import { createClient } from '../lib/supabaseBrowser';
import '../styles/globals.css';

const supabase = createClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SessionContextProvider>
  );
}

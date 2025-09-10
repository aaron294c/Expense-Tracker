// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      console.log('[Auth] getSession...');
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('[Auth] getSession error:', error);
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setIsLoading(false);

      const sub = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s ?? null);
        setUser(s?.user ?? null);
        setIsLoading(false);

        // Single-redirect guard to avoid double navigations in dev
        if (!redirectedRef.current) {
          if (s?.user && (router.pathname === '/' || router.pathname === '/login')) {
            redirectedRef.current = true;
            router.replace('/dashboard');
          } else if (!s?.user && !['/login', '/'].includes(router.pathname)) {
            redirectedRef.current = true;
            router.replace('/login');
          }
        }
      });
      unsub = sub.data.subscription;
    })();

    return () => {
      console.log('[Auth] cleanup subscription');
      unsub?.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('[Auth] signIn error:', error);
    else console.log('[Auth] signIn ok:', data.user?.id);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('[Auth] signUp', email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) console.error('[Auth] signUp error:', error);
    else console.log('[Auth] signUp ok:', data.user?.id);
    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] signOut', user?.id);
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    console.log('[Auth] resetPassword', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) console.error('[Auth] reset error:', error);
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

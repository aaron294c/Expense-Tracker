// components/auth/AuthProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = useSupabaseClient();
  const user = useUser();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    isLoading: false,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

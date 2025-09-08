// hooks/useAuth.ts
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { API, Hooks } from '@/types/app.contracts';

interface AuthContextType extends Hooks.UseAuthReturn {}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthLogic();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function useAuthLogic(): Hooks.UseAuthReturn {
  const [user, setUser] = useState<API.SessionResponse['user']>(null);
  const [households, setHouseholds] = useState<API.SessionResponse['households']>([]);
  const [currentHousehold, setCurrentHousehold] = useState<API.SessionResponse['currentHousehold']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const sessionData: API.SessionResponse = await response.json();
      
      setUser(sessionData.user);
      setHouseholds(sessionData.households);
      setCurrentHousehold(sessionData.currentHousehold);

    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
      setUser(null);
      setHouseholds([]);
      setCurrentHousehold(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sign in failed');
      }

      const sessionData: API.SessionResponse = await response.json();
      
      setUser(sessionData.user);
      setHouseholds(sessionData.households);
      setCurrentHousehold(sessionData.currentHousehold);

      return true;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      setUser(null);
      setHouseholds([]);
      setCurrentHousehold(null);

    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  }, []);

  const switchHousehold = useCallback((householdId: string) => {
    const household = households.find(h => h.household_id === householdId);
    if (household?.households) {
      setCurrentHousehold(household.households);
      // Optionally persist this choice in localStorage or cookie
      localStorage.setItem('currentHouseholdId', householdId);
    }
  }, [households]);

  // Initialize session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setHouseholds([]);
          setCurrentHousehold(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchSession();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchSession]);

  // Restore household preference on load
  useEffect(() => {
    if (households.length > 0 && !currentHousehold) {
      const savedHouseholdId = localStorage.getItem('currentHouseholdId');
      if (savedHouseholdId) {
        const household = households.find(h => h.household_id === savedHouseholdId);
        if (household?.households) {
          setCurrentHousehold(household.households);
        }
      }
    }
  }, [households, currentHousehold]);

  return {
    user,
    households,
    currentHousehold,
    isLoading,
    error,
    signIn,
    signOut,
    switchHousehold
  };
}
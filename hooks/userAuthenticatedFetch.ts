// hooks/useAuthenticatedFetch.ts - Custom hook for authenticated requests
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useAuthenticatedFetch() {
  const { user } = useAuth();

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get fresh session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No valid session');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }, [user]);

  return authenticatedFetch;
}
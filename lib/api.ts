// lib/api.ts - Create authenticated API utility
import { supabase } from './supabaseBrowser';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('No valid session found');
  }

  // Add auth header to all requests
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
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
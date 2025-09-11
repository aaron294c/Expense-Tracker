// lib/api.ts
import { supabase } from './supabaseBrowser';

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Try to get the current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[API] Session error:', error);
    throw new Error('Authentication error');
  }
  
  if (!session?.access_token) {
    console.error('[API] No session or access token found');
    throw new Error('Missing bearer token');
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // future-proof if you later use cookies
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }

  if (!response.ok) {
    const msg =
      body?.details || body?.message || body?.error || `HTTP ${response.status}`;
    const err = new Error(msg);
    (err as any).response = { status: response.status, body };
    throw err;
  }

  return body;
}

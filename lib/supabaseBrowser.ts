// lib/supabaseBrowser.ts - Unified browser client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../supabase/types/database.types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`);
}

// Create and export the client
export function createClient() {
  return createClientComponentClient<Database>();
}

// Default client instance
export const supabase = createClient();

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase browser client initialized:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
}
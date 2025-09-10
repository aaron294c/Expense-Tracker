// lib/supabaseServer.ts - Unified server client
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../supabase/types/database.types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// For API routes - creates client with request context
export const createServerSupabaseClient = (
  context: { req: NextApiRequest; res: NextApiResponse }
) => {
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', [
            `${name}=${value}; ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join('; ')}`
          ]);
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', [
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join('; ')}`
          ]);
        },
      },
    }
  );
};

// Service role client for admin operations
export const createServiceSupabaseClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service operations');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase server clients configured:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey
  });
}
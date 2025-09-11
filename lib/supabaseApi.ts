// lib/supabaseApi.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient as createCookieClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getUserAndSupabase(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (token) {
    // Use the user's JWT so RLS applies as the user
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { user: null, supabase: null, error: 'Unauthorized' };
    return { user, supabase, error: null };
  }

  // Fallback to cookie-based auth
  const supabase = createCookieClient({ req, res });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase: null, error: 'Unauthorized' };
  return { user, supabase, error: null };
}

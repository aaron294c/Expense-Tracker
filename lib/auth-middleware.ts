// lib/auth-middleware.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/types/database.types';

export type AuthenticatedRequest = NextApiRequest & {
  user: { id: string; email: string | null };
  supabase: SupabaseClient<Database>;
};

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (!supabaseUrl || !anonKey) {
        console.error('Missing Supabase env vars');
        return res.status(500).json({ error: 'Server misconfigured: Supabase env vars missing' });
      }

      // Prefer Bearer token (your client sends it)
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      if (!token) {
        return res.status(401).json({ error: 'Missing bearer token' });
      }

      // Create a client that will execute queries AS THIS USER (RLS applies)
      const supabase = createClient<Database>(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      // Validate token → get user
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      (req as AuthenticatedRequest).user = {
        id: data.user.id,
        email: data.user.email ?? null,
      };
      (req as AuthenticatedRequest).supabase = supabase;

      return (handler as any)(req, res);
    } catch (err: any) {
      console.error('withAuth error:', err);
      return res.status(500).json({ error: 'Auth middleware failure' });
    }
  };
}

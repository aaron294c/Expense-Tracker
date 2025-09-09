// lib/auth-middleware.ts - Centralized auth middleware
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from './supabaseServer';

export interface AuthenticatedRequest extends NextApiRequest {
  user: any;
  supabase: any;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const supabase = createServerSupabaseClient({ req, res });
      
      // Get user from the session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Authentication failed', details: error.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'No authenticated user found' });
      }

      // Add user and supabase to request
      (req as AuthenticatedRequest).user = user;
      (req as AuthenticatedRequest).supabase = supabase;

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
}
// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/supabase/types/database.types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });

  try {
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(200).json({
        user: null,
        households: [],
        currentHousehold: null
      });
    }

    // Get user's household memberships with household details
    const { data: memberships, error: membershipError } = await supabase
      .from('household_members')
      .select(`
        *,
        households (*)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      return res.status(500).json({ error: 'Failed to fetch household memberships' });
    }

    // Determine current household (first one or from session/cookie)
    let currentHousehold = null;
    if (memberships && memberships.length > 0) {
      // You could extend this to remember last selected household in session/cookie
      currentHousehold = memberships[0].households;
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email || ''
      },
      households: memberships || [],
      currentHousehold
    });

  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// pages/api/auth/signin.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/supabase/types/database.types';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export default async function signInHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = signInSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: validation.error.flatten() 
    });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password
    });

    if (error) {
      console.error('Sign in error:', error);
      return res.status(401).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Get user's household memberships
    const { data: memberships } = await supabase
      .from('household_members')
      .select(`
        *,
        households (*)
      `)
      .eq('user_id', data.user.id)
      .order('joined_at', { ascending: false });

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email || ''
      },
      households: memberships || [],
      currentHousehold: memberships?.[0]?.households || null
    });

  } catch (error) {
    console.error('Sign in API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// pages/api/auth/signout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/supabase/types/database.types';

export default async function signOutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return res.status(500).json({ error: 'Failed to sign out' });
    }

    return res.status(200).json({ message: 'Signed out successfully' });

  } catch (error) {
    console.error('Sign out API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
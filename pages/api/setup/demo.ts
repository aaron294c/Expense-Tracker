// pages/api/setup/demo.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user is already a member of the demo household
    const { data: existingMembership } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return res.status(200).json({ message: 'Already a member of demo household' });
    }

    // Add user to the demo household
    const { error: membershipError } = await supabase
      .from('household_members')
      .insert({
        household_id: DEMO_HOUSEHOLD_ID,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      });

    if (membershipError) {
      console.error('Error adding user to demo household:', membershipError);
      return res.status(500).json({ error: 'Failed to join demo household' });
    }

    return res.status(200).json({ message: 'Successfully joined demo household' });
  } catch (error) {
    console.error('Demo setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
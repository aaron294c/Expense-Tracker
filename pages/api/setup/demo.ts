// /pages/api/setup/demo.ts
// Helper API to join the demo household after signup
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

    // Check if user is already a member of any household
    const { data: existingMembership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return res.status(200).json({ 
        message: 'User already has household membership',
        household_id: existingMembership.household_id
      });
    }

    // Add user to demo household as owner
    const { data: membership, error: membershipError } = await supabase
      .from('household_members')
      .insert({
        household_id: DEMO_HOUSEHOLD_ID,
        user_id: user.id,
        role: 'owner'
      })
      .select('*')
      .single();

    if (membershipError) {
      console.error('Error creating household membership:', membershipError);
      return res.status(500).json({ error: 'Failed to join demo household' });
    }

    // Update demo transactions to be owned by this user
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ user_id: user.id })
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .is('user_id', null);

    if (updateError) {
      console.error('Error updating transaction ownership:', updateError);
      // Don't fail the request - membership was successful
    }

    return res.status(200).json({
      message: 'Successfully joined demo household',
      membership,
      demo_transactions_updated: !updateError
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
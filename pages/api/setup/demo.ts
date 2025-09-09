
// 2. Updated API endpoint with better error handling
// pages/api/setup/demo.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });

  try {
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Authentication failed', details: authError.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'No authenticated user found' });
    }

    console.log('Demo setup for user:', user.id, user.email);

    // Check if demo household exists
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('id, name')
      .eq('id', DEMO_HOUSEHOLD_ID)
      .single();

    if (householdError) {
      console.error('Household lookup error:', householdError);
      
      // If household doesn't exist, create it
      if (householdError.code === 'PGRST116') {
        console.log('Creating demo household...');
        const { error: createError } = await supabase
          .from('households')
          .insert({
            id: DEMO_HOUSEHOLD_ID,
            name: 'Demo Household',
            base_currency: 'USD'
          });

        if (createError) {
          console.error('Failed to create household:', createError);
          return res.status(500).json({ error: 'Failed to create demo household', details: createError.message });
        }
      } else {
        return res.status(500).json({ error: 'Database error', details: householdError.message });
      }
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('household_members')
      .select('id, role')
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .eq('user_id', user.id)
      .single();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      console.error('Membership check error:', membershipCheckError);
      return res.status(500).json({ error: 'Failed to check membership', details: membershipCheckError.message });
    }

    if (existingMembership) {
      console.log('User already a member with role:', existingMembership.role);
      return res.status(200).json({ 
        message: 'Already a member of demo household',
        membership: existingMembership 
      });
    }

    // Add user to the demo household
    console.log('Adding user to demo household...');
    const { data: newMembership, error: membershipError } = await supabase
      .from('household_members')
      .insert({
        household_id: DEMO_HOUSEHOLD_ID,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (membershipError) {
      console.error('Error adding user to demo household:', membershipError);
      return res.status(500).json({ 
        error: 'Failed to join demo household', 
        details: membershipError.message 
      });
    }

    console.log('Successfully added user to demo household');

    // Verify the membership was created
    const { data: verifyMembership, error: verifyError } = await supabase
      .from('household_members')
      .select(`
        *,
        households (*)
      `)
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .eq('user_id', user.id)
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
    } else {
      console.log('Membership verified:', verifyMembership);
    }

    return res.status(200).json({ 
      message: 'Successfully joined demo household',
      membership: newMembership
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
// pages/api/households.ts - Create missing household endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Get user's households
      const { data: memberships, error } = await supabase
        .from('household_members')
        .select(`
          *,
          households (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching households:', error);
        return res.status(500).json({ error: 'Failed to fetch households' });
      }

      const households = (memberships || [])
        .map(m => ({
          ...m.households,
          role: m.role,
          joined_at: m.joined_at
        }))
        .filter(Boolean);

      return res.status(200).json({ data: households });
    }

    if (req.method === 'POST') {
      const { name, base_currency = 'USD' } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Household name is required' });
      }

      // Create the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          base_currency
        })
        .select()
        .single();

      if (householdError) {
        console.error('Error creating household:', householdError);
        return res.status(500).json({ error: 'Failed to create household' });
      }

      // Add the user as the owner
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding user to household:', memberError);
        // Try to clean up the household if adding member fails
        await supabase.from('households').delete().eq('id', household.id);
        return res.status(500).json({ error: 'Failed to create household membership' });
      }

      return res.status(201).json({ data: household });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
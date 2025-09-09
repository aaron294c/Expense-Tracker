// pages/api/household-members.ts - Create missing household members endpoint
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
      const { household_id } = req.query;

      if (!household_id) {
        return res.status(400).json({ error: 'household_id is required' });
      }

      // Check if user is a member of this household
      const { data: membership } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', household_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this household' });
      }

      // Get all members
      const { data: members, error } = await supabase
        .from('household_members')
        .select(`
          *,
          households (name, base_currency)
        `)
        .eq('household_id', household_id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching household members:', error);
        return res.status(500).json({ error: 'Failed to fetch household members' });
      }

      return res.status(200).json({ data: members });
    }

    if (req.method === 'POST') {
      const { household_id, user_id, role = 'viewer' } = req.body;

      if (!household_id || !user_id) {
        return res.status(400).json({ error: 'household_id and user_id are required' });
      }

      // Check if current user has permission to add members
      const { data: currentMembership } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', household_id)
        .eq('user_id', user.id)
        .single();

      if (!currentMembership || currentMembership.role !== 'owner') {
        return res.status(403).json({ error: 'Only household owners can add members' });
      }

      // Add the member
      const { data: newMember, error } = await supabase
        .from('household_members')
        .insert({
          household_id,
          user_id,
          role,
          invited_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding household member:', error);
        if (error.code === '23505') {
          return res.status(409).json({ error: 'User is already a member of this household' });
        }
        return res.status(500).json({ error: 'Failed to add household member' });
      }

      return res.status(201).json({ data: newMember });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
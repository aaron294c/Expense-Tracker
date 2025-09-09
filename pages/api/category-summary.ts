// pages/api/category-summary.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { household_id, month } = req.query;

  if (!household_id || !month) {
    return res.status(400).json({ error: 'household_id and month are required' });
  }

  try {
    // Get monthly category summary from the view
    const { data: summaries, error } = await supabase
      .from('v_monthly_category_summary')
      .select('*')
      .eq('household_id', household_id)
      .eq('month', month)
      .order('spent', { ascending: false });

    if (error) {
      console.error('Error fetching category summaries:', error);
      return res.status(500).json({ error: 'Failed to fetch category summaries' });
    }

    return res.status(200).json({ 
      summaries: summaries || [] 
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
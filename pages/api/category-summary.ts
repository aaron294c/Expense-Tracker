import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { household_id, month } = req.query;

  if (!household_id || !month) {
    return res.status(400).json({ error: 'Missing household_id or month' });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });

  try {
    const { data: summaries, error } = await supabase
      .from('v_monthly_category_summary')
      .select('*')
      .eq('household_id', household_id)
      .eq('month', month)
      .order('category_name');

    if (error) {
      console.error('Error fetching summaries:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    return res.status(200).json({ summaries });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

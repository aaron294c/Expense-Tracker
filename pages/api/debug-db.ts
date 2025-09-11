// Debug API to test database connection and tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserAndSupabase } from '@/lib/supabaseApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check
  const { user, supabase, error } = await getUserAndSupabase(req, res);
  if (error || !user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const debug = {
      user_id: user.id,
      user_email: user.email,
      tables: {},
      household: null,
      error: null
    };

    // Check household membership
    const { data: householdMember } = await supabase
      .from('household_members')
      .select('household_id, households(id, name)')
      .eq('user_id', user.id)
      .single();

    debug.household = householdMember;

    // Check if tables exist
    const tables = ['budget_periods', 'budgets', 'categories', 'households', 'household_members'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        debug.tables[tableName] = {
          exists: !error,
          error: error?.message || null,
          sample_count: data?.length || 0
        };
      } catch (e: any) {
        debug.tables[tableName] = {
          exists: false,
          error: e.message || 'Unknown error',
          sample_count: 0
        };
      }
    }

    // Test budget_periods creation if household exists
    if (householdMember?.household_id) {
      try {
        const testMonth = '2024-01';
        
        // Try to create a test budget period
        const { data: testPeriod, error: testError } = await supabase
          .from('budget_periods')
          .upsert({ 
            household_id: householdMember.household_id, 
            month: testMonth 
          }, { 
            onConflict: 'household_id,month' 
          })
          .select('id')
          .single();

        debug.test_budget_period = {
          success: !testError,
          error: testError?.message || null,
          period_id: testPeriod?.id || null
        };
      } catch (e: any) {
        debug.test_budget_period = {
          success: false,
          error: e.message || 'Unknown error',
          period_id: null
        };
      }
    }

    return res.status(200).json(debug);
    
  } catch (e: any) {
    return res.status(500).json({ 
      error: 'Debug API error', 
      details: e.message || 'Unknown error' 
    });
  }
}
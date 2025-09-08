import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

async function checkData() {
  console.log('🔍 Checking existing data...\n');

  // Check budget periods
  const { data: periods } = await supabase
    .from('budget_periods')
    .select('*')
    .eq('household_id', DEMO_HOUSEHOLD_ID);
  
  console.log('Budget Periods:', periods);

  // Check categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', DEMO_HOUSEHOLD_ID);
  
  console.log('Categories:', categories?.length, 'found');

  // Check transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', DEMO_HOUSEHOLD_ID);
  
  console.log('Transactions:', transactions?.length, 'found');

  // Check the view that the dashboard uses
  const { data: summary } = await supabase
    .from('v_monthly_category_summary')
    .select('*')
    .eq('household_id', DEMO_HOUSEHOLD_ID);
  
  console.log('Monthly Summary View:', summary?.length, 'records found');
  if (summary?.length > 0) {
    console.log('Sample summary:', summary[0]);
  }
}

checkData();

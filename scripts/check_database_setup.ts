import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkDatabaseSetup() {
  console.log('🔍 Checking database setup...');

  try {
    // Check if RLS helper functions exist
    const { data: functions, error: funcError } = await supabase.rpc('is_household_member', { h_id: '550e8400-e29b-41d4-a716-446655440001' });
    
    if (funcError) {
      console.log('❌ RLS functions missing or not working:', funcError.message);
      console.log('This explains why the frontend can\'t access data!');
    } else {
      console.log('✅ RLS functions working');
    }

    // Check if the monthly summary view exists
    const { data: viewCheck, error: viewError } = await supabase
      .from('v_monthly_category_summary')
      .select('count')
      .limit(1);

    if (viewError) {
      console.log('❌ Monthly summary view issue:', viewError.message);
    } else {
      console.log('✅ Monthly summary view accessible');
    }

  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabaseSetup();

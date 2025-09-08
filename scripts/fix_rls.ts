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

const DEMO_USER_EMAIL = 'test.user+ux@demo.local';
const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

async function fixRLSAccess() {
  console.log('�� Fixing RLS access for demo user...');

  try {
    // Get user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const demoUser = users.users.find(u => u.email === DEMO_USER_EMAIL);
    
    if (!demoUser) {
      console.error('Demo user not found');
      return;
    }

    const userId = demoUser.id;
    console.log('✅ Found user:', userId);

    // Ensure household membership exists with proper role
    const { error: memberError } = await supabase
      .from('household_members')
      .upsert({
        household_id: DEMO_HOUSEHOLD_ID,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString()
      }, { onConflict: 'household_id,user_id' });

    if (memberError) {
      console.error('Error ensuring household membership:', memberError);
    } else {
      console.log('✅ Household membership ensured');
    }

    // Check what the user can actually access
    console.log('\n🔍 Testing user access with anon key...');
    
    const anonSupabase = createClient<Database>(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Simulate user login
    const { error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: DEMO_USER_EMAIL,
      password: 'demo-password-123'
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }

    console.log('✅ User signed in successfully');

    // Test household access
    const { data: households, error: householdError } = await anonSupabase
      .from('household_members')
      .select(`
        household_id,
        role,
        households (*)
      `)
      .eq('user_id', userId);

    if (householdError) {
      console.error('Household access error:', householdError);
    } else {
      console.log('✅ Household access:', households?.length, 'households found');
    }

    // Test monthly summary access
    const { data: summaryData, error: summaryError } = await anonSupabase
      .from('v_monthly_category_summary')
      .select('*')
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .eq('month', '2025-09-01');

    if (summaryError) {
      console.error('❌ Summary access error:', summaryError);
    } else {
      console.log('✅ Summary access:', summaryData?.length, 'records found');
      if (summaryData?.length > 0) {
        console.log('Sample:', summaryData[0]);
      }
    }

  } catch (error) {
    console.error('❌ RLS fix failed:', error);
  }
}

fixRLSAccess();

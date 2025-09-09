// 1. First, let's create a comprehensive debug script to check the current state
// scripts/debug_setup.ts
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_USER_EMAIL = 'test.user+ux@demo.local';
const DEMO_HOUSEHOLD_ID = '550e8400-e29b-41d4-a716-446655440001';

async function debugSetup() {
  console.log('🔍 Debugging household setup issues...\n');

  try {
    // 1. Check if demo user exists
    console.log('1. Checking demo user...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const demoUser = users.users.find(u => u.email === DEMO_USER_EMAIL);
    
    if (!demoUser) {
      console.log('❌ Demo user does not exist. Creating...');
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: DEMO_USER_EMAIL,
        password: 'demo-password-123',
        email_confirm: true
      });
      
      if (error) {
        console.error('Failed to create demo user:', error);
        return;
      }
      console.log('✅ Demo user created:', newUser.user?.id);
    } else {
      console.log('✅ Demo user exists:', demoUser.id);
    }

    const userId = demoUser?.id || 'unknown';

    // 2. Check if demo household exists
    console.log('\n2. Checking demo household...');
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', DEMO_HOUSEHOLD_ID)
      .single();

    if (householdError || !household) {
      console.log('❌ Demo household does not exist. Creating...');
      const { error: createError } = await supabase
        .from('households')
        .insert({
          id: DEMO_HOUSEHOLD_ID,
          name: 'Demo Household',
          base_currency: 'USD'
        });
      
      if (createError) {
        console.error('Failed to create demo household:', createError);
        return;
      }
      console.log('✅ Demo household created');
    } else {
      console.log('✅ Demo household exists:', household.name);
    }

    // 3. Check household membership
    console.log('\n3. Checking household membership...');
    const { data: membership, error: membershipError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', DEMO_HOUSEHOLD_ID)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      console.log('❌ User is not a member. Adding...');
      const { error: addError } = await supabase
        .from('household_members')
        .insert({
          household_id: DEMO_HOUSEHOLD_ID,
          user_id: userId,
          role: 'owner',
          joined_at: new Date().toISOString()
        });
      
      if (addError) {
        console.error('Failed to add user to household:', addError);
        return;
      }
      console.log('✅ User added to household');
    } else {
      console.log('✅ User is already a member:', membership.role);
    }

    // 4. Test RLS functions
    console.log('\n4. Testing RLS functions...');
    try {
      const { data: isMember } = await supabase.rpc('is_household_member', { h_id: DEMO_HOUSEHOLD_ID });
      console.log('RLS is_household_member result:', isMember);
    } catch (error) {
      console.error('❌ RLS function test failed:', error);
    }

    // 5. Check if basic demo data exists
    console.log('\n5. Checking demo data...');
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('household_id', DEMO_HOUSEHOLD_ID);
    
    console.log(`Accounts: ${accounts?.length || 0} found`);

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', DEMO_HOUSEHOLD_ID);
    
    console.log(`Categories: ${categories?.length || 0} found`);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('household_id', DEMO_HOUSEHOLD_ID);
    
    console.log(`Transactions: ${transactions?.length || 0} found`);

    console.log('\n✅ Debug complete! Now try joining the demo household again.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSetup();
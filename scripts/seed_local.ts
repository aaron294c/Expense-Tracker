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

async function seedDemoData() {
  console.log('🌱 Creating data for September 2025...');

  try {
    // Get user ID
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const demoUser = existingUsers.users.find(u => u.email === DEMO_USER_EMAIL);
    
    if (!demoUser) {
      console.error('Demo user not found.');
      return;
    }
    
    const userId = demoUser.id;
    console.log('✅ Found demo user:', DEMO_USER_EMAIL);

    // Target September 2025 specifically
    const targetMonth = '2025-09-01';

    // Clear existing data
    await supabase.from('transaction_categories').delete().match({ transaction_id: '550e8400-e29b-41d4-a716-446655440050' });
    await supabase.from('transaction_categories').delete().match({ transaction_id: '550e8400-e29b-41d4-a716-446655440051' });
    await supabase.from('transaction_categories').delete().match({ transaction_id: '550e8400-e29b-41d4-a716-446655440052' });
    await supabase.from('transactions').delete().eq('household_id', DEMO_HOUSEHOLD_ID);
    await supabase.from('budgets').delete().match({ period_id: '550e8400-e29b-41d4-a716-446655440040' });
    await supabase.from('budget_periods').delete().eq('household_id', DEMO_HOUSEHOLD_ID);
    await supabase.from('categories').delete().eq('household_id', DEMO_HOUSEHOLD_ID);
    await supabase.from('accounts').delete().eq('household_id', DEMO_HOUSEHOLD_ID);

    console.log('🧹 Cleared existing data');

    // Create accounts
    const { error: accountError } = await supabase.from('accounts').insert([
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        household_id: DEMO_HOUSEHOLD_ID,
        name: 'Main Checking',
        type: 'current',
        initial_balance: 2500.00,
        currency: 'USD',
        is_archived: false
      }
    ]);
    if (accountError) throw accountError;
    console.log('✅ Accounts created');

    // Create categories
    const { error: categoryError } = await supabase.from('categories').insert([
      { id: '550e8400-e29b-41d4-a716-446655440020', household_id: DEMO_HOUSEHOLD_ID, name: 'Groceries', kind: 'expense', icon: 'shopping_cart', color: '#34C759', position: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440021', household_id: DEMO_HOUSEHOLD_ID, name: 'Dining Out', kind: 'expense', icon: 'restaurant', color: '#FF9F0A', position: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440022', household_id: DEMO_HOUSEHOLD_ID, name: 'Transportation', kind: 'expense', icon: 'directions_car', color: '#007AFF', position: 3 }
    ]);
    if (categoryError) throw categoryError;
    console.log('✅ Categories created');

    // Create budget period for September 2025
    const { error: periodError } = await supabase.from('budget_periods').insert([
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        household_id: DEMO_HOUSEHOLD_ID,
        month: targetMonth
      }
    ]);
    if (periodError) throw periodError;
    console.log('✅ Budget period created for September 2025');

    // Create budgets
    const { error: budgetError } = await supabase.from('budgets').insert([
      { period_id: '550e8400-e29b-41d4-a716-446655440040', category_id: '550e8400-e29b-41d4-a716-446655440020', amount: 600, rollover_enabled: false },
      { period_id: '550e8400-e29b-41d4-a716-446655440040', category_id: '550e8400-e29b-41d4-a716-446655440021', amount: 300, rollover_enabled: false },
      { period_id: '550e8400-e29b-41d4-a716-446655440040', category_id: '550e8400-e29b-41d4-a716-446655440022', amount: 200, rollover_enabled: false }
    ]);
    if (budgetError) throw budgetError;
    console.log('✅ Budgets created');

    // Create transactions in September 2025
    const { error: txError } = await supabase.from('transactions').insert([
      {
        id: '550e8400-e29b-41d4-a716-446655440050',
        household_id: DEMO_HOUSEHOLD_ID,
        account_id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: userId,
        description: 'Weekly groceries',
        merchant: 'Whole Foods',
        amount: 87.50,
        direction: 'outflow',
        currency: 'USD',
        occurred_at: '2025-09-01T10:00:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440051',
        household_id: DEMO_HOUSEHOLD_ID,
        account_id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: userId,
        description: 'Coffee meeting',
        merchant: 'Starbucks',
        amount: 12.75,
        direction: 'outflow',
        currency: 'USD',
        occurred_at: '2025-09-03T14:30:00Z'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440052',
        household_id: DEMO_HOUSEHOLD_ID,
        account_id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: userId,
        description: 'Gas station',
        merchant: 'Shell',
        amount: 45.20,
        direction: 'outflow',
        currency: 'USD',
        occurred_at: '2025-09-05T16:15:00Z'
      }
    ]);
    if (txError) throw txError;
    console.log('✅ Transactions created');

    // Link transactions to categories
    const { error: txCatError } = await supabase.from('transaction_categories').insert([
      { transaction_id: '550e8400-e29b-41d4-a716-446655440050', category_id: '550e8400-e29b-41d4-a716-446655440020', weight: 1.0 },
      { transaction_id: '550e8400-e29b-41d4-a716-446655440051', category_id: '550e8400-e29b-41d4-a716-446655440021', weight: 1.0 },
      { transaction_id: '550e8400-e29b-41d4-a716-446655440052', category_id: '550e8400-e29b-41d4-a716-446655440022', weight: 1.0 }
    ]);
    if (txCatError) throw txCatError;
    console.log('✅ Transaction categories linked');

    console.log('\n🎉 September 2025 demo data created!');
    console.log('📊 Summary:');
    console.log('  - Total Budget: $1,100');
    console.log('  - Total Spent: $145.45');
    console.log('  - Groceries: $87.50 of $600');
    console.log('  - Dining Out: $12.75 of $300');
    console.log('  - Transportation: $45.20 of $200');
    console.log('\n🔄 Refresh your browser to see the data!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
}

seedDemoData();

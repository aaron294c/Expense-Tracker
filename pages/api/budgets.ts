// pages/api/budgets.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { household_id, month } = req.query;

  if (!household_id || !month) {
    return res.status(400).json({ error: 'household_id and month are required' });
  }

  try {
    if (req.method === 'GET') {
      // Get monthly category summary
      const { data: categories, error: categoriesError } = await supabase
        .from('v_monthly_category_summary')
        .select('*')
        .eq('household_id', household_id)
        .eq('month', month);

      if (categoriesError) {
        console.error('Error fetching category summary:', categoriesError);
        return res.status(500).json({ error: 'Failed to fetch budget data' });
      }

      // Get burn rate data
      const { data: burnRate, error: burnRateError } = await supabase
        .from('v_simple_burn_rate')
        .select('*')
        .eq('household_id', household_id)
        .eq('month', month)
        .single();

      if (burnRateError) {
        console.log('Burn rate not found (this is OK for new months):', burnRateError.message);
      }

      // Get all categories for the household
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', household_id)
        .order('position');

      if (allCategoriesError) {
        console.error('Error fetching all categories:', allCategoriesError);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      return res.status(200).json({
        data: {
          month,
          household_id,
          categories: categories || [],
          burn_rate: burnRate || null,
          all_categories: allCategories || []
        }
      });
    }

    if (req.method === 'POST') {
      const { month: bodyMonth, category_budgets } = req.body;
      const targetMonth = bodyMonth || month;

      if (!category_budgets || !Array.isArray(category_budgets)) {
        return res.status(400).json({ error: 'category_budgets array is required' });
      }

      // Ensure budget period exists
      const { data: existingPeriod } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('household_id', household_id)
        .eq('month', targetMonth)
        .single();

      let periodId = existingPeriod?.id;

      if (!periodId) {
        const { data: newPeriod, error: periodError } = await supabase
          .from('budget_periods')
          .insert({
            household_id: household_id as string,
            month: targetMonth
          })
          .select('id')
          .single();

        if (periodError) {
          console.error('Error creating budget period:', periodError);
          return res.status(500).json({ error: 'Failed to create budget period' });
        }

        periodId = newPeriod.id;
      }

      // Upsert budgets
      const budgetInserts = category_budgets.map((budget: any) => ({
        period_id: periodId,
        category_id: budget.category_id,
        amount: budget.amount,
        rollover_enabled: budget.rollover_enabled || false
      }));

      const { error: budgetError } = await supabase
        .from('budgets')
        .upsert(budgetInserts, { 
          onConflict: 'period_id,category_id',
          ignoreDuplicates: false
        });

      if (budgetError) {
        console.error('Error upserting budgets:', budgetError);
        return res.status(500).json({ error: 'Failed to update budgets' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
// /pages/api/budgets/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetPeriodInsert = Database['public']['Tables']['budget_periods']['Insert'];

interface CreateBudgetBody {
  month: string; // YYYY-MM-01 format
  category_budgets: {
    category_id: string;
    amount: number;
    rollover_enabled?: boolean;
  }[];
}

interface ApplyRolloverBody {
  from_month: string; // YYYY-MM-01
  to_month: string; // YYYY-MM-01
  household_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user's household memberships
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id);

  const householdIds = memberships?.map(m => m.household_id) || [];
  if (householdIds.length === 0) {
    return res.status(403).json({ error: 'No household access' });
  }

  if (req.method === 'GET') {
    return handleGetBudgets(req, res, supabase, householdIds);
  } else if (req.method === 'POST') {
    return handleCreateOrUpdateBudgets(req, res, supabase, memberships);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetBudgets(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id, month } = req.query;

  // Validate household access
  const targetHouseholdId = household_id as string || householdIds[0];
  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' });
  }

  // Default to current month if not provided
  const targetMonth = month as string || new Date().toISOString().slice(0, 7) + '-01';

  try {
    // Get monthly summary view data
    const { data: summary, error: summaryError } = await supabase
      .from('v_monthly_category_summary')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .eq('month', targetMonth)
      .order('category_name');

    if (summaryError) {
      console.error('Error fetching budget summary:', summaryError);
      return res.status(500).json({ error: 'Failed to fetch budget data' });
    }

    // Get burn rate data
    const { data: burnRate, error: burnError } = await supabase
      .from('v_simple_burn_rate')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .eq('month', targetMonth)
      .single();

    if (burnError && burnError.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Error fetching burn rate:', burnError);
    }

    // Get all categories for the household (for creating new budgets)
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, kind, icon, color')
      .eq('household_id', targetHouseholdId)
      .order('kind, name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    return res.status(200).json({
      data: {
        month: targetMonth,
        household_id: targetHouseholdId,
        categories: summary || [],
        burn_rate: burnRate || null,
        all_categories: allCategories || []
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateOrUpdateBudgets(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { action } = req.query;

  if (action === 'rollover') {
    return handleApplyRollover(req, res, supabase, memberships);
  }

  const body: CreateBudgetBody = req.body;

  // Validate required fields
  if (!body.month || !body.category_budgets || !Array.isArray(body.category_budgets)) {
    return res.status(400).json({ 
      error: 'Missing required fields: month, category_budgets' 
    });
  }

  // Validate month format (YYYY-MM-01)
  const monthRegex = /^\d{4}-\d{2}-01$/;
  if (!monthRegex.test(body.month)) {
    return res.status(400).json({ error: 'Month must be in YYYY-MM-01 format' });
  }

  // Validate budget amounts
  for (const budget of body.category_budgets) {
    if (!budget.category_id || typeof budget.amount !== 'number' || budget.amount < 0) {
      return res.status(400).json({ 
        error: 'Invalid budget: category_id required and amount must be non-negative number' 
      });
    }
  }

  try {
    // Get first category to determine household and verify permissions
    const { data: firstCategory, error: categoryError } = await supabase
      .from('categories')
      .select('household_id')
      .eq('id', body.category_budgets[0].category_id)
      .single();

    if (categoryError || !firstCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const householdId = firstCategory.household_id;

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === householdId);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Create or get budget period
    const { data: existingPeriod, error: periodCheckError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('household_id', householdId)
      .eq('month', body.month)
      .single();

    let periodId: string;

    if (existingPeriod) {
      periodId = existingPeriod.id;
    } else {
      const { data: newPeriod, error: periodError } = await supabase
        .from('budget_periods')
        .insert({
          household_id: householdId,
          month: body.month
        } as BudgetPeriodInsert)
        .select('id')
        .single();

      if (periodError) {
        console.error('Error creating budget period:', periodError);
        return res.status(500).json({ error: 'Failed to create budget period' });
      }

      periodId = newPeriod.id;
    }

    // Upsert budgets
    const budgetUpserts = body.category_budgets.map(budget => ({
      period_id: periodId,
      category_id: budget.category_id,
      amount: budget.amount,
      rollover_enabled: budget.rollover_enabled || false
    }));

    const { data: upsertedBudgets, error: budgetError } = await supabase
      .from('budgets')
      .upsert(budgetUpserts, { 
        onConflict: 'period_id,category_id',
        ignoreDuplicates: false
      })
      .select(`
        *,
        categories (name, kind, icon, color)
      `);

    if (budgetError) {
      console.error('Error upserting budgets:', budgetError);
      return res.status(500).json({ error: 'Failed to save budgets' });
    }

    return res.status(200).json({
      data: {
        period_id: periodId,
        month: body.month,
        budgets: upsertedBudgets
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleApplyRollover(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const body: ApplyRolloverBody = req.body;

  if (!body.from_month || !body.to_month || !body.household_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: from_month, to_month, household_id' 
    });
  }

  // Check permissions
  const membership = memberships.find(m => m.household_id === body.household_id);
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    // Get categories with rollover enabled and their surplus/deficit
    const { data: rolloverData, error: rolloverError } = await supabase
      .from('v_monthly_category_summary')
      .select('category_id, category_name, budget, spent, remaining, rollover_enabled')
      .eq('household_id', body.household_id)
      .eq('month', body.from_month)
      .eq('rollover_enabled', true);

    if (rolloverError) {
      console.error('Error fetching rollover data:', rolloverError);
      return res.status(500).json({ error: 'Failed to fetch rollover data' });
    }

    if (!rolloverData || rolloverData.length === 0) {
      return res.status(200).json({ 
        data: { 
          message: 'No categories with rollover enabled',
          applied_adjustments: []
        }
      });
    }

    // Get or create target month budget period
    let { data: targetPeriod, error: targetPeriodError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('household_id', body.household_id)
      .eq('month', body.to_month)
      .single();

    if (!targetPeriod) {
      const { data: newPeriod, error: newPeriodError } = await supabase
        .from('budget_periods')
        .insert({
          household_id: body.household_id,
          month: body.to_month
        } as BudgetPeriodInsert)
        .select('id')
        .single();

      if (newPeriodError) {
        console.error('Error creating target period:', newPeriodError);
        return res.status(500).json({ error: 'Failed to create target budget period' });
      }

      targetPeriod = newPeriod;
    }

    // Calculate adjustments and update target month budgets
    const adjustments: any[] = [];
    
    for (const item of rolloverData) {
      if (item.remaining !== 0) { // Only adjust if there's a surplus or deficit
        // Get existing budget for target month
        const { data: existingBudget } = await supabase
          .from('budgets')
          .select('amount')
          .eq('period_id', targetPeriod.id)
          .eq('category_id', item.category_id)
          .single();

        const currentAmount = existingBudget?.amount || item.budget || 0;
        const newAmount = Math.max(0, currentAmount + item.remaining);

        // Upsert the adjusted budget
        const { error: upsertError } = await supabase
          .from('budgets')
          .upsert({
            period_id: targetPeriod.id,
            category_id: item.category_id,
            amount: newAmount,
            rollover_enabled: true
          }, { 
            onConflict: 'period_id,category_id',
            ignoreDuplicates: false
          });

        if (!upsertError) {
          adjustments.push({
            category_id: item.category_id,
            category_name: item.category_name,
            previous_amount: currentAmount,
            adjustment: item.remaining,
            new_amount: newAmount
          });
        }
      }
    }

    return res.status(200).json({
      data: {
        from_month: body.from_month,
        to_month: body.to_month,
        applied_adjustments: adjustments
      }
    });

  } catch (error) {
    console.error('Rollover API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
// pages/api/budgets-simple.ts - Ultra-simple budget API without date issues
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserAndSupabase } from '@/lib/supabaseApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth
  const { user, supabase, error } = await getUserAndSupabase(req, res);
  if (error || !user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const method = req.method || 'GET';
  const household_id = req.query.household_id as string;
  const month = req.query.month as string;

  if (!household_id || !month) {
    return res.status(400).json({ error: 'household_id and month are required' });
  }

  try {
    if (method === 'GET') {
      // Get all categories
      const { data: allCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', household_id)
        .order('position', { ascending: true });

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      }

      // Get budget period
      const { data: period } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('household_id', household_id)
        .eq('month', month)
        .maybeSingle();

      // Get budgets for this period
      let budgets = [];
      if (period?.id) {
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('category_id, amount')
          .eq('period_id', period.id);

        if (!budgetError) {
          budgets = budgetData || [];
        }
      }

      // Build simple category summary (without spending for now)
      const categories = (allCategories || [])
        .filter(c => c.kind === 'expense')
        .map(c => {
          const budget = budgets.find(b => b.category_id === c.id)?.amount || 0;
          return {
            category_id: c.id,
            category_name: c.name,
            icon: c.icon,
            color: c.color,
            budget: Number(budget),
            spent: 0, // Simplified - no spending calculation
            remaining: Number(budget),
            budget_percentage: 0,
            category_kind: c.kind,
          };
        });

      return res.status(200).json({
        data: {
          month,
          household_id,
          categories,
          all_categories: allCategories || []
        }
      });
    }

    if (method === 'POST') {
      const category_budgets = req.body?.category_budgets as Array<{
        category_id: string; 
        amount: number;
      }>;

      if (!Array.isArray(category_budgets)) {
        return res.status(400).json({ error: 'category_budgets array is required' });
      }

      console.log('Saving budgets for:', { household_id, month, count: category_budgets.length });

      // Get or create budget period
      let periodId: string;
      
      const { data: existingPeriod } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('household_id', household_id)
        .eq('month', month)
        .maybeSingle();

      if (existingPeriod?.id) {
        periodId = existingPeriod.id;
      } else {
        const { data: newPeriod, error: periodError } = await supabase
          .from('budget_periods')
          .insert({ household_id, month })
          .select('id')
          .single();

        if (periodError) {
          console.error('Period creation error:', periodError);
          return res.status(500).json({ 
            error: 'Failed to create budget period',
            details: periodError.message 
          });
        }
        
        periodId = newPeriod.id;
      }

      // Upsert budgets
      const upserts = category_budgets.map(b => ({
        period_id: periodId,
        category_id: b.category_id,
        amount: b.amount,
        rollover_enabled: false
      }));

      const { error: upsertError } = await supabase
        .from('budgets')
        .upsert(upserts, { onConflict: 'period_id,category_id' });

      if (upsertError) {
        console.error('Budget upsert error:', upsertError);
        return res.status(500).json({ 
          error: 'Failed to save budgets',
          details: upsertError.message 
        });
      }

      console.log('Successfully saved budgets');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (e: any) {
    console.error('Budget API error:', e);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: e.message 
    });
  }
}
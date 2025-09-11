// pages/api/budgets.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserAndSupabase } from '@/lib/supabaseApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth (Bearer preferred, else cookies)
  const { user, supabase, error } = await getUserAndSupabase(req, res);
  if (error || !user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Inputs
  const method = req.method || 'GET';
  const isGet = method === 'GET';
  const isPost = method === 'POST';

  // For GET read query; for POST read body
  const household_id = (isGet ? req.query.household_id : req.body?.household_id) as string | undefined;
  const month = (isGet ? req.query.month : req.body?.month) as string | undefined;

  if (!household_id || !month) {
    return res.status(400).json({ error: 'household_id and month are required' });
  }

  try {
    if (isGet) {
      // ---------- Month normalization ----------
      const m = String(month);
      const [y, mm] = m.split('-').map(Number);
      if (!y || !mm || mm < 1 || mm > 12) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
      }
      const start = new Date(Date.UTC(y, mm - 1, 1));
      const next = new Date(Date.UTC(y, mm, 1));

      // ---------- Simplified approach without views ----------
      const getSimpleData = async () => {
        // 1. Get all categories for this household
        const { data: allCategories, error: allCategoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('household_id', household_id)
          .order('position', { ascending: true });

        if (allCategoriesError) throw allCategoriesError;

        // 2. Get budget period for this month
        const { data: period } = await supabase
          .from('budget_periods')
          .select('id')
          .eq('household_id', household_id)
          .eq('month', m)
          .maybeSingle();

        // 3. Get budgets for this period
        const { data: budgets, error: budgetsError } = period
          ? await supabase
              .from('budgets')
              .select('category_id, amount, rollover_enabled')
              .eq('period_id', period.id)
          : { data: [], error: null };

        if (budgetsError) throw budgetsError;

        // 4. Get spending for this month (simplified, no date filtering)
        let transactions = [];
        let transactionsError = null;
        
        // Skip complex date filtering for now - just get recent transactions
        try {
          const { data: recentTransactions, error } = await supabase
            .from('transactions')
            .select('amount, direction, occurred_at, type, transaction_categories(category_id)')
            .eq('household_id', household_id)
            .eq('direction', 'outflow')
            .order('occurred_at', { ascending: false })
            .limit(100); // Get recent transactions instead of date filtering

          if (error) {
            console.warn('Transaction query with categories failed, trying simpler query:', error);
            
            // Fallback to simpler query
            const { data: simpleTransactions, error: simpleError } = await supabase
              .from('transactions')
              .select('amount, direction, occurred_at, type')
              .eq('household_id', household_id) 
              .eq('direction', 'outflow')
              .order('occurred_at', { ascending: false })
              .limit(100);

            transactions = simpleTransactions || [];
            transactionsError = simpleError;
          } else {
            transactions = recentTransactions || [];
          }
        } catch (e) {
          console.warn('All transaction queries failed, continuing without spending data:', e);
          transactions = [];
        }

        // 5. Calculate spending per category
        const spendingMap = new Map<string, number>();
        (transactions || []).forEach(t => {
          // Handle different table structures
          if (t.transaction_categories && Array.isArray(t.transaction_categories)) {
            // New structure with junction table
            const categoryIds = t.transaction_categories.map((tc: any) => tc.category_id) || [];
            categoryIds.forEach((cid: any) => {
              if (cid) {
                spendingMap.set(cid, (spendingMap.get(cid) || 0) + (t.amount || 0));
              }
            });
          } else if (t.category_id) {
            // Direct category_id column
            spendingMap.set(t.category_id, (spendingMap.get(t.category_id) || 0) + (t.amount || 0));
          }
        });

        // 6. Build category summary
        const categories = (allCategories || [])
          .filter(c => c.kind === 'expense')
          .map(c => {
            const budget = (budgets || []).find(b => b.category_id === c.id)?.amount || 0;
            const spent = spendingMap.get(c.id) || 0;
            const remaining = budget - spent;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;

            return {
              category_id: c.id,
              category_name: c.name,
              icon: c.icon,
              color: c.color,
              budget: Number(budget),
              spent: Number(spent),
              remaining,
              budget_percentage: percentage,
              category_kind: c.kind,
            };
          });

        return {
          categories,
          burn_rate: null, // Skip burn rate for now
          all_categories: allCategories || [],
        };
      };


      // ---------- Execute simplified approach ----------
      try {
        const payload = await getSimpleData();

        return res.status(200).json({
          data: {
            month: m,
            household_id,
            ...payload,
          },
        });
      } catch (e: any) {
        console.error('Error building budget payload:', {
          code: e?.code, details: e?.details, message: e?.message,
        });
        const devMsg = e?.message || e?.details || e?.code || 'Failed to fetch budget data';
        return res.status(500).json({ error: devMsg });
      }
    }

    if (isPost) {
      const m = String(month);
      const category_budgets = req.body?.category_budgets as
        | Array<{ category_id: string; amount: number; rollover_enabled?: boolean }>
        | undefined;

      if (!Array.isArray(category_budgets)) {
        return res.status(400).json({ error: 'category_budgets array is required' });
      }

      try {
        // First, check if the tables exist by trying a simple query
        const { error: tableCheck } = await supabase
          .from('budget_periods')
          .select('id')
          .limit(1);

        if (tableCheck && tableCheck.message?.includes('does not exist')) {
          return res.status(500).json({ 
            error: 'Database tables not set up. Please run the SQL schema first.',
            details: 'budget_periods table does not exist'
          });
        }

        // Try to get existing period
        const { data: existingPeriod, error: periodSelectError } = await supabase
          .from('budget_periods')
          .select('id')
          .eq('household_id', household_id)
          .eq('month', m)
          .maybeSingle();

        if (periodSelectError) {
          console.error('Error selecting budget period:', periodSelectError);
          return res.status(500).json({ 
            error: 'Failed to check existing budget period',
            details: periodSelectError.message 
          });
        }

        let periodId = existingPeriod?.id as string | undefined;
        
        // Create period if it doesn't exist
        if (!periodId) {
          console.log('Creating new budget period for:', { household_id, month: m });
          
          const { data: newPeriod, error: periodError } = await supabase
            .from('budget_periods')
            .insert({ household_id, month: m })
            .select('id')
            .single();

          if (periodError) {
            console.error('Detailed period creation error:', {
              code: periodError.code,
              message: periodError.message,
              details: periodError.details,
              hint: periodError.hint
            });
            return res.status(500).json({ 
              error: 'Failed to create budget period',
              details: periodError.message || 'Unknown database error',
              code: periodError.code
            });
          }
          
          if (!newPeriod?.id) {
            return res.status(500).json({ error: 'Budget period created but no ID returned' });
          }
          
          periodId = newPeriod.id;
          console.log('Created budget period with ID:', periodId);
        }

        // Prepare budget upserts
        const upserts = category_budgets.map(b => ({
          period_id: periodId!,
          category_id: b.category_id,
          amount: b.amount,
          rollover_enabled: !!b.rollover_enabled,
        }));

        console.log('Upserting budgets:', upserts.length, 'items');

        const { error: upsertError } = await supabase
          .from('budgets')
          .upsert(upserts, { onConflict: 'period_id,category_id' });

        if (upsertError) {
          console.error('Detailed budget upsert error:', {
            code: upsertError.code,
            message: upsertError.message,
            details: upsertError.details
          });
          return res.status(500).json({ 
            error: 'Failed to update budgets',
            details: upsertError.message || 'Unknown database error',
            code: upsertError.code
          });
        }

        console.log('Successfully saved budgets for period:', periodId);
        return res.status(200).json({ success: true, period_id: periodId });
        
      } catch (err: any) {
        console.error('Unexpected error in budget POST:', err);
        return res.status(500).json({ 
          error: 'Unexpected server error',
          details: err.message || 'Unknown error'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

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

      // ---------- Fast path: query views ----------
      const tryViews = async () => {
        const { data: categories, error: categoriesError } = await supabase
          .from('v_monthly_category_summary')
          .select('*')
          .eq('household_id', household_id)
          .eq('month', m); // view should expose month as 'YYYY-MM' text

        if (categoriesError) throw categoriesError;

        const { data: burnRate, error: burnRateError } = await supabase
          .from('v_simple_burn_rate')
          .select('*')
          .eq('household_id', household_id)
          .eq('month', m)
          .maybeSingle(); // tolerate no row

        if (burnRateError && burnRateError.code !== 'PGRST116') {
          // ignore "no rows" style errors
          throw burnRateError;
        }

        const { data: allCategories, error: allCategoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('household_id', household_id)
          .order('position', { ascending: true });

        if (allCategoriesError) throw allCategoriesError;

        return {
          categories: categories ?? [],
          burn_rate: burnRate ?? null,
          all_categories: allCategories ?? [],
        };
      };

      // ---------- Fallback: compute without views ----------
      const fallbackWithoutViews = async () => {
        // 1) period & budgets
        const { data: period } = await supabase
          .from('budget_periods')
          .select('id')
          .eq('household_id', household_id)
          .eq('month', m)
          .maybeSingle();

        const periodId = (period?.id as string | undefined) ?? undefined;

        const { data: budgets, error: budgetsErr } = periodId
          ? await supabase
              .from('budgets')
              .select('category_id, amount, rollover_enabled')
              .eq('period_id', periodId)
          : { data: [], error: null };

        if (budgetsErr) throw budgetsErr;

        // 2) categories (names/icons & mapping)
        const { data: allCategories, error: catsErr } = await supabase
          .from('categories')
          .select('id, name, icon, color, kind')
          .eq('household_id', household_id);

        if (catsErr) throw catsErr;

        // helper map: name -> id (case-insensitive)
        const nameToId = new Map<string, string>();
        for (const c of allCategories ?? []) {
          nameToId.set(c.name.toLowerCase(), c.id);
        }

        // 3) spent by category in month window — try category_id first, then category (name)
        type SpendRow = {
          category_id?: string | null;
          category?: string | null;
          amount: number;
          occurred_at: string;
          type: string;
        };

        let spendRows: SpendRow[] | null = null;
        let spendErr: any = null;

        // attempt 1: column = category_id
        const attempt1 = await supabase
          .from('transactions')
          .select('category_id, amount, occurred_at, type')
          .eq('household_id', household_id)
          .eq('type', 'expense')
          .gte('occurred_at', start.toISOString())
          .lt('occurred_at', next.toISOString());

        if (attempt1.error && attempt1.error.message?.includes('column') && attempt1.error.message?.includes('does not exist')) {
          // attempt 2: column = category (name)
          const attempt2 = await supabase
            .from('transactions')
            .select('category, amount, occurred_at, type')
            .eq('household_id', household_id)
            .eq('type', 'expense')
            .gte('occurred_at', start.toISOString())
            .lt('occurred_at', next.toISOString());

          spendRows = attempt2.data as SpendRow[] | null;
          spendErr = attempt2.error;
        } else {
          spendRows = attempt1.data as SpendRow[] | null;
          spendErr = attempt1.error;
        }

        if (spendErr) throw spendErr;

        // 4) aggregate spend per category_id (resolve from name if needed)
        const UNCATEGORIZED_ID = 'uncategorized';
        const spentMap = new Map<string, number>();

        for (const row of spendRows ?? []) {
          let cid: string | undefined | null = row.category_id ?? null;

          if (!cid) {
            const name = (row.category ?? '').trim().toLowerCase();
            if (name && nameToId.has(name)) {
              cid = nameToId.get(name)!;
            } else {
              cid = UNCATEGORIZED_ID;
            }
          }

          spentMap.set(cid, (spentMap.get(cid) ?? 0) + Number(row.amount || 0));
        }

        // 5) build category rows (expense only + uncategorized if present)
        const expenseCats = (allCategories ?? []).filter(c => c.kind === 'expense');

        const rows = [
          ...expenseCats.map(c => {
            const budget = (budgets ?? []).find(b => b.category_id === c.id)?.amount ?? 0;
            const spent = spentMap.get(c.id) ?? 0;
            const remaining = Number(budget) - Number(spent);
            const pct = Number(budget) > 0 ? (Number(spent) / Number(budget)) * 100 : 0;
            return {
              category_id: c.id,
              category_name: c.name,
              icon: c.icon,
              color: c.color,
              budget: Number(budget),
              spent: Number(spent),
              remaining,
              budget_percentage: pct,
              category_kind: c.kind,
            };
          }),
          ...(spentMap.has(UNCATEGORIZED_ID)
            ? [{
                category_id: UNCATEGORIZED_ID,
                category_name: 'Uncategorized',
                icon: '❓',
                color: '#9CA3AF', // gray
                budget: 0,
                spent: Number(spentMap.get(UNCATEGORIZED_ID)),
                remaining: -Number(spentMap.get(UNCATEGORIZED_ID)),
                budget_percentage: 100,
                category_kind: 'expense' as const,
              }]
            : []),
        ];

        // 6) simple burn-rate approximation
        const today = new Date();
        const daysInMonth = new Date(y, mm, 0).getUTCDate();
        const dayOfMonth =
          today.getUTCFullYear() === y && today.getUTCMonth() + 1 === mm
            ? today.getUTCDate()
            : daysInMonth;
        const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
        const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
        const dailyBurn = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
        const projected = dailyBurn * daysInMonth;

        return {
          categories: rows,
          burn_rate: {
            daily_burn_rate: dailyBurn,
            projected_monthly_spend: projected,
            budget: totalBudget,
            remaining_days: Math.max(daysInMonth - dayOfMonth, 0),
            suggested_daily_spend:
              daysInMonth - dayOfMonth > 0
                ? Math.max((totalBudget - totalSpent) / (daysInMonth - dayOfMonth), 0)
                : 0,
          },
          all_categories: allCategories ?? [],
        };
      };

      // ---------- Execute: try views, fall back if needed ----------
      try {
        let payload;
        try {
          payload = await tryViews();
        } catch (ve: any) {
          console.warn('[budgets] View path failed, falling back:', {
            code: ve?.code, details: ve?.details, message: ve?.message,
          });
          payload = await fallbackWithoutViews();
        }

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

      // ensure budget period exists
      const { data: existingPeriod } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('household_id', household_id)
        .eq('month', m)
        .maybeSingle();

      let periodId = existingPeriod?.id as string | undefined;
      if (!periodId) {
        const { data: newPeriod, error: periodError } = await supabase
          .from('budget_periods')
          .insert({ household_id, month: m })
          .select('id')
          .single();

        if (periodError) {
          console.error('Error creating budget period:', periodError);
          return res.status(500).json({ error: 'Failed to create budget period' });
        }
        periodId = newPeriod.id;
      }

      const upserts = category_budgets.map(b => ({
        period_id: periodId!,
        category_id: b.category_id,
        amount: b.amount,
        rollover_enabled: !!b.rollover_enabled,
      }));

      const { error: upsertError } = await supabase
        .from('budgets')
        .upsert(upserts, { onConflict: 'period_id,category_id' });

      if (upsertError) {
        console.error('Error upserting budgets:', upsertError);
        return res.status(500).json({ error: 'Failed to update budgets' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('API error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

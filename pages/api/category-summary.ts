// pages/api/category-summary.ts
import type { NextApiResponse } from 'next';
import type { PostgrestError } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';

function sendPgError(
  res: NextApiResponse,
  http: number,
  label: string,
  err?: PostgrestError | null
) {
  if (err) {
    console.error(`${label}:`, err);
    return res.status(http).json({
      error: label,
      code: err.code ?? null,
      details: err.details ?? null,
      message: err.message ?? null,
      hint: err.hint ?? null,
    });
  }
  return res.status(http).json({ error: label });
}

function isIsoMonthDay(value: string) {
  // Expecting YYYY-MM-01 (your hooks pass e.g. "2025-09-01")
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // avoid caching in dev/browsers
  res.setHeader('Cache-Control', 'no-store');

  const { supabase, user } = req;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const household_id = String(req.query.household_id ?? '').trim();
  const month = String(req.query.month ?? '').trim();

  if (!household_id || !month) {
    return res.status(400).json({ error: 'household_id and month are required' });
  }
  if (!isIsoMonthDay(month)) {
    return res.status(400).json({ error: 'month must be an ISO date like YYYY-MM-01' });
  }

  // Optional: fast access precheck to give clearer errors if RLS later returns 403
  // (This relies on households/household_members RLS being correct.)
  {
    const { data: canSee, error: accessErr } = await supabase
      .from('households')
      .select('id')
      .eq('id', household_id)
      .limit(1);

    if (accessErr) {
      // If the view/table RLS will handle it anyway, you can skip failing here.
      // But surfacing this is often more helpful during setup.
      return sendPgError(res, 403, 'Failed to verify household access', accessErr);
    }
    if (!canSee || canSee.length === 0) {
      // No access to the household with current user
      return res.status(403).json({ error: 'Forbidden: no access to household' });
    }
  }

  // RLS must allow owner/member to read this view or its base tables
  const { data, error } = await supabase
    .from('v_monthly_category_summary')
    .select('*')
    .eq('household_id', household_id)
    .eq('month', month)
    // If "spent" is numeric in the view this is fine.
    // If it's text, Postgres will still sort lexically; adjust your view to expose numeric spent.
    .order('spent', { ascending: false });

  if (error) return sendPgError(res, 403, 'Failed to fetch category summaries', error);

  return res.status(200).json({ summaries: data ?? [] });
}

export default withAuth(handler);

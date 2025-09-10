// pages/api/households.ts
import type { NextApiResponse } from 'next';
import type { PostgrestError } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';

function sendPgError(res: NextApiResponse, http: number, label: string, err?: PostgrestError | null) {
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

const ALLOWED_CURRENCIES = new Set(['USD', 'GBP', 'EUR']);

async function householdsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user, supabase } = req;
  const method = req.method ?? 'GET';

  try {
    console.log(`[${method}] /api/households – user=${user.id} (${user.email ?? 'no-email'})`);

    // GET: list households visible to this user (owner or member via RLS)
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return sendPgError(res, 403, 'Failed to fetch households', error);

      // Enrich with membership role/joined_at for this user
      const { data: memberships, error: memErr } = await supabase
        .from('household_members')
        .select('household_id, role, joined_at')
        .eq('user_id', user.id);

      if (memErr) return sendPgError(res, 403, 'Failed to fetch memberships', memErr);

      const roleMap = new Map<string, { role: string; joined_at: string }>();
      (memberships ?? []).forEach(m => {
        roleMap.set(m.household_id, { role: m.role as string, joined_at: m.joined_at as string });
      });

      const shaped = (data ?? []).map(h => ({
        ...h,
        ...(roleMap.get(h.id) ??
          (h.owner_id === user.id ? { role: 'owner', joined_at: h.created_at } : {})),
      }));

      return res.status(200).json({ data: shaped });
    }

    // POST: create a household (owner_id must equal auth.uid() for INSERT policy),
    // then create an owner membership row.
    if (method === 'POST') {
      const rawName = (req.body?.name ?? '') as string;
      const rawCurrency = (req.body?.base_currency ?? 'USD') as string;

      const name = rawName.trim();
      if (!name) return res.status(400).json({ error: 'Household name is required' });

      const base_currency = ALLOWED_CURRENCIES.has(rawCurrency?.toUpperCase?.() ?? '')
        ? rawCurrency.toUpperCase()
        : 'USD';

      console.log(`Creating new household for user: ${user.id}`);

      // 1) Create household as owner (required by RLS: owner_id = auth.uid())
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          base_currency,
          owner_id: user.id, // <-- REQUIRED for the INSERT policy
        })
        .select()
        .single();

      if (householdError) return sendPgError(res, 403, 'Failed to create household', householdError);

      console.log(`Household created with ID: ${household.id}`);

      // 2) Create owner membership (role must be allowed by your enum/check)
      const { data: membership, error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'owner', // ensure enum household_role includes 'owner' (or use text+CHECK)
        })
        .select()
        .single();

      if (memberError) {
        console.error('Error adding user to household:', memberError);
        // best-effort cleanup (owner can delete via RLS)
        await supabase.from('households').delete().eq('id', household.id);
        return sendPgError(res, 403, 'Failed to create household membership', memberError);
      }

      console.log(`User ${user.id} added as owner to household ${household.id}`);

      return res.status(201).json({
        data: { ...household, role: membership.role, joined_at: membership.joined_at },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Unhandled /api/households error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message ?? String(err) });
  }
}

export default withAuth(householdsHandler);

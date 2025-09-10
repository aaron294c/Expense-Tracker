// pages/api/accounts.ts
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

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { supabase } = req;

  const method = req.method ?? 'GET';
  const household_id = req.query.household_id ? String(req.query.household_id) : '';
  const id = req.query.id ? String(req.query.id) : '';

  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (method === 'GET') {
      if (id) {
        const { data, error } = await supabase
          .from('v_account_balances')
          .select('*')
          .eq('account_id', id)
          .single();

        if (error) return sendPgError(res, 403, 'Failed to fetch account', error);
        return res.status(200).json({ data });
      }

      if (!household_id) return res.status(400).json({ error: 'household_id required' });

      const { data, error } = await supabase
        .from('v_account_balances')
        .select('*')
        .eq('household_id', household_id)
        .eq('is_archived', false)
        .order('name');

      if (error) return sendPgError(res, 403, 'Failed to fetch accounts', error);
      return res.status(200).json({ data: data ?? [] });
    }

    if (method === 'POST') {
      if (!household_id) return res.status(400).json({ error: 'household_id required' });

      const { name, type, initial_balance = 0, currency = 'USD' } = req.body ?? {};
      if (!name || !type) return res.status(400).json({ error: 'name and type are required' });

      const { data: account, error } = await supabase
        .from('accounts')
        .insert({
          household_id,
          name,
          type,
          initial_balance: parseFloat(initial_balance),
          currency,
        })
        .select()
        .single();

      if (error) return sendPgError(res, 403, 'Failed to create account', error);

      const { data: accountWithBalance } = await supabase
        .from('v_account_balances')
        .select('*')
        .eq('account_id', account.id)
        .single();

      return res.status(201).json({ data: accountWithBalance || account });
    }

    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Account ID is required for updates' });

      const { name, type, initial_balance, currency, is_archived } = req.body ?? {};
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (initial_balance !== undefined) updateData.initial_balance = parseFloat(initial_balance);
      if (currency !== undefined) updateData.currency = currency;
      if (is_archived !== undefined) updateData.is_archived = is_archived;

      const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return sendPgError(res, 403, 'Failed to update account', error);
      return res.status(200).json({ data });
    }

    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Account ID is required for deletion' });

      const { error } = await supabase.from('accounts').update({ is_archived: true }).eq('id', id);
      if (error) return sendPgError(res, 403, 'Failed to delete account', error);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Unhandled /api/accounts error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message ?? String(err) });
  }
}

export default withAuth(handler);

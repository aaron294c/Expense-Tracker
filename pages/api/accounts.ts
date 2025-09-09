// pages/api/accounts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { household_id, id } = req.query;

  if (!household_id && !id) {
    return res.status(400).json({ error: 'household_id or id is required' });
  }

  try {
    if (req.method === 'GET') {
      if (id) {
        // Get single account with balance
        const { data: account, error } = await supabase
          .from('v_account_balances')
          .select('*')
          .eq('account_id', id)
          .single();

        if (error) {
          console.error('Error fetching account:', error);
          return res.status(500).json({ error: 'Failed to fetch account' });
        }

        return res.status(200).json({ data: account });
      } else {
        // Get all accounts for household
        const { data: accounts, error } = await supabase
          .from('v_account_balances')
          .select('*')
          .eq('household_id', household_id)
          .eq('is_archived', false)
          .order('name');

        if (error) {
          console.error('Error fetching accounts:', error);
          return res.status(500).json({ error: 'Failed to fetch accounts' });
        }

        return res.status(200).json({ data: accounts || [] });
      }
    }

    if (req.method === 'POST') {
      const { name, type, initial_balance = 0, currency = 'USD' } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'name and type are required' });
      }

      const { data: account, error } = await supabase
        .from('accounts')
        .insert({
          household_id: household_id as string,
          name,
          type,
          initial_balance: parseFloat(initial_balance),
          currency
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return res.status(500).json({ error: 'Failed to create account' });
      }

      // Return the account with balance calculation
      const { data: accountWithBalance } = await supabase
        .from('v_account_balances')
        .select('*')
        .eq('account_id', account.id)
        .single();

      return res.status(201).json({ data: accountWithBalance || account });
    }

    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'Account ID is required for updates' });
      }

      const { name, type, initial_balance, currency, is_archived } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (initial_balance !== undefined) updateData.initial_balance = parseFloat(initial_balance);
      if (currency !== undefined) updateData.currency = currency;
      if (is_archived !== undefined) updateData.is_archived = is_archived;

      const { data: account, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return res.status(500).json({ error: 'Failed to update account' });
      }

      return res.status(200).json({ data: account });
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Account ID is required for deletion' });
      }

      // Soft delete by archiving
      const { error } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
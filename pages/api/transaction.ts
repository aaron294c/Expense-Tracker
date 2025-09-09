/ pages/api/transactions.ts - Fix the existing transactions endpoint
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { household_id, limit = '20', offset = '0', account_id, category_id, date_from, date_to, search } = req.query;

  if (!household_id) {
    return res.status(400).json({ error: 'household_id is required' });
  }

  try {
    if (req.method === 'GET') {
      let query = supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('household_id', household_id)
        .order('occurred_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      // Apply filters
      if (account_id) {
        query = query.eq('account_id', account_id);
      }
      if (search) {
        query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%`);
      }
      if (date_from) {
        query = query.gte('occurred_at', date_from);
      }
      if (date_to) {
        query = query.lte('occurred_at', date_to);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      // Check if there are more transactions
      const hasMore = transactions?.length === parseInt(limit as string);

      return res.status(200).json({ 
        data: transactions || [],
        pagination: {
          hasMore,
          offset: parseInt(offset as string),
          limit: parseInt(limit as string)
        }
      });
    }

    if (req.method === 'POST') {
      const { account_id, description, merchant, amount, direction, currency = 'USD', occurred_at, categories } = req.body;

      if (!account_id || !description || !amount || !direction) {
        return res.status(400).json({ error: 'Missing required fields: account_id, description, amount, direction' });
      }

      // Verify the account belongs to the household
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('household_id')
        .eq('id', account_id)
        .single();

      if (accountError || !account) {
        return res.status(400).json({ error: 'Invalid account_id' });
      }

      if (account.household_id !== household_id) {
        return res.status(403).json({ error: 'Account does not belong to this household' });
      }

      // Create the transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          household_id: household_id as string,
          account_id,
          user_id: user.id,
          description,
          merchant,
          amount: parseFloat(amount),
          direction,
          currency,
          occurred_at: occurred_at || new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      // Add categories if provided
      if (categories && categories.length > 0) {
        const categoryInserts = categories.map((cat: any) => ({
          transaction_id: transaction.id,
          category_id: cat.category_id,
          weight: cat.weight || 1.0
        }));

        const { error: categoryError } = await supabase
          .from('transaction_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.error('Error adding categories:', categoryError);
          // Don't fail the transaction creation for category errors
        }
      }

      // Fetch the complete transaction with categories
      const { data: completeTransaction } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();

      return res.status(201).json({ data: completeTransaction || transaction });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
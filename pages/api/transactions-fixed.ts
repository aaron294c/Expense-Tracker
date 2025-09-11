// pages/api/transactions-fixed.ts - Simplified transaction API
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserAndSupabase } from '@/lib/supabaseApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth check
  const { user, supabase, error } = await getUserAndSupabase(req, res);
  if (error || !user || !supabase) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const method = req.method || 'GET';
  const household_id = req.query.household_id ? String(req.query.household_id) : '';

  if (!household_id && method === 'POST') {
    return res.status(400).json({ error: 'household_id is required' });
  }

  try {
    if (method === 'POST') {
      const {
        account_id,
        description,
        merchant,
        amount,
        direction,
        occurred_at,
        categories
      } = req.body;

      console.log('Creating transaction:', {
        account_id,
        description,
        amount,
        direction,
        occurred_at,
        categories: categories?.length || 0
      });

      if (!account_id || !description || !amount || !direction) {
        return res.status(400).json({ 
          error: 'account_id, description, amount, and direction are required' 
        });
      }

      // Verify account belongs to user's household
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('household_id')
        .eq('id', account_id)
        .eq('household_id', household_id)
        .single();

      if (accountError || !account) {
        console.error('Account verification failed:', accountError);
        return res.status(404).json({ error: 'Account not found or not accessible' });
      }

      // Create the transaction
      const transactionData = {
        account_id,
        description,
        merchant: merchant || null,
        amount: parseFloat(amount),
        direction,
        occurred_at: occurred_at || new Date().toISOString(),
        household_id,
        currency: 'USD',
        type: direction === 'outflow' ? 'expense' : 'income' // Add the required type field
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select('id')
        .single();

      if (transactionError) {
        console.error('Transaction creation failed:', transactionError);
        return res.status(500).json({ 
          error: 'Failed to create transaction',
          details: transactionError.message 
        });
      }

      console.log('Transaction created with ID:', transaction.id);

      // If categories are provided, create the category relationships
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const categoryData = categories.map(cat => ({
          transaction_id: transaction.id,
          category_id: cat.category_id,
          weight: cat.weight || 1.0
        }));

        const { error: categoryError } = await supabase
          .from('transaction_categories')
          .insert(categoryData);

        if (categoryError) {
          console.warn('Category assignment failed:', categoryError);
          // Don't fail the transaction if category assignment fails
        } else {
          console.log('Categories assigned:', categoryData.length);
        }
      }

      // Update account balance
      const balanceChange = direction === 'inflow' ? amount : -amount;
      const { error: balanceError } = await supabase
        .rpc('update_account_balance', {
          account_id: account_id,
          amount_change: balanceChange
        });

      if (balanceError) {
        console.warn('Balance update failed:', balanceError);
        // Don't fail if balance update fails - transaction is still valid
      }

      return res.status(201).json({
        data: {
          id: transaction.id,
          ...transactionData
        }
      });
    }

    if (method === 'GET') {
      // Simple transaction fetch
      const limit = parseInt(String(req.query.limit || '20'));
      
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          id,
          account_id,
          description,
          merchant,
          amount,
          direction,
          occurred_at,
          currency,
          accounts(name),
          transaction_categories(
            category_id,
            weight,
            categories(name, icon, color)
          )
        `)
        .eq('household_id', household_id)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        console.error('Transaction fetch failed:', fetchError);
        return res.status(500).json({ 
          error: 'Failed to fetch transactions',
          details: fetchError.message 
        });
      }

      return res.status(200).json({ data: transactions || [] });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (e: any) {
    console.error('Transaction API error:', e);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: e.message || 'Unknown error'
    });
  }
}
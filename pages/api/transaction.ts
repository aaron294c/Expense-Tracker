// pages/api/transactions.ts - Complete transaction management
import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../lib/auth-middleware';

async function transactionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user, supabase } = req;
  const method = req.method ?? 'GET';
  const household_id = req.query.household_id ? String(req.query.household_id) : '';

  if (!household_id) {
    return res.status(400).json({ error: 'household_id is required' });
  }

  try {
    if (method === 'GET') {
      const limit = parseInt(String(req.query.limit || '20'));
      const offset = parseInt(String(req.query.offset || '0'));
      
      const { data, error } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('household_id', household_id)
        .order('occurred_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      const hasMore = data?.length === limit;
      
      return res.status(200).json({ 
        data: data || [], 
        pagination: { hasMore, limit, offset }
      });
    }

    if (method === 'POST') {
      const {
        account_id,
        description,
        merchant,
        amount,
        direction,
        occurred_at,
        currency = 'USD',
        categories
      } = req.body;

      if (!account_id || !description || !amount || !direction) {
        return res.status(400).json({ 
          error: 'account_id, description, amount, and direction are required' 
        });
      }

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          household_id,
          account_id,
          user_id: user.id,
          description,
          merchant: merchant || null,
          amount: parseFloat(amount),
          direction,
          occurred_at: occurred_at || new Date().toISOString(),
          currency
        })
        .select()
        .single();

      if (txError) {
        console.error('Error creating transaction:', txError);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      // Add categories if provided
      if (categories && categories.length > 0) {
        const categoryInserts = categories.map((cat: any) => ({
          transaction_id: transaction.id,
          category_id: cat.category_id,
          weight: cat.weight || 1.0
        }));

        const { error: catError } = await supabase
          .from('transaction_categories')
          .insert(categoryInserts);

        if (catError) {
          console.error('Error adding transaction categories:', catError);
          // Don't fail the transaction, just log the error
        }
      }

      // Fetch the full transaction with categories
      const { data: fullTransaction } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();

      return res.status(201).json({ data: fullTransaction || transaction });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Transaction API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(transactionsHandler);
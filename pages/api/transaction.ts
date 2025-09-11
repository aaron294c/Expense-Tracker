// pages/api/transactions.ts - Complete transaction management API
import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../lib/auth-middleware';

async function transactionsHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user, supabase } = req;
  const method = req.method ?? 'GET';
  const household_id = req.query.household_id ? String(req.query.household_id) : '';
  const transaction_id = req.query.id ? String(req.query.id) : '';

  if (!household_id && method !== 'PUT' && method !== 'DELETE') {
    return res.status(400).json({ error: 'household_id is required' });
  }

  try {
    if (method === 'GET') {
      const limit = parseInt(String(req.query.limit || '20'));
      const offset = parseInt(String(req.query.offset || '0'));
      const account_id = req.query.account_id ? String(req.query.account_id) : '';
      const category_id = req.query.category_id ? String(req.query.category_id) : '';
      const search = req.query.search ? String(req.query.search) : '';
      const date_from = req.query.date_from ? String(req.query.date_from) : '';
      const date_to = req.query.date_to ? String(req.query.date_to) : '';

      let query = supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('household_id', household_id)
        .order('occurred_at', { ascending: false });

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

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      // Filter by category if specified (since it's in the categories array)
      let filteredTransactions = transactions || [];
      if (category_id && filteredTransactions.length > 0) {
        filteredTransactions = filteredTransactions.filter(transaction => 
          transaction.categories?.some((cat: any) => cat.category_id === category_id)
        );
      }

      const hasMore = filteredTransactions.length === limit;
      
      return res.status(200).json({ 
        data: filteredTransactions, 
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

      // Verify account belongs to household
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('household_id')
        .eq('id', account_id)
        .eq('household_id', household_id)
        .single();

      if (accountError || !account) {
        return res.status(400).json({ error: 'Invalid account or account not found' });
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

      // Fetch the full transaction with categories using the view
      const { data: fullTransaction } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();

      return res.status(201).json({ data: fullTransaction || transaction });
    }

    if (method === 'PUT') {
      if (!transaction_id) {
        return res.status(400).json({ error: 'Transaction ID is required for updates' });
      }

      const {
        description,
        merchant,
        amount,
        direction,
        occurred_at,
        currency,
        categories
      } = req.body;

      // Verify transaction belongs to household
      const { data: existingTx, error: fetchError } = await supabase
        .from('transactions')
        .select('household_id')
        .eq('id', transaction_id)
        .single();

      if (fetchError || !existingTx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check permissions
      const { data: membership } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', existingTx.household_id)
        .eq('user_id', user.id)
        .single();

      if (!membership || !['owner', 'editor'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Update transaction
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (merchant !== undefined) updateData.merchant = merchant;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (direction !== undefined) updateData.direction = direction;
      if (occurred_at !== undefined) updateData.occurred_at = occurred_at;
      if (currency !== undefined) updateData.currency = currency;

      const { data: updatedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        return res.status(500).json({ error: 'Failed to update transaction' });
      }

      // Update categories if provided
      if (categories !== undefined) {
        // First, delete existing categories
        await supabase
          .from('transaction_categories')
          .delete()
          .eq('transaction_id', transaction_id);

        // Then add new ones
        if (categories.length > 0) {
          const categoryInserts = categories.map((cat: any) => ({
            transaction_id: transaction_id,
            category_id: cat.category_id,
            weight: cat.weight || 1.0
          }));

          const { error: catError } = await supabase
            .from('transaction_categories')
            .insert(categoryInserts);

          if (catError) {
            console.error('Error updating transaction categories:', catError);
          }
        }
      }

      // Fetch updated transaction with categories
      const { data: fullTransaction } = await supabase
        .from('v_recent_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();

      return res.status(200).json({ data: fullTransaction || updatedTransaction });
    }

    if (method === 'DELETE') {
      if (!transaction_id) {
        return res.status(400).json({ error: 'Transaction ID is required for deletion' });
      }

      // Verify transaction belongs to household and user has permission
      const { data: existingTx, error: fetchError } = await supabase
        .from('transactions')
        .select('household_id')
        .eq('id', transaction_id)
        .single();

      if (fetchError || !existingTx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check permissions
      const { data: membership } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', existingTx.household_id)
        .eq('user_id', user.id)
        .single();

      if (!membership || !['owner', 'editor'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Delete transaction (categories will be deleted by CASCADE)
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction_id);

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        return res.status(500).json({ error: 'Failed to delete transaction' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Transaction API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(transactionsHandler);
// /pages/api/transactions/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionCategoryInsert = Database['public']['Tables']['transaction_categories']['Insert'];

interface CreateTransactionBody {
  account_id: string;
  occurred_at: string;
  description: string;
  merchant?: string;
  amount: number;
  direction: 'inflow' | 'outflow';
  currency?: string;
  attachment_url?: string;
  categories?: {
    category_id: string;
    weight: number;
  }[];
}

interface TransactionFilters {
  household_id?: string;
  account_id?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user's household memberships
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id);

  const householdIds = memberships?.map(m => m.household_id) || [];
  if (householdIds.length === 0) {
    return res.status(403).json({ error: 'No household access' });
  }

  if (req.method === 'GET') {
    return handleGetTransactions(req, res, supabase, householdIds);
  } else if (req.method === 'POST') {
    return handleCreateTransaction(req, res, supabase, user.id, memberships);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetTransactions(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const {
    household_id,
    account_id,
    category_id,
    date_from,
    date_to,
    search,
    limit = '50',
    offset = '0'
  } = req.query as TransactionFilters;

  // Validate household access
  const targetHouseholdId = household_id || householdIds[0];
  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' });
  }

  try {
    let query = supabase
      .from('v_recent_transactions')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .order('occurred_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (account_id) {
      query = query.eq('account_id', account_id);
    }

    if (date_from) {
      query = query.gte('occurred_at', date_from);
    }

    if (date_to) {
      query = query.lte('occurred_at', date_to);
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    // If category filter, apply post-processing (since categories are in JSON array)
    let filteredTransactions = transactions;
    if (category_id && transactions) {
      filteredTransactions = transactions.filter(t => 
        t.categories?.some((cat: any) => cat.category_id === category_id)
      );
    }

    return res.status(200).json({
      data: filteredTransactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: filteredTransactions?.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateTransaction(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  userId: string,
  memberships: any[]
) {
  const body: CreateTransactionBody = req.body;

  // Validate required fields
  if (!body.account_id || !body.description || !body.amount || !body.direction) {
    return res.status(400).json({ 
      error: 'Missing required fields: account_id, description, amount, direction' 
    });
  }

  // Validate amount
  if (body.amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  // Validate categories weights sum to <= 1
  if (body.categories && body.categories.length > 0) {
    const totalWeight = body.categories.reduce((sum, cat) => sum + cat.weight, 0);
    if (totalWeight > 1.0001) { // Small tolerance for floating point
      return res.status(400).json({ error: 'Category weights must sum to 1.0 or less' });
    }

    // Normalize weights if they sum to less than 1
    if (totalWeight < 1 && body.categories.length === 1) {
      body.categories[0].weight = 1.0;
    }
  }

  try {
    // Get account and verify household access
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('household_id')
      .eq('id', body.account_id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === account.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Start transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        household_id: account.household_id,
        account_id: body.account_id,
        user_id: userId,
        occurred_at: body.occurred_at || new Date().toISOString(),
        description: body.description.trim(),
        merchant: body.merchant?.trim() || null,
        amount: body.amount,
        direction: body.direction,
        currency: body.currency || 'USD',
        attachment_url: body.attachment_url || null
      } as TransactionInsert)
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to create transaction' });
    }

    // Add categories if provided
    let categories: any[] = [];
    if (body.categories && body.categories.length > 0) {
      const categoryInserts = body.categories.map(cat => ({
        transaction_id: transaction.id,
        category_id: cat.category_id,
        weight: cat.weight
      } as TransactionCategoryInsert));

      const { data: createdCategories, error: categoryError } = await supabase
        .from('transaction_categories')
        .insert(categoryInserts)
        .select(`
          category_id,
          weight,
          categories (name, icon, color)
        `);

      if (categoryError) {
        console.error('Error creating transaction categories:', categoryError);
        // Don't fail the transaction, just log the error
      } else {
        categories = createdCategories;
      }
    }

    // Apply auto-categorization rules if no categories provided
    if (categories.length === 0 && body.merchant) {
      const { data: rules } = await supabase
        .from('categorization_rules')
        .select('category_id, categories (name, icon, color)')
        .eq('household_id', account.household_id)
        .or(`match_value.eq.${body.merchant},match_value.ilike.%${body.merchant}%`)
        .order('priority', { ascending: true })
        .limit(1);

      if (rules && rules.length > 0) {
        const { error: autoError } = await supabase
          .from('transaction_categories')
          .insert({
            transaction_id: transaction.id,
            category_id: rules[0].category_id,
            weight: 1.0
          });

        if (!autoError) {
          categories = [{
            category_id: rules[0].category_id,
            weight: 1.0,
            categories: rules[0].categories
          }];
        }
      }
    }

    return res.status(201).json({
      data: {
        ...transaction,
        categories
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
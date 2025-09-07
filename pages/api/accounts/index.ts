// pages/api/accounts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/supabase/types/database.types';
import { z } from 'zod';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['cash', 'current', 'credit', 'savings']),
  initial_balance: z.number().optional().default(0),
  currency: z.string().optional().default('USD')
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  is_archived: z.boolean().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Verify authentication
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

  switch (req.method) {
    case 'GET':
      return handleGetAccounts(req, res, supabase, householdIds);
    case 'POST':
      return handleCreateAccount(req, res, supabase, memberships);
    case 'PUT':
      return handleUpdateAccount(req, res, supabase, memberships);
    case 'DELETE':
      return handleDeleteAccount(req, res, supabase, memberships);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetAccounts(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id } = req.query;
  const targetHouseholdId = household_id as string || householdIds[0];

  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' });
  }

  try {
    const { data: accounts, error } = await supabase
      .from('v_account_balances')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .eq('is_archived', false)
      .order('name');

    if (error) {
      console.error('Error fetching accounts:', error);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }

    return res.status(200).json({ data: accounts || [] });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const validation = createAccountSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: validation.error.flatten() 
    });
  }

  const { household_id } = req.query;
  if (!household_id) {
    return res.status(400).json({ error: 'household_id is required' });
  }

  // Check permissions
  const membership = memberships.find(m => m.household_id === household_id);
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const accountData: AccountInsert = {
      household_id: household_id as string,
      name: validation.data.name,
      type: validation.data.type,
      initial_balance: validation.data.initial_balance,
      currency: validation.data.currency
    };

    const { data: account, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select(`
        *,
        v_account_balances!inner(*)
      `)
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    return res.status(201).json({ data: account });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  const validation = updateAccountSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: validation.error.flatten() 
    });
  }

  try {
    // Get account to verify household
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('household_id')
      .eq('id', id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check permissions
    const membership = memberships.find(m => m.household_id === account.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: updatedAccount, error } = await supabase
      .from('accounts')
      .update(validation.data as AccountUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      return res.status(500).json({ error: 'Failed to update account' });
    }

    return res.status(200).json({ data: updatedAccount });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  try {
    // Get account to verify household and check for transactions
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('household_id, name')
      .eq('id', id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check permissions
    const membership = memberships.find(m => m.household_id === account.household_id);
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete accounts' });
    }

    // Check for existing transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', id)
      .limit(1);

    if (transactionError) {
      console.error('Error checking transactions:', transactionError);
      return res.status(500).json({ error: 'Failed to check account usage' });
    }

    if (transactions && transactions.length > 0) {
      // Archive instead of delete if has transactions
      const { error: archiveError } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id);

      if (archiveError) {
        console.error('Error archiving account:', archiveError);
        return res.status(500).json({ error: 'Failed to archive account' });
      }

      return res.status(200).json({ 
        data: { message: 'Account archived (had existing transactions)' } 
      });
    } else {
      // Safe to delete
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        return res.status(500).json({ error: 'Failed to delete account' });
      }

      return res.status(200).json({ 
        data: { message: 'Account deleted successfully' } 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
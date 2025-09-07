// /pages/api/accounts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Database } from '@/src/types/supabase'
import { z } from 'zod'

type AccountInsert = Database['public']['Tables']['accounts']['Insert']

const createAccountSchema = z.object({
  household_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'current', 'credit', 'savings']),
  initial_balance: z.number().default(0),
  currency: z.string().length(3).default('USD'),
})

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  initial_balance: z.number().optional(),
  is_archived: z.boolean().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res })

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get user's household memberships
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)

  const householdIds = memberships?.map(m => m.household_id) || []
  if (householdIds.length === 0) {
    return res.status(403).json({ error: 'No household access' })
  }

  if (req.method === 'GET') {
    return handleGetAccounts(req, res, supabase, householdIds)
  } else if (req.method === 'POST') {
    return handleCreateAccount(req, res, supabase, memberships)
  } else if (req.method === 'PUT') {
    return handleUpdateAccount(req, res, supabase, memberships)
  } else if (req.method === 'DELETE') {
    return handleDeleteAccount(req, res, supabase, memberships)
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetAccounts(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id } = req.query

  // Validate household access
  const targetHouseholdId = household_id as string || householdIds[0]
  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' })
  }

  try {
    // Get accounts with current balances
    const { data: accounts, error } = await supabase
      .from('v_account_balances')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .eq('is_archived', false)
      .order('name')

    if (error) {
      console.error('Error fetching accounts:', error)
      return res.status(500).json({ error: 'Failed to fetch accounts' })
    }

    return res.status(200).json({
      data: accounts || []
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCreateAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  try {
    const body = createAccountSchema.parse(req.body)

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === body.household_id)
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Create account
    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        household_id: body.household_id,
        name: body.name,
        type: body.type,
        initial_balance: body.initial_balance,
        currency: body.currency,
      } as AccountInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return res.status(500).json({ error: 'Failed to create account' })
    }

    return res.status(201).json({
      data: account
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdateAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Account ID required' })
  }

  try {
    const body = updateAccountSchema.parse(req.body)

    // Get account to verify permissions
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('household_id')
      .eq('id', id)
      .single()

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === account.household_id)
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Update account
    const { data: updatedAccount, error } = await supabase
      .from('accounts')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      return res.status(500).json({ error: 'Failed to update account' })
    }

    return res.status(200).json({
      data: updatedAccount
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDeleteAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Account ID required' })
  }

  try {
    // Get account to verify permissions
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('household_id')
      .eq('id', id)
      .single()

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Check user has owner rights (only owners can delete accounts)
    const membership = memberships.find(m => m.household_id === account.household_id)
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Owner permissions required' })
    }

    // Check if account has transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', id)
      .limit(1)

    if (txError) {
      console.error('Error checking transactions:', txError)
      return res.status(500).json({ error: 'Failed to check account usage' })
    }

    if (transactions && transactions.length > 0) {
      // Archive instead of delete if has transactions
      const { data: archivedAccount, error } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error archiving account:', error)
        return res.status(500).json({ error: 'Failed to archive account' })
      }

      return res.status(200).json({
        data: { ...archivedAccount, archived: true },
        message: 'Account archived due to existing transactions'
      })
    } else {
      // Safe to delete
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting account:', error)
        return res.status(500).json({ error: 'Failed to delete account' })
      }

      return res.status(200).json({
        data: { message: 'Account deleted successfully' }
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
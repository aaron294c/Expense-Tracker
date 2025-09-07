// /pages/api/categories/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Database } from '@/src/types/supabase'
import { z } from 'zod'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

const createCategorySchema = z.object({
  household_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: z.enum(['expense', 'income']),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().default(0),
})

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.number().int().optional(),
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
    return handleGetCategories(req, res, supabase, householdIds)
  } else if (req.method === 'POST') {
    return handleCreateCategory(req, res, supabase, memberships)
  } else if (req.method === 'PUT') {
    return handleUpdateCategory(req, res, supabase, memberships)
  } else if (req.method === 'DELETE') {
    return handleDeleteCategory(req, res, supabase, memberships)
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetCategories(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id, kind } = req.query

  // Validate household access
  const targetHouseholdId = household_id as string || householdIds[0]
  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' })
  }

  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .order('kind')
      .order('position')
      .order('name')

    if (kind) {
      query = query.eq('kind', kind)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return res.status(500).json({ error: 'Failed to fetch categories' })
    }

    return res.status(200).json({
      data: categories || []
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCreateCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  try {
    const body = createCategorySchema.parse(req.body)

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === body.household_id)
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Check for duplicate name within household
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', body.household_id)
      .eq('name', body.name)
      .single()

    if (existing) {
      return res.status(409).json({ error: 'Category name already exists' })
    }

    // Create category
    const { data: category, error } = await supabase
      .from('categories')
      .insert(body as CategoryInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return res.status(500).json({ error: 'Failed to create category' })
    }

    return res.status(201).json({
      data: category
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

async function handleUpdateCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Category ID required' })
  }

  try {
    const body = updateCategorySchema.parse(req.body)

    // Get category to verify permissions
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id, name')
      .eq('id', id)
      .single()

    if (categoryError || !category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === category.household_id)
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Check for duplicate name if changing name
    if (body.name && body.name !== category.name) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', category.household_id)
        .eq('name', body.name)
        .neq('id', id)
        .single()

      if (existing) {
        return res.status(409).json({ error: 'Category name already exists' })
      }
    }

    // Update category
    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return res.status(500).json({ error: 'Failed to update category' })
    }

    return res.status(200).json({
      data: updatedCategory
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

async function handleDeleteCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Category ID required' })
  }

  try {
    // Get category to verify permissions
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id')
      .eq('id', id)
      .single()

    if (categoryError || !category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    // Check user has owner rights (only owners can delete categories)
    const membership = memberships.find(m => m.household_id === category.household_id)
    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Owner permissions required' })
    }

    // Check if category is used in transactions
    const { data: transactions, error: txError } = await supabase
      .from('transaction_categories')
      .select('transaction_id')
      .eq('category_id', id)
      .limit(1)

    if (txError) {
      console.error('Error checking category usage:', txError)
      return res.status(500).json({ error: 'Failed to check category usage' })
    }

    if (transactions && transactions.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category that is used in transactions'
      })
    }

    // Check if category is used in budgets
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (budgetError) {
      console.error('Error checking budget usage:', budgetError)
      return res.status(500).json({ error: 'Failed to check budget usage' })
    }

    if (budgets && budgets.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete category that is used in budgets'
      })
    }

    // Safe to delete
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return res.status(500).json({ error: 'Failed to delete category' })
    }

    return res.status(200).json({
      data: { message: 'Category deleted successfully' }
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
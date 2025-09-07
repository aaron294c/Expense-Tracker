// pages/api/categories/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/supabase/types/database.types';
import { z } from 'zod';

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  kind: z.enum(['expense', 'income']),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.number().optional()
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  position: z.number().optional()
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
      return handleGetCategories(req, res, supabase, householdIds);
    case 'POST':
      return handleCreateCategory(req, res, supabase, memberships);
    case 'PUT':
      return handleUpdateCategory(req, res, supabase, memberships);
    case 'DELETE':
      return handleDeleteCategory(req, res, supabase, memberships);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetCategories(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id, kind } = req.query;
  const targetHouseholdId = household_id as string || householdIds[0];

  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' });
  }

  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('household_id', targetHouseholdId)
      .order('kind')
      .order('position')
      .order('name');

    if (kind && ['expense', 'income'].includes(kind as string)) {
      query = query.eq('kind', kind);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    return res.status(200).json({ data: categories || [] });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const validation = createCategorySchema.safeParse(req.body);
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
    // Get next position if not provided
    let position = validation.data.position;
    if (position === undefined) {
      const { data: lastCategory } = await supabase
        .from('categories')
        .select('position')
        .eq('household_id', household_id)
        .eq('kind', validation.data.kind)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      position = (lastCategory?.position || 0) + 1;
    }

    const categoryData: CategoryInsert = {
      household_id: household_id as string,
      name: validation.data.name,
      kind: validation.data.kind,
      icon: validation.data.icon || null,
      color: validation.data.color || null,
      position
    };

    const { data: category, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }

    return res.status(201).json({ data: category });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  const validation = updateCategorySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: validation.error.flatten() 
    });
  }

  try {
    // Get category to verify household
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check permissions
    const membership = memberships.find(m => m.household_id === category.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(validation.data as CategoryUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }

    return res.status(200).json({ data: updatedCategory });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteCategory(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    // Get category to verify household
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id, name')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check permissions
    const membership = memberships.find(m => m.household_id === category.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check for existing usage
    const [
      { data: budgets },
      { data: transactionCategories },
      { data: rules }
    ] = await Promise.all([
      supabase.from('budgets').select('id').eq('category_id', id).limit(1),
      supabase.from('transaction_categories').select('id').eq('category_id', id).limit(1),
      supabase.from('categorization_rules').select('id').eq('category_id', id).limit(1)
    ]);

    if ((budgets && budgets.length > 0) || 
        (transactionCategories && transactionCategories.length > 0) || 
        (rules && rules.length > 0)) {
      return res.status(409).json({ 
        error: 'Cannot delete category that is in use',
        details: 'Category is referenced by budgets, transactions, or rules'
      });
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      return res.status(500).json({ error: 'Failed to delete category' });
    }

    return res.status(200).json({ 
      data: { message: 'Category deleted successfully' } 
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
// /pages/api/rules/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

type RuleInsert = Database['public']['Tables']['categorization_rules']['Insert'];

interface CreateRuleBody {
  household_id: string;
  match_type: 'merchant_exact' | 'merchant_contains' | 'description_contains';
  match_value: string;
  category_id: string;
  priority?: number;
}

interface CreateRuleFromTransactionBody {
  transaction_id: string;
  category_id: string;
  rule_type: 'merchant_exact' | 'merchant_contains';
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
    return handleGetRules(req, res, supabase, householdIds);
  } else if (req.method === 'POST') {
    return handleCreateRule(req, res, supabase, memberships);
  } else if (req.method === 'DELETE') {
    return handleDeleteRule(req, res, supabase, memberships);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetRules(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  householdIds: string[]
) {
  const { household_id } = req.query;

  // Validate household access
  const targetHouseholdId = household_id as string || householdIds[0];
  if (!householdIds.includes(targetHouseholdId)) {
    return res.status(403).json({ error: 'Invalid household access' });
  }

  try {
    const { data: rules, error } = await supabase
      .from('categorization_rules')
      .select(`
        *,
        categories (
          id,
          name,
          kind,
          icon,
          color
        )
      `)
      .eq('household_id', targetHouseholdId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rules:', error);
      return res.status(500).json({ error: 'Failed to fetch rules' });
    }

    return res.status(200).json({
      data: rules || []
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateRule(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { action } = req.query;

  if (action === 'from_transaction') {
    return handleCreateRuleFromTransaction(req, res, supabase, memberships);
  }

  const body: CreateRuleBody = req.body;

  // Validate required fields
  if (!body.household_id || !body.match_type || !body.match_value || !body.category_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: household_id, match_type, match_value, category_id' 
    });
  }

  // Validate match_type
  const validMatchTypes = ['merchant_exact', 'merchant_contains', 'description_contains'];
  if (!validMatchTypes.includes(body.match_type)) {
    return res.status(400).json({ 
      error: 'Invalid match_type. Must be one of: ' + validMatchTypes.join(', ')
    });
  }

  // Validate match_value
  if (body.match_value.trim().length === 0) {
    return res.status(400).json({ error: 'match_value cannot be empty' });
  }

  // Check user has editor rights
  const membership = memberships.find(m => m.household_id === body.household_id);
  if (!membership || !['owner', 'editor'].includes(membership.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    // Verify category belongs to household
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id')
      .eq('id', body.category_id)
      .single();

    if (categoryError || !category || category.household_id !== body.household_id) {
      return res.status(404).json({ error: 'Category not found or access denied' });
    }

    // Check for duplicate rules
    const { data: existingRule } = await supabase
      .from('categorization_rules')
      .select('id')
      .eq('household_id', body.household_id)
      .eq('match_type', body.match_type)
      .eq('match_value', body.match_value.trim())
      .single();

    if (existingRule) {
      return res.status(409).json({ error: 'Rule with same match criteria already exists' });
    }

    // Create the rule
    const { data: rule, error: ruleError } = await supabase
      .from('categorization_rules')
      .insert({
        household_id: body.household_id,
        match_type: body.match_type,
        match_value: body.match_value.trim(),
        category_id: body.category_id,
        priority: body.priority || 100
      } as RuleInsert)
      .select(`
        *,
        categories (
          id,
          name,
          kind,
          icon,
          color
        )
      `)
      .single();

    if (ruleError) {
      console.error('Error creating rule:', ruleError);
      return res.status(500).json({ error: 'Failed to create rule' });
    }

    return res.status(201).json({
      data: rule
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateRuleFromTransaction(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const body: CreateRuleFromTransactionBody = req.body;

  if (!body.transaction_id || !body.category_id || !body.rule_type) {
    return res.status(400).json({ 
      error: 'Missing required fields: transaction_id, category_id, rule_type' 
    });
  }

  try {
    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('household_id, merchant, description')
      .eq('id', body.transaction_id)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === transaction.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Determine match value based on rule type
    let matchValue: string;
    if (body.rule_type === 'merchant_exact') {
      if (!transaction.merchant) {
        return res.status(400).json({ error: 'Transaction has no merchant for exact match' });
      }
      matchValue = transaction.merchant.trim();
    } else if (body.rule_type === 'merchant_contains') {
      if (!transaction.merchant) {
        return res.status(400).json({ error: 'Transaction has no merchant for contains match' });
      }
      // Use the first word of the merchant name for contains matching
      matchValue = transaction.merchant.trim().split(' ')[0];
    } else {
      return res.status(400).json({ error: 'Invalid rule_type for transaction-based rule' });
    }

    // Verify category belongs to household
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('household_id')
      .eq('id', body.category_id)
      .single();

    if (categoryError || !category || category.household_id !== transaction.household_id) {
      return res.status(404).json({ error: 'Category not found or access denied' });
    }

    // Check for duplicate rules
    const { data: existingRule } = await supabase
      .from('categorization_rules')
      .select('id')
      .eq('household_id', transaction.household_id)
      .eq('match_type', body.rule_type)
      .eq('match_value', matchValue)
      .single();

    if (existingRule) {
      return res.status(409).json({ error: 'Rule with same match criteria already exists' });
    }

    // Create the rule with higher priority (lower number = higher priority)
    const { data: rule, error: ruleError } = await supabase
      .from('categorization_rules')
      .insert({
        household_id: transaction.household_id,
        match_type: body.rule_type,
        match_value: matchValue,
        category_id: body.category_id,
        priority: 10 // High priority for user-created rules
      } as RuleInsert)
      .select(`
        *,
        categories (
          id,
          name,
          kind,
          icon,
          color
        )
      `)
      .single();

    if (ruleError) {
      console.error('Error creating rule from transaction:', ruleError);
      return res.status(500).json({ error: 'Failed to create rule' });
    }

    // Apply the new rule to the transaction if it's not already categorized
    const { data: existingCategories } = await supabase
      .from('transaction_categories')
      .select('category_id')
      .eq('transaction_id', body.transaction_id);

    if (!existingCategories || existingCategories.length === 0) {
      await supabase
        .from('transaction_categories')
        .insert({
          transaction_id: body.transaction_id,
          category_id: body.category_id,
          weight: 1.0
        });
    }

    return res.status(201).json({
      data: {
        rule,
        applied_to_transaction: !existingCategories || existingCategories.length === 0
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteRule(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  memberships: any[]
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Rule ID required' });
  }

  try {
    // Get rule to verify permissions
    const { data: rule, error: ruleError } = await supabase
      .from('categorization_rules')
      .select('household_id')
      .eq('id', id)
      .single();

    if (ruleError || !rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Check user has editor rights
    const membership = memberships.find(m => m.household_id === rule.household_id);
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from('categorization_rules')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting rule:', deleteError);
      return res.status(500).json({ error: 'Failed to delete rule' });
    }

    return res.status(200).json({
      data: { message: 'Rule deleted successfully' }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
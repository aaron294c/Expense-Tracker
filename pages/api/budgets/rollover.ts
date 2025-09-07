// /pages/api/budgets/rollover.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Database } from '@/src/types/supabase'
import { z } from 'zod'

type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
type BudgetPeriodInsert = Database['public']['Tables']['budget_periods']['Insert']

const rolloverSchema = z.object({
  household_id: z.string().uuid(),
  from_month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Must be YYYY-MM-01 format'),
  to_month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Must be YYYY-MM-01 format'),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

  if (!memberships || memberships.length === 0) {
    return res.status(403).json({ error: 'No household access' })
  }

  try {
    const body = rolloverSchema.parse(req.body)

    // Check user has editor rights for the household
    const membership = memberships.find(m => m.household_id === body.household_id)
    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Validate that from_month is before to_month
    const fromDate = new Date(body.from_month)
    const toDate = new Date(body.to_month)
    
    if (fromDate >= toDate) {
      return res.status(400).json({ error: 'from_month must be before to_month' })
    }

    // Get categories with rollover enabled and their surplus/deficit from the source month
    const { data: rolloverData, error: rolloverError } = await supabase
      .from('v_monthly_category_summary')
      .select(`
        category_id, 
        category_name, 
        budget, 
        spent, 
        remaining, 
        rollover_enabled
      `)
      .eq('household_id', body.household_id)
      .eq('month', body.from_month)
      .eq('rollover_enabled', true)

    if (rolloverError) {
      console.error('Error fetching rollover data:', rolloverError)
      return res.status(500).json({ error: 'Failed to fetch rollover data' })
    }

    if (!rolloverData || rolloverData.length === 0) {
      return res.status(200).json({ 
        data: { 
          message: 'No categories with rollover enabled found',
          applied_adjustments: []
        }
      })
    }

    // Only process categories that have a surplus or deficit (remaining != 0)
    const categoriesToRollover = rolloverData.filter(item => item.remaining !== 0)

    if (categoriesToRollover.length === 0) {
      return res.status(200).json({ 
        data: { 
          message: 'No budget surplus or deficit to rollover',
          applied_adjustments: []
        }
      })
    }

    // Get or create target month budget period
    let { data: targetPeriod, error: targetPeriodError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('household_id', body.household_id)
      .eq('month', body.to_month)
      .single()

    if (!targetPeriod) {
      // Create the target period
      const { data: newPeriod, error: newPeriodError } = await supabase
        .from('budget_periods')
        .insert({
          household_id: body.household_id,
          month: body.to_month
        } as BudgetPeriodInsert)
        .select('id')
        .single()

      if (newPeriodError) {
        console.error('Error creating target period:', newPeriodError)
        return res.status(500).json({ error: 'Failed to create target budget period' })
      }

      targetPeriod = newPeriod
    }

    // Apply rollover adjustments
    const adjustments: any[] = []
    
    for (const item of categoriesToRollover) {
      try {
        // Get existing budget for target month
        const { data: existingBudget } = await supabase
          .from('budgets')
          .select('amount')
          .eq('period_id', targetPeriod.id)
          .eq('category_id', item.category_id)
          .single()

        const currentAmount = existingBudget?.amount || item.budget || 0
        const newAmount = Math.max(0, currentAmount + item.remaining)

        // Upsert the adjusted budget
        const { error: upsertError } = await supabase
          .from('budgets')
          .upsert({
            period_id: targetPeriod.id,
            category_id: item.category_id,
            amount: newAmount,
            rollover_enabled: true
          } as BudgetInsert, { 
            onConflict: 'period_id,category_id',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error(`Error updating budget for category ${item.category_id}:`, upsertError)
          // Continue with other categories instead of failing completely
          continue
        }

        adjustments.push({
          category_id: item.category_id,
          category_name: item.category_name,
          previous_amount: currentAmount,
          adjustment: item.remaining,
          new_amount: newAmount,
          surplus_or_deficit: item.remaining > 0 ? 'surplus' : 'deficit'
        })

      } catch (itemError) {
        console.error(`Error processing rollover for category ${item.category_id}:`, itemError)
        // Continue with other categories
        continue
      }
    }

    return res.status(200).json({
      data: {
        from_month: body.from_month,
        to_month: body.to_month,
        categories_processed: categoriesToRollover.length,
        adjustments_applied: adjustments.length,
        applied_adjustments: adjustments,
        message: `Successfully applied rollover for ${adjustments.length} categories`
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }
    console.error('Rollover API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
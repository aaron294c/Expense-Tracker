import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase as getClient } from '@/lib/supabaseBrowser'

type BurnRate = {
  spent: number
  budget: number
  remaining: number
  daily_average: number
  daily_burn_rate: number
  projected_monthly_spend: number
  remaining_days: number
  suggested_daily_spend: number
}

type CategoryItem = {
  household_id: string
  month: string
  category_id: string
  category_name: string
  category_kind: 'expense'|'income'
  icon: string | null
  color: string | null
  budget: number
  spent: number
  earned: number
  remaining: number
  budget_percentage: number
  transaction_count: number
  rollover_enabled: boolean | null
}

type BudgetsData = {
  burn_rate: BurnRate | null
  categories: CategoryItem[]
}

function monthRangeUTC(monthInput: string | Date) {
  const d = new Date(
    typeof monthInput === 'string'
      ? (monthInput.length === 7 ? `${monthInput}-01` : monthInput)
      : monthInput
  )
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  return { start, end }
}
function firstOfMonthDate(monthInput: string | Date): string {
  const d = new Date(
    typeof monthInput === 'string'
      ? (monthInput.length === 7 ? `${monthInput}-01` : monthInput)
      : monthInput
  )
  const iso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  return iso.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function useBudgets(householdId: string, month: string | Date) {
  const [data, setData] = useState<BudgetsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Support either a factory export or a ready client export
  const client = useMemo(() => {
    // @ts-expect-error runtime guard to support either pattern
    return typeof getClient === 'function' ? getClient() : getClient
  }, [])

  const { start, end } = useMemo(() => monthRangeUTC(month), [month])
  const monthFirst = useMemo(() => firstOfMonthDate(month), [month])

  const fetchAll = useCallback(async () => {
    if (!householdId) {
      setData({ burn_rate: null, categories: [] })
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      setError(null)

      // Fetch categories summary for the month
      const catQuery = client
        .from('v_monthly_category_summary')
        .select('*')
        .eq('household_id', householdId)
        .gte('month', start.toISOString())
        .lt('month', end.toISOString())
        .order('category_name', { ascending: true })

      // Fetch burn rate for the month (may be empty)
      const burnQuery = client
        .from('v_simple_burn_rate')
        .select('*')
        .eq('household_id', householdId)
        .gte('month', start.toISOString())
        .lt('month', end.toISOString())
        .maybeSingle()

      const [{ data: cats, error: catErr }, { data: burn, error: burnErr }] =
        await Promise.all([catQuery, burnQuery])

      if (catErr) throw catErr
      if (burnErr) throw burnErr

      const categories: CategoryItem[] = (cats ?? []).map((r: any) => ({
        household_id: r.household_id,
        month: r.month,
        category_id: r.category_id,
        category_name: r.category_name,
        category_kind: r.category_kind,
        icon: r.icon ?? null,
        color: r.color ?? null,
        budget: Number(r.budget ?? 0),
        spent: Number(r.spent ?? 0),
        earned: Number(r.earned ?? 0),
        remaining: Number(r.remaining ?? 0),
        budget_percentage: Number(r.budget_percentage ?? 0),
        transaction_count: Number(r.transaction_count ?? 0),
        rollover_enabled: r.rollover_enabled ?? null,
      }))

      const burn_rate: BurnRate | null = burn
        ? {
            spent: Number(burn.spent ?? 0),
            budget: Number(burn.budget ?? 0),
            remaining: Number(burn.remaining ?? 0),
            daily_average: Number(burn.daily_average ?? 0),
            daily_burn_rate: Number(burn.daily_burn_rate ?? 0),
            projected_monthly_spend: Number(burn.projected_monthly_spend ?? 0),
            remaining_days: Number(burn.remaining_days ?? 0),
            suggested_daily_spend: Number(burn.suggested_daily_spend ?? 0),
          }
        : null

      setData({ burn_rate, categories })
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Failed to load budgets')
      setData({ burn_rate: null, categories: [] })
    } finally {
      setIsLoading(false)
    }
  }, [client, householdId, start, end])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /**
   * Upsert budget lines for the selected month.
   * `updates`: [{ category_id, amount, rollover_enabled }]
   */
  const updateBudgets = useCallback(
    async (updates: Array<{ category_id: string; amount: number; rollover_enabled?: boolean }>) => {
      if (!householdId) return false

      // 1) Ensure budget_period exists
      const { data: bpRow, error: bpErr } = await client
        .from('budget_periods')
        .upsert(
          [{ household_id: householdId, month: monthFirst }],
          { onConflict: 'household_id,month' }
        )
        .select('id')
        .single()

      if (bpErr) {
        console.error('ensure budget_period', bpErr)
        setError(bpErr.message)
        return false
      }

      // 2) Upsert budgets for that period
      const rows = updates.map(u => ({
        period_id: bpRow.id,
        category_id: u.category_id,
        amount: Number.isFinite(u.amount) ? u.amount : 0,
        rollover_enabled: u.rollover_enabled ?? true,
      }))

      const { error: budErr } = await client
        .from('budgets')
        .upsert(rows, { onConflict: 'period_id,category_id' })

      if (budErr) {
        console.error('upsert budgets', budErr)
        setError(budErr.message)
        return false
      }

      await fetchAll()
      return true
    },
    [client, householdId, monthFirst, fetchAll]
  )

  /**
   * Apply rollover from `fromMonth` -> `toMonth`:
   * For categories with rollover_enabled=true, add last month’s positive `remaining`
   * to this month’s budget (create period/lines as needed).
   */
  const applyRollover = useCallback(
    async (fromMonth: string | Date, toMonth: string | Date) => {
      if (!householdId) return false

      const { start: fStart, end: fEnd } = monthRangeUTC(fromMonth)
      const toFirst = firstOfMonthDate(toMonth)

      // 1) Read previous-month remaining + rollover flags from the view
      const { data: prevCats, error: prevErr } = await client
        .from('v_monthly_category_summary')
        .select('category_id, remaining, rollover_enabled')
        .eq('household_id', householdId)
        .gte('month', fStart.toISOString())
        .lt('month', fEnd.toISOString())

      if (prevErr) {
        console.error('read previous month', prevErr)
        setError(prevErr.message)
        return false
      }

      // 2) Ensure target period exists
      const { data: toBp, error: toBpErr } = await client
        .from('budget_periods')
        .upsert([{ household_id: householdId, month: toFirst }], { onConflict: 'household_id,month' })
        .select('id')
        .single()

      if (toBpErr) {
        console.error('ensure target period', toBpErr)
        setError(toBpErr.message)
        return false
      }

      // 3) Fetch existing budgets for target period to add onto amounts
      const { data: toBudgets, error: tErr } = await client
        .from('budgets')
        .select('category_id, amount')
        .eq('period_id', toBp.id)

      if (tErr) {
        console.error('read target budgets', tErr)
        setError(tErr.message)
        return false
      }

      const existing = new Map<string, number>()
      for (const b of toBudgets ?? []) existing.set(b.category_id, Number(b.amount ?? 0))

      const rows = (prevCats ?? [])
        .filter((r: any) => r.rollover_enabled === true && Number(r.remaining ?? 0) > 0)
        .map((r: any) => {
          const prevRem = Number(r.remaining ?? 0)
          const base    = existing.get(r.category_id) ?? 0
          return {
            period_id: toBp.id,
            category_id: r.category_id,
            amount: base + prevRem,
            rollover_enabled: true,
          }
        })

      if (rows.length === 0) {
        await fetchAll()
        return true
      }

      const { error: upErr } = await client
        .from('budgets')
        .upsert(rows, { onConflict: 'period_id,category_id' })

      if (upErr) {
        console.error('apply rollover upsert', upErr)
        setError(upErr.message)
        return false
      }

      await fetchAll()
      return true
    },
    [client, householdId, fetchAll]
  )

  return { data, isLoading, error, updateBudgets, applyRollover }
}

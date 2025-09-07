// /hooks/useCategorySummary.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase as getClient } from '@/lib/supabaseBrowser'

export interface CategorySummary {
  household_id: string
  month: string // timestamptz ISO
  category_id: string
  category_name: string
  category_kind: 'expense' | 'income'
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

interface UseCategorySummaryReturn {
  summaries: CategorySummary[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  getTopCategories: (kind: 'expense' | 'income', limit?: number) => CategorySummary[]
  getTotalSpent: () => number
  getTotalBudget: () => number
  getBudgetUtilization: () => number
}

/** Accepts 'YYYY-MM', 'YYYY-MM-01', or any ISO date string and returns the UTC month range */
function monthRangeUTC(monthStr: string) {
  // Normalize to first-of-month UTC
  const m = monthStr.length === 7 ? `${monthStr}-01` : monthStr
  const d = new Date(m)
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  return { start, end }
}

export function useCategorySummary(
  householdId: string | null,
  month: string
): UseCategorySummaryReturn {
  const [summaries, setSummaries] = useState<CategorySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // instantiate client (adjust depending on your export)
  // If your supabaseBrowser exports a *client instance*, do: const client = getClient
  // If it exports a *factory function* (recommended), do: const client = getClient()
  const client = useMemo(() => {
    // @ts-expect-error runtime guard to support either export style
    return typeof getClient === 'function' ? getClient() : getClient
  }, [])

  const { start, end } = useMemo(() => monthRangeUTC(month), [month])

  const fetchSummaries = useCallback(async () => {
    if (!householdId) {
      setSummaries([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: queryError } = await client
        .from('v_monthly_category_summary')
        .select('*')
        .eq('household_id', householdId)
        .gte('month', start.toISOString())
        .lt('month', end.toISOString())
        .order('spent', { ascending: false })

      if (queryError) throw queryError

      // Parse numerics that come back as strings
      const parsed = (data ?? []).map((r: any) => ({
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
      })) as CategorySummary[]

      setSummaries(parsed)
    } catch (err: any) {
      console.error('Error fetching category summaries:', err)
      setError(err?.message ?? 'Failed to fetch category summaries')
      setSummaries([])
    } finally {
      setIsLoading(false)
    }
  }, [client, householdId, start, end])

  useEffect(() => {
    fetchSummaries()
  }, [fetchSummaries])

  // Subscribe to realtime changes that can affect the view
  useEffect(() => {
    if (!householdId) return
    const chan = client
      .channel(`cat_summary_${householdId}_${start.toISOString().slice(0,7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `household_id=eq.${householdId}` }, fetchSummaries)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_categories' }, fetchSummaries)
      // budgets has no household_id column; still refetch (RLS will scope)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchSummaries)
      .subscribe()

    return () => { client.removeChannel?.(chan) }
  }, [client, householdId, start, fetchSummaries])

  const getTopCategories = useCallback((kind: 'expense' | 'income', limit = 5) => {
    const sorted = [...summaries].filter(s => s.category_kind === kind).sort((a, b) =>
      kind === 'expense' ? b.spent - a.spent : b.earned - a.earned
    )
    return sorted.slice(0, limit)
  }, [summaries])

  const getTotalSpent = useCallback(() =>
    summaries.filter(s => s.category_kind === 'expense').reduce((t, s) => t + s.spent, 0)
  , [summaries])

  const getTotalBudget = useCallback(() =>
    summaries.filter(s => s.category_kind === 'expense').reduce((t, s) => t + s.budget, 0)
  , [summaries])

  const getBudgetUtilization = useCallback(() => {
    const totalBudget = getTotalBudget()
    if (!totalBudget) return 0
    return (getTotalSpent() / totalBudget) * 100
  }, [getTotalBudget, getTotalSpent])

  return { summaries, isLoading, error, refetch: fetchSummaries, getTopCategories, getTotalSpent, getTotalBudget, getBudgetUtilization }
}

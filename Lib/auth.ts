// /lib/auth.ts
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { createServerSupabaseClient } from './supabaseServer'
import { Database } from '@/src/types/supabase'

type User = Database['public']['Tables']['users']['Row'] & {
  id: string
  email?: string
}

type Household = Database['public']['Tables']['households']['Row']

type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  households?: Household
}

interface AuthContext {
  user: User
  supabase: ReturnType<typeof createServerSupabaseClient>
}

interface HouseholdContext extends AuthContext {
  household: Household
  membership: HouseholdMember
  memberships: HouseholdMember[]
}

// Get authenticated user from server context
export async function getUserServer(context: GetServerSidePropsContext): Promise<{
  user: User | null
  supabase: ReturnType<typeof createServerSupabaseClient>
}> {
  const supabase = createServerSupabaseClient(context)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, supabase }
  }

  return { user: user as User, supabase }
}

// Require authentication for a page
export function requireAuth<P extends Record<string, any> = Record<string, any>>(
  handler: (context: GetServerSidePropsContext, authContext: AuthContext) => Promise<GetServerSidePropsResult<P>> | GetServerSidePropsResult<P>
) {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const { user, supabase } = await getUserServer(context)
    
    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }

    return handler(context, { user, supabase })
  }
}

// Require household membership for a page
export function requireHousehold<P extends Record<string, any> = Record<string, any>>(
  handler: (context: GetServerSidePropsContext, householdContext: HouseholdContext) => Promise<GetServerSidePropsResult<P>> | GetServerSidePropsResult<P>
) {
  return requireAuth<P>(async (context, authContext) => {
    const { user, supabase } = authContext

    // Get user's household memberships
    const { data: memberships, error } = await supabase
      .from('household_members')
      .select(`
        *,
        households (*)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error || !memberships || memberships.length === 0) {
      return {
        redirect: {
          destination: '/onboarding',
          permanent: false,
        },
      }
    }

    // Use first household as default
    const membership = memberships[0]
    const household = membership.households

    if (!household) {
      return {
        redirect: {
          destination: '/onboarding',
          permanent: false,
        },
      }
    }

    return handler(context, {
      user,
      supabase,
      household,
      membership,
      memberships: memberships as HouseholdMember[]
    })
  })
}

// Check if user has editor or owner rights
export function hasEditorRights(membership: HouseholdMember): boolean {
  return ['owner', 'editor'].includes(membership.role)
}

// Check if user has owner rights
export function hasOwnerRights(membership: HouseholdMember): boolean {
  return membership.role === 'owner'
}
// lib/supabase.ts - Single source of truth for Supabase configuration
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { GetServerSidePropsContext } from 'next'
import { cookies } from 'next/headers'
import type { Database } from '@/supabase/types/database.types'

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// ============================================================================
// BROWSER CLIENT (Client Components)
// ============================================================================
export const createBrowserClient = () => {
  return createClientComponentClient<Database>()
}

// Default browser client instance
export const supabase = createBrowserClient()

// ============================================================================
// SERVER CLIENT (API Routes & Server Components)  
// ============================================================================
export type ServerContext = 
  | { req: NextApiRequest; res: NextApiResponse }
  | GetServerSidePropsContext

export const createServerClient = (context?: ServerContext) => {
  if (context) {
    // For API routes and SSR
    return createServerComponentClient<Database>({ 
      cookies: () => {
        if ('cookies' in context.req) {
          // Next.js API route
          return context.req.cookies
        } else {
          // SSR context
          return context.req.cookies
        }
      }
    })
  } else {
    // For App Router server components
    return createServerComponentClient<Database>({ 
      cookies 
    })
  }
}

// ============================================================================
// SERVICE CLIENT (Admin Operations)
// ============================================================================
export const createServiceClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service operations')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// AUTHENTICATED FETCH UTILITY
// ============================================================================
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No active session')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type { Database }
export type SupabaseClient = ReturnType<typeof createBrowserClient>
export type SupabaseServerClient = ReturnType<typeof createServerClient>
export type SupabaseServiceClient = ReturnType<typeof createServiceClient>
// lib/auth.ts - Unified authentication middleware and utilities
import { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@supabase/supabase-js'
import { createServerClient, SupabaseServerClient } from './supabase'

// ============================================================================
// TYPES
// ============================================================================
export interface AuthenticatedRequest extends NextApiRequest {
  user: User
  supabase: SupabaseServerClient
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void

export interface AuthError {
  error: string
  status: number
  details?: any
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now()
    const logPrefix = `[${req.method}] ${req.url}`
    
    try {
      // Create Supabase client with request context
      const supabase = createServerClient({ req, res })
      
      // Get user from JWT token
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error(`${logPrefix} - Auth error:`, authError.message)
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        })
      }
      
      if (!user) {
        console.warn(`${logPrefix} - No authenticated user found`)
        return res.status(401).json({ 
          error: 'No authenticated user' 
        })
      }

      // Log successful authentication
      console.log(`${logPrefix} - User: ${user.id} (${user.email})`)
      
      // Add user and supabase client to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user
      authenticatedReq.supabase = supabase

      // Call the actual handler
      await handler(authenticatedReq, res)
      
      // Log completion time
      const duration = Date.now() - startTime
      console.log(`${logPrefix} - Completed in ${duration}ms`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`${logPrefix} - Error after ${duration}ms:`, error)
      
      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error'
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: message,
          ...(process.env.NODE_ENV === 'development' && { 
            stack: error instanceof Error ? error.stack : undefined 
          })
        })
      }
    }
  }
}

// ============================================================================
// OPTIONAL AUTH MIDDLEWARE (for endpoints that work with or without auth)
// ============================================================================
export function withOptionalAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const supabase = createServerClient({ req, res })
      const { data: { user } } = await supabase.auth.getUser()
      
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user! // Could be null
      authenticatedReq.supabase = supabase

      await handler(authenticatedReq, res)
      
    } catch (error) {
      console.error(`[${req.method}] ${req.url} - Error:`, error)
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Internal server error'
        })
      }
    }
  }
}

// ============================================================================
// ROLE-BASED AUTH UTILITIES
// ============================================================================
export async function requireHouseholdMember(
  supabase: SupabaseServerClient,
  userId: string,
  householdId: string
): Promise<{ member: any; household: any } | AuthError> {
  
  const { data: member, error } = await supabase
    .from('household_members')
    .select(`
      *,
      households (*)
    `)
    .eq('user_id', userId)
    .eq('household_id', householdId)
    .single()

  if (error || !member) {
    return {
      error: 'Not a member of this household',
      status: 403,
      details: error?.message
    }
  }

  return { member, household: member.households }
}

export async function requireHouseholdEditor(
  supabase: SupabaseServerClient,
  userId: string,
  householdId: string
): Promise<{ member: any; household: any } | AuthError> {
  
  const result = await requireHouseholdMember(supabase, userId, householdId)
  
  if ('error' in result) {
    return result
  }

  if (!['owner', 'editor'].includes(result.member.role)) {
    return {
      error: 'Insufficient permissions - editor role required',
      status: 403
    }
  }

  return result
}

export async function requireHouseholdOwner(
  supabase: SupabaseServerClient,
  userId: string,
  householdId: string
): Promise<{ member: any; household: any } | AuthError> {
  
  const result = await requireHouseholdMember(supabase, userId, householdId)
  
  if ('error' in result) {
    return result
  }

  if (result.member.role !== 'owner') {
    return {
      error: 'Insufficient permissions - owner role required',
      status: 403
    }
  }

  return result
}

// ============================================================================
// USER PROFILE UTILITIES
// ============================================================================
export async function getOrCreateProfile(
  supabase: SupabaseServerClient,
  user: User
) {
  // Try to get existing profile
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it
  if (error && error.code === 'PGRST116') {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create profile: ${createError.message}`)
    }

    profile = newProfile
  } else if (error) {
    throw new Error(`Failed to get profile: ${error.message}`)
  }

  return profile
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================
export const AuthResponses = {
  success: <T>(data: T, status = 200) => ({ status, data }),
  
  error: (message: string, status = 500, details?: any) => ({
    status,
    error: message,
    ...(process.env.NODE_ENV === 'development' && details && { details })
  }),
  
  unauthorized: (message = 'Unauthorized') => 
    AuthResponses.error(message, 401),
  
  forbidden: (message = 'Forbidden') => 
    AuthResponses.error(message, 403),
  
  notFound: (message = 'Not found') => 
    AuthResponses.error(message, 404),
  
  validation: (message: string, details?: any) => 
    AuthResponses.error(message, 400, details)
}
// lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { NextApiRequest, NextApiResponse } from 'next'
import { GetServerSidePropsContext } from 'next'
import { Database } from '@/supabase/types/database.types'

export const createServerSupabaseClient = (
  context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }
) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          context.res.setHeader('Set-Cookie', [
            `${name}=${value}; ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join('; ')}`
          ])
        },
        remove(name: string, options: any) {
          context.res.setHeader('Set-Cookie', [
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
              .map(([k, v]) => `${k}=${v}`)
              .join('; ')}`
          ])
        },
      },
    }
  )
}

// For API routes with service role access
export const createServiceSupabaseClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  )
}
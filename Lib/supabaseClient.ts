// lib/supabaseClient.ts (Browser client)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/types/database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// lib/supabaseServer.ts (Server-side client)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/supabase/types/database.types';

export const createServerClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

// For API routes
export const supabaseServer = createServerClient;
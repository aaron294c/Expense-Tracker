// lib/supabaseBrowser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/supabase/types/database.types';

// Ensure environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export function createClient() {
  return createClientComponentClient<Database>();
}

export const supabase = createClient();
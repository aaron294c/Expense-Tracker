// src/lib/supabaseBrowser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

export function createClient() {
  return createClientComponentClient<Database>();
}

export const supabase = createClient();

// /lib/supabaseBrowser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export const createClient = () => createClientComponentClient<Database>();

export const supabase = createClient();
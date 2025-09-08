import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export const supabase = createClientComponentClient<Database>();

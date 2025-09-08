import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/src/types/supabase';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url/') {
    console.error('Missing or invalid Supabase environment variables');
    throw new Error('Please configure your Supabase environment variables in .env.local');
  }

  return createClientComponentClient<Database>();
};

export const supabase = createClient();

// Lib/supabaseBrowser.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a type for the database schema - you can expand this later
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
      };
    };
  };
};

export const createClient = () => createClientComponentClient<Database>();

export const supabase = createClient();
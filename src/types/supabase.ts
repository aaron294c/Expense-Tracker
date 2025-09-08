export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          settings: any;
          base_currency: string;
        };
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['households']['Insert']>;
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          joined_at: string;
          invited_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['household_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['household_members']['Insert']>;
      };
      accounts: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: 'cash' | 'current' | 'credit' | 'savings';
          initial_balance: number;
          currency: string;
          created_at: string;
          is_archived: boolean;
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          kind: 'expense' | 'income';
          icon: string;
          color: string;
          created_at: string;
          position: number;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          user_id: string;
          occurred_at: string;
          description: string;
          merchant: string | null;
          amount: number;
          direction: 'inflow' | 'outflow';
          currency: string;
          attachment_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      transaction_categories: {
        Row: {
          id: string;
          transaction_id: string;
          category_id: string;
          weight: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transaction_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transaction_categories']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          period_id: string;
          category_id: string;
          amount: number;
          rollover_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      budget_periods: {
        Row: {
          id: string;
          household_id: string;
          month: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budget_periods']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['budget_periods']['Insert']>;
      };
      categorization_rules: {
        Row: {
          id: string;
          household_id: string;
          match_type: 'merchant_exact' | 'merchant_contains' | 'description_contains';
          match_value: string;
          category_id: string;
          priority: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categorization_rules']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categorization_rules']['Insert']>;
      };
    };
    Views: {
      v_recent_transactions: {
        Row: {
          id: string;
          household_id: string;
          account_id: string;
          account_name: string;
          user_id: string;
          occurred_at: string;
          description: string;
          merchant: string | null;
          amount: number;
          direction: 'inflow' | 'outflow';
          currency: string;
          attachment_url: string | null;
          created_at: string;
          categories: Array<{
            category_id: string;
            category_name: string;
            icon: string;
            color: string;
            weight: number;
          }>;
          primary_category_name: string;
          primary_category_icon: string;
        };
      };
      v_account_balances: {
        Row: {
          account_id: string;
          household_id: string;
          name: string;
          type: string;
          initial_balance: number;
          currency: string;
          is_archived: boolean;
          current_balance: number;
          transaction_count: number;
          last_transaction_at: string | null;
        };
      };
      v_monthly_category_summary: {
        Row: {
          household_id: string;
          month: string;
          category_id: string;
          category_name: string;
          kind: string;
          budget: number;
          spent: number;
          remaining: number;
          rollover_enabled: boolean;
        };
      };
      v_simple_burn_rate: {
        Row: {
          household_id: string;
          month: string;
          daily_average: number;
          days_remaining: number;
          projected_total: number;
        };
      };
    };
  };
}

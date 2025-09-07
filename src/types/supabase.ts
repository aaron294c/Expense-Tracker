export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null
          currency: string | null
          household_id: string
          id: string
          initial_balance: number | null
          is_archived: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          household_id: string
          id?: string
          initial_balance?: number | null
          is_archived?: boolean
          name: string
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          household_id?: string
          id?: string
          initial_balance?: number | null
          is_archived?: boolean
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_periods: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          month: string
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          month: string
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_periods_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          period_id: string
          rollover_enabled: boolean | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          period_id: string
          rollover_enabled?: boolean | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          period_id?: string
          rollover_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "budget_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          household_id: string
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          household_id: string
          icon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      categorization_rules: {
        Row: {
          category_id: string
          created_at: string | null
          household_id: string
          id: string
          match_type: Database["public"]["Enums"]["rule_match_type"]
          match_value: string
          priority: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          household_id: string
          id?: string
          match_type: Database["public"]["Enums"]["rule_match_type"]
          match_value: string
          priority?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          household_id?: string
          id?: string
          match_type?: Database["public"]["Enums"]["rule_match_type"]
          match_value?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categorization_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorization_rules_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          base_currency: string
          created_at: string | null
          id: string
          name: string
          settings: Json | null
        }
        Insert: {
          base_currency?: string
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
        }
        Update: {
          base_currency?: string
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          category_id: string
          id: string
          transaction_id: string
          weight: number | null
        }
        Insert: {
          category_id: string
          id?: string
          transaction_id: string
          weight?: number | null
        }
        Update: {
          category_id?: string
          id?: string
          transaction_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recent_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          attachment_url: string | null
          created_at: string | null
          currency: string | null
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          household_id: string
          id: string
          merchant: string | null
          occurred_at: string
          user_id: string | null
        }
        Insert: {
          account_id: string
          amount: number
          attachment_url?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          household_id: string
          id?: string
          merchant?: string | null
          occurred_at: string
          user_id?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          attachment_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          direction?: Database["public"]["Enums"]["transaction_direction"]
          household_id?: string
          id?: string
          merchant?: string | null
          occurred_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_account_balances: {
        Row: {
          account_id: string | null
          currency: string | null
          current_balance: number | null
          household_id: string | null
          initial_balance: number | null
          is_archived: boolean | null
          last_transaction_at: string | null
          name: string | null
          transaction_count: number | null
          type: Database["public"]["Enums"]["account_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monthly_category_summary: {
        Row: {
          budget: number | null
          budget_percentage: number | null
          category_id: string | null
          category_kind: Database["public"]["Enums"]["category_kind"] | null
          category_name: string | null
          color: string | null
          earned: number | null
          household_id: string | null
          icon: string | null
          month: string | null
          remaining: number | null
          rollover_enabled: boolean | null
          spent: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      v_recent_transactions: {
        Row: {
          account_id: string | null
          account_name: string | null
          amount: number | null
          attachment_url: string | null
          categories: Json[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          direction: Database["public"]["Enums"]["transaction_direction"] | null
          household_id: string | null
          id: string | null
          merchant: string | null
          occurred_at: string | null
          primary_category_icon: string | null
          primary_category_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      v_simple_burn_rate: {
        Row: {
          budget: number | null
          daily_average: number | null
          daily_burn_rate: number | null
          household_id: string | null
          month: string | null
          projected_monthly_spend: number | null
          remaining: number | null
          remaining_days: number | null
          spent: number | null
          suggested_daily_spend: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_editor_rights: {
        Args: { h_id: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { h_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "cash" | "current" | "credit" | "savings"
      category_kind: "expense" | "income"
      household_role: "owner" | "editor" | "viewer"
      rule_match_type:
        | "merchant_exact"
        | "merchant_contains"
        | "description_contains"
      transaction_direction: "outflow" | "inflow"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["cash", "current", "credit", "savings"],
      category_kind: ["expense", "income"],
      household_role: ["owner", "editor", "viewer"],
      rule_match_type: [
        "merchant_exact",
        "merchant_contains",
        "description_contains",
      ],
      transaction_direction: ["outflow", "inflow"],
    },
  },
} as const

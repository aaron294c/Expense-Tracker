// types/app.contracts.ts
import type { Database } from '@/supabase/types/database.types';

// Type helpers for clean code
type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];
type Enums = Database['public']['Enums'];

export type Row<T extends keyof Tables> = Tables[T]['Row'];
export type Insert<T extends keyof Tables> = Tables[T]['Insert'];
export type Update<T extends keyof Tables> = Tables[T]['Update'];
export type ViewRow<T extends keyof Views> = Views[T]['Row'];

// Core entity types
export type Household = Row<'households'>;
export type HouseholdMember = Row<'household_members'>;
export type Account = Row<'accounts'>;
export type Category = Row<'categories'>;
export type Transaction = Row<'transactions'>;
export type Budget = Row<'budgets'>;
export type BudgetPeriod = Row<'budget_periods'>;
export type CategorizationRule = Row<'categorization_rules'>;
export type TransactionCategory = Row<'transaction_categories'>;

// Enhanced types with relations
export interface HouseholdWithMembers extends Household {
  household_members: HouseholdMember[];
}

export interface TransactionWithDetails extends Transaction {
  account_name: string;
  categories: {
    category_id: string;
    category_name: string;
    icon: string;
    color: string;
    weight: number;
  }[];
  primary_category_name?: string;
  primary_category_icon?: string;
}

export interface CategoryWithBudget extends Category {
  budget?: number;
  spent?: number;
  earned?: number;
  remaining?: number;
  budget_percentage?: number;
  transaction_count?: number;
  rollover_enabled?: boolean;
}

export interface AccountWithBalance extends Account {
  current_balance: number;
  transaction_count: number;
  last_transaction_at?: string;
}

// API Request/Response contracts
export namespace API {
  // Authentication
  export interface SessionResponse {
    user: {
      id: string;
      email: string;
    } | null;
    households: HouseholdMember[];
    currentHousehold: Household | null;
  }

  // Accounts
  export interface CreateAccountRequest {
    name: string;
    type: Enums['account_type'];
    initial_balance?: number;
    currency?: string;
  }

  export interface UpdateAccountRequest {
    name?: string;
    is_archived?: boolean;
  }

  export interface AccountsResponse {
    data: AccountWithBalance[];
  }

  // Categories  
  export interface CreateCategoryRequest {
    name: string;
    kind: Enums['category_kind'];
    icon?: string;
    color?: string;
    position?: number;
  }

  export interface UpdateCategoryRequest {
    name?: string;
    icon?: string;
    color?: string;
    position?: number;
  }

  export interface CategoriesResponse {
    data: Category[];
  }

  // Transactions
  export interface CreateTransactionRequest {
    account_id: string;
    occurred_at?: string;
    description: string;
    merchant?: string;
    amount: number;
    direction: Enums['transaction_direction'];
    currency?: string;
    attachment_url?: string;
    categories?: {
      category_id: string;
      weight: number;
    }[];
  }

  export interface TransactionFilters {
    household_id?: string;
    account_id?: string;
    category_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }

  export interface TransactionsResponse {
    data: TransactionWithDetails[];
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }

  // Budgets
  export interface CreateBudgetRequest {
    month: string; // YYYY-MM-01
    category_budgets: {
      category_id: string;
      amount: number;
      rollover_enabled?: boolean;
    }[];
  }

  export interface ApplyRolloverRequest {
    from_month: string;
    to_month: string;
    household_id: string;
  }

  export interface BudgetData {
    month: string;
    household_id: string;
    categories: ViewRow<'v_monthly_category_summary'>[];
    burn_rate: ViewRow<'v_simple_burn_rate'> | null;
    all_categories: Category[];
  }

  export interface BudgetsResponse {
    data: BudgetData;
  }

  // Rules
  export interface CreateRuleRequest {
    household_id: string;
    match_type: Enums['rule_match_type'];
    match_value: string;
    category_id: string;
    priority?: number;
  }

  export interface CreateRuleFromTransactionRequest {
    transaction_id: string;
    category_id: string;
    rule_type: 'merchant_exact' | 'merchant_contains';
  }

  export interface RuleWithCategory extends CategorizationRule {
    categories: Category;
  }

  export interface RulesResponse {
    data: RuleWithCategory[];
  }

  // Households
  export interface CreateHouseholdRequest {
    name: string;
    base_currency?: string;
  }

  export interface UpdateHouseholdRequest {
    name?: string;
    base_currency?: string;
    settings?: any;
  }

  export interface HouseholdsResponse {
    data: HouseholdWithMembers[];
  }

  // Common error response
  export interface ErrorResponse {
    error: string;
    details?: any;
  }

  // Common success response
  export interface SuccessResponse<T = any> {
    data: T;
    message?: string;
  }
}

// Hook return types
export namespace Hooks {
  export interface UseAuthReturn {
    user: API.SessionResponse['user'];
    households: HouseholdMember[];
    currentHousehold: Household | null;
    isLoading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    switchHousehold: (householdId: string) => void;
  }

  export interface UseAccountsReturn {
    accounts: AccountWithBalance[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    createAccount: (data: API.CreateAccountRequest) => Promise<AccountWithBalance | null>;
    updateAccount: (id: string, data: API.UpdateAccountRequest) => Promise<boolean>;
    deleteAccount: (id: string) => Promise<boolean>;
  }

  export interface UseCategoriesReturn {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    createCategory: (data: API.CreateCategoryRequest) => Promise<Category | null>;
    updateCategory: (id: string, data: API.UpdateCategoryRequest) => Promise<boolean>;
    deleteCategory: (id: string) => Promise<boolean>;
    getCategoriesByKind: (kind: Enums['category_kind']) => Category[];
  }

  export interface UseTransactionsReturn {
    transactions: TransactionWithDetails[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    createTransaction: (data: API.CreateTransactionRequest) => Promise<TransactionWithDetails | null>;
    setFilters: (filters: API.TransactionFilters) => void;
    filters: API.TransactionFilters;
  }

  export interface UseBudgetsReturn {
    data: API.BudgetData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateBudgets: (budgets: { category_id: string; amount: number; rollover_enabled?: boolean }[]) => Promise<boolean>;
    applyRollover: (fromMonth: string, toMonth: string) => Promise<boolean>;
  }

  export interface UseRulesReturn {
    rules: API.RuleWithCategory[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    createRule: (data: API.CreateRuleRequest) => Promise<API.RuleWithCategory | null>;
    createRuleFromTransaction: (data: API.CreateRuleFromTransactionRequest) => Promise<API.RuleWithCategory | null>;
    deleteRule: (ruleId: string) => Promise<boolean>;
    getRulesByPriority: () => API.RuleWithCategory[];
    getRulesByMatchType: (matchType: string) => API.RuleWithCategory[];
  }
}

// Utility types
export type HouseholdRole = Enums['household_role'];
export type AccountType = Enums['account_type'];
export type CategoryKind = Enums['category_kind'];
export type TransactionDirection = Enums['transaction_direction'];
export type RuleMatchType = Enums['rule_match_type'];
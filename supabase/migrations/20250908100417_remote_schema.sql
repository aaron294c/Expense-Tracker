drop extension if exists "pg_net";

create type "public"."account_type" as enum ('cash', 'current', 'credit', 'savings');

create type "public"."category_kind" as enum ('expense', 'income');

create type "public"."household_role" as enum ('owner', 'editor', 'viewer');

create type "public"."rule_match_type" as enum ('merchant_exact', 'merchant_contains', 'description_contains');

create type "public"."transaction_direction" as enum ('outflow', 'inflow');


  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "name" text not null,
    "type" account_type not null,
    "initial_balance" numeric(12,2) default 0,
    "currency" text default 'USD'::text,
    "created_at" timestamp with time zone default now(),
    "is_archived" boolean not null default false
      );


alter table "public"."accounts" enable row level security;


  create table "public"."budget_periods" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "month" date not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."budget_periods" enable row level security;


  create table "public"."budgets" (
    "id" uuid not null default gen_random_uuid(),
    "period_id" uuid not null,
    "category_id" uuid not null,
    "amount" numeric(12,2) not null,
    "rollover_enabled" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."budgets" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "name" text not null,
    "kind" category_kind not null,
    "icon" text default 'folder'::text,
    "color" text default '#6B7280'::text,
    "created_at" timestamp with time zone default now(),
    "position" integer not null default 0
      );


alter table "public"."categories" enable row level security;


  create table "public"."categorization_rules" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "match_type" rule_match_type not null,
    "match_value" text not null,
    "category_id" uuid not null,
    "priority" integer default 100,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."categorization_rules" enable row level security;


  create table "public"."household_members" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "user_id" uuid not null,
    "role" household_role not null default 'viewer'::household_role,
    "joined_at" timestamp with time zone default now(),
    "invited_by" uuid
      );


alter table "public"."household_members" enable row level security;


  create table "public"."households" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now(),
    "settings" jsonb default '{}'::jsonb,
    "base_currency" text not null default 'GBP'::text
      );


alter table "public"."households" enable row level security;


  create table "public"."transaction_categories" (
    "id" uuid not null default gen_random_uuid(),
    "transaction_id" uuid not null,
    "category_id" uuid not null,
    "weight" numeric(3,2) default 1.0
      );


alter table "public"."transaction_categories" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "household_id" uuid not null,
    "account_id" uuid not null,
    "user_id" uuid,
    "occurred_at" timestamp with time zone not null,
    "description" text not null,
    "merchant" text,
    "currency" text default 'USD'::text,
    "amount" numeric(12,2) not null,
    "direction" transaction_direction not null,
    "attachment_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."transactions" enable row level security;

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX budget_periods_household_id_month_key ON public.budget_periods USING btree (household_id, month);

CREATE UNIQUE INDEX budget_periods_pkey ON public.budget_periods USING btree (id);

CREATE UNIQUE INDEX budgets_period_id_category_id_key ON public.budgets USING btree (period_id, category_id);

CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id);

CREATE UNIQUE INDEX categories_household_id_name_kind_key ON public.categories USING btree (household_id, name, kind);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categorization_rules_pkey ON public.categorization_rules USING btree (id);

CREATE UNIQUE INDEX household_members_household_id_user_id_key ON public.household_members USING btree (household_id, user_id);

CREATE UNIQUE INDEX household_members_pkey ON public.household_members USING btree (id);

CREATE UNIQUE INDEX households_pkey ON public.households USING btree (id);

CREATE INDEX idx_accounts_household ON public.accounts USING btree (household_id);

CREATE INDEX idx_accounts_household_id ON public.accounts USING btree (household_id);

CREATE INDEX idx_budget_periods_household_id ON public.budget_periods USING btree (household_id);

CREATE INDEX idx_budget_periods_household_month ON public.budget_periods USING btree (household_id, month);

CREATE INDEX idx_budget_periods_month ON public.budget_periods USING btree (month);

CREATE INDEX idx_budgets_category_id ON public.budgets USING btree (category_id);

CREATE INDEX idx_budgets_period_category ON public.budgets USING btree (period_id, category_id);

CREATE INDEX idx_budgets_period_id ON public.budgets USING btree (period_id);

CREATE INDEX idx_categories_household_id ON public.categories USING btree (household_id);

CREATE INDEX idx_categories_household_position ON public.categories USING btree (household_id, "position");

CREATE INDEX idx_categorization_rules_household_id ON public.categorization_rules USING btree (household_id);

CREATE INDEX idx_categorization_rules_priority ON public.categorization_rules USING btree (priority DESC);

CREATE INDEX idx_household_members_household_id ON public.household_members USING btree (household_id);

CREATE INDEX idx_household_members_user_id ON public.household_members USING btree (user_id);

CREATE INDEX idx_tc_category ON public.transaction_categories USING btree (category_id);

CREATE INDEX idx_tc_tx ON public.transaction_categories USING btree (transaction_id);

CREATE INDEX idx_transaction_categories_category_id ON public.transaction_categories USING btree (category_id);

CREATE INDEX idx_transaction_categories_transaction_id ON public.transaction_categories USING btree (transaction_id);

CREATE INDEX idx_transactions_account_id ON public.transactions USING btree (account_id);

CREATE INDEX idx_transactions_household_id ON public.transactions USING btree (household_id);

CREATE INDEX idx_transactions_household_month ON public.transactions USING btree (household_id, occurred_at);

CREATE INDEX idx_transactions_merchant ON public.transactions USING btree (merchant);

CREATE INDEX idx_transactions_occurred_at ON public.transactions USING btree (occurred_at);

CREATE UNIQUE INDEX transaction_categories_pkey ON public.transaction_categories USING btree (id);

CREATE UNIQUE INDEX transaction_categories_transaction_id_category_id_key ON public.transaction_categories USING btree (transaction_id, category_id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX ux_budget_periods_household_month ON public.budget_periods USING btree (household_id, month);

CREATE UNIQUE INDEX ux_budgets_period_category ON public.budgets USING btree (period_id, category_id);

CREATE UNIQUE INDEX ux_categories_household_name ON public.categories USING btree (household_id, name);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."budget_periods" add constraint "budget_periods_pkey" PRIMARY KEY using index "budget_periods_pkey";

alter table "public"."budgets" add constraint "budgets_pkey" PRIMARY KEY using index "budgets_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."categorization_rules" add constraint "categorization_rules_pkey" PRIMARY KEY using index "categorization_rules_pkey";

alter table "public"."household_members" add constraint "household_members_pkey" PRIMARY KEY using index "household_members_pkey";

alter table "public"."households" add constraint "households_pkey" PRIMARY KEY using index "households_pkey";

alter table "public"."transaction_categories" add constraint "transaction_categories_pkey" PRIMARY KEY using index "transaction_categories_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."accounts" add constraint "accounts_currency_check" CHECK ((length(currency) = 3)) not valid;

alter table "public"."accounts" validate constraint "accounts_currency_check";

alter table "public"."accounts" add constraint "accounts_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."accounts" validate constraint "accounts_household_id_fkey";

alter table "public"."accounts" add constraint "accounts_name_check" CHECK ((length(name) >= 1)) not valid;

alter table "public"."accounts" validate constraint "accounts_name_check";

alter table "public"."budget_periods" add constraint "budget_periods_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."budget_periods" validate constraint "budget_periods_household_id_fkey";

alter table "public"."budget_periods" add constraint "budget_periods_household_id_month_key" UNIQUE using index "budget_periods_household_id_month_key";

alter table "public"."budget_periods" add constraint "budget_periods_month_check" CHECK ((EXTRACT(day FROM month) = (1)::numeric)) not valid;

alter table "public"."budget_periods" validate constraint "budget_periods_month_check";

alter table "public"."budgets" add constraint "budgets_amount_check" CHECK ((amount >= (0)::numeric)) not valid;

alter table "public"."budgets" validate constraint "budgets_amount_check";

alter table "public"."budgets" add constraint "budgets_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_category_id_fkey";

alter table "public"."budgets" add constraint "budgets_period_id_category_id_key" UNIQUE using index "budgets_period_id_category_id_key";

alter table "public"."budgets" add constraint "budgets_period_id_fkey" FOREIGN KEY (period_id) REFERENCES budget_periods(id) ON DELETE CASCADE not valid;

alter table "public"."budgets" validate constraint "budgets_period_id_fkey";

alter table "public"."categories" add constraint "categories_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_household_id_fkey";

alter table "public"."categories" add constraint "categories_household_id_name_kind_key" UNIQUE using index "categories_household_id_name_kind_key";

alter table "public"."categories" add constraint "categories_name_check" CHECK ((length(name) >= 1)) not valid;

alter table "public"."categories" validate constraint "categories_name_check";

alter table "public"."categorization_rules" add constraint "categorization_rules_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."categorization_rules" validate constraint "categorization_rules_category_id_fkey";

alter table "public"."categorization_rules" add constraint "categorization_rules_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."categorization_rules" validate constraint "categorization_rules_household_id_fkey";

alter table "public"."categorization_rules" add constraint "categorization_rules_match_value_check" CHECK ((length(match_value) >= 1)) not valid;

alter table "public"."categorization_rules" validate constraint "categorization_rules_match_value_check";

alter table "public"."categorization_rules" add constraint "categorization_rules_priority_check" CHECK ((priority >= 0)) not valid;

alter table "public"."categorization_rules" validate constraint "categorization_rules_priority_check";

alter table "public"."household_members" add constraint "household_members_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."household_members" validate constraint "household_members_household_id_fkey";

alter table "public"."household_members" add constraint "household_members_household_id_user_id_key" UNIQUE using index "household_members_household_id_user_id_key";

alter table "public"."household_members" add constraint "household_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) not valid;

alter table "public"."household_members" validate constraint "household_members_invited_by_fkey";

alter table "public"."household_members" add constraint "household_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."household_members" validate constraint "household_members_user_id_fkey";

alter table "public"."households" add constraint "households_name_check" CHECK ((length(name) >= 1)) not valid;

alter table "public"."households" validate constraint "households_name_check";

alter table "public"."transaction_categories" add constraint "transaction_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_categories" validate constraint "transaction_categories_category_id_fkey";

alter table "public"."transaction_categories" add constraint "transaction_categories_transaction_id_category_id_key" UNIQUE using index "transaction_categories_transaction_id_category_id_key";

alter table "public"."transaction_categories" add constraint "transaction_categories_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE not valid;

alter table "public"."transaction_categories" validate constraint "transaction_categories_transaction_id_fkey";

alter table "public"."transaction_categories" add constraint "transaction_categories_weight_check" CHECK (((weight > (0)::numeric) AND (weight <= (1)::numeric))) not valid;

alter table "public"."transaction_categories" validate constraint "transaction_categories_weight_check";

alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_account_id_fkey";

alter table "public"."transactions" add constraint "transactions_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."transactions" validate constraint "transactions_amount_check";

alter table "public"."transactions" add constraint "transactions_currency_check" CHECK ((length(currency) = 3)) not valid;

alter table "public"."transactions" validate constraint "transactions_currency_check";

alter table "public"."transactions" add constraint "transactions_description_check" CHECK ((length(description) >= 1)) not valid;

alter table "public"."transactions" validate constraint "transactions_description_check";

alter table "public"."transactions" add constraint "transactions_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_household_id_fkey";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.has_editor_rights(h_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return exists (
    select 1 from household_members 
    where household_id = h_id 
    and user_id = auth.uid()
    and role in ('owner', 'editor')
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_household_member(h_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return exists (
    select 1 from household_members 
    where household_id = h_id 
    and user_id = auth.uid()
  );
end;
$function$
;

create or replace view "public"."v_account_balances" as  SELECT a.id AS account_id,
    a.household_id,
    a.name,
    a.type,
    a.initial_balance,
    a.currency,
    a.is_archived,
    COALESCE((a.initial_balance + sum(
        CASE
            WHEN (t.direction = 'inflow'::transaction_direction) THEN t.amount
            WHEN (t.direction = 'outflow'::transaction_direction) THEN (- t.amount)
            ELSE (0)::numeric
        END)), a.initial_balance) AS current_balance,
    count(t.id) AS transaction_count,
    max(t.occurred_at) AS last_transaction_at
   FROM (accounts a
     LEFT JOIN transactions t ON ((t.account_id = a.id)))
  GROUP BY a.id, a.household_id, a.name, a.type, a.initial_balance, a.currency, a.is_archived;


create or replace view "public"."v_monthly_category_summary" as  WITH monthly_transactions AS (
         SELECT t.household_id,
            date_trunc('month'::text, t.occurred_at) AS month,
            tc.category_id,
            c_1.name AS category_name,
            c_1.kind AS category_kind,
            c_1.icon,
            c_1.color,
            sum(
                CASE
                    WHEN (t.direction = 'outflow'::transaction_direction) THEN (t.amount * tc.weight)
                    WHEN (t.direction = 'inflow'::transaction_direction) THEN ((- t.amount) * tc.weight)
                    ELSE (0)::numeric
                END) AS spent,
            sum(
                CASE
                    WHEN (t.direction = 'inflow'::transaction_direction) THEN (t.amount * tc.weight)
                    ELSE (0)::numeric
                END) AS earned,
            count(t.id) AS transaction_count
           FROM ((transactions t
             JOIN transaction_categories tc ON ((tc.transaction_id = t.id)))
             JOIN categories c_1 ON ((c_1.id = tc.category_id)))
          GROUP BY t.household_id, (date_trunc('month'::text, t.occurred_at)), tc.category_id, c_1.name, c_1.kind, c_1.icon, c_1.color
        ), monthly_budgets AS (
         SELECT bp.household_id,
            (bp.month)::timestamp with time zone AS month,
            b.category_id,
            b.amount AS budget,
            b.rollover_enabled
           FROM (budget_periods bp
             JOIN budgets b ON ((b.period_id = bp.id)))
        )
 SELECT COALESCE(mt.household_id, mb.household_id) AS household_id,
    COALESCE(mt.month, mb.month) AS month,
    COALESCE(mt.category_id, mb.category_id) AS category_id,
    COALESCE(mt.category_name, c.name) AS category_name,
    COALESCE(mt.category_kind, c.kind) AS category_kind,
    COALESCE(mt.icon, c.icon) AS icon,
    COALESCE(mt.color, c.color) AS color,
    COALESCE(mb.budget, (0)::numeric) AS budget,
    COALESCE(mt.spent, (0)::numeric) AS spent,
    COALESCE(mt.earned, (0)::numeric) AS earned,
    (COALESCE(mb.budget, (0)::numeric) - COALESCE(mt.spent, (0)::numeric)) AS remaining,
        CASE
            WHEN (COALESCE(mb.budget, (0)::numeric) > (0)::numeric) THEN ((COALESCE(mt.spent, (0)::numeric) / mb.budget) * (100)::numeric)
            ELSE (0)::numeric
        END AS budget_percentage,
    COALESCE(mt.transaction_count, (0)::bigint) AS transaction_count,
    mb.rollover_enabled
   FROM ((monthly_transactions mt
     FULL JOIN monthly_budgets mb ON (((mb.household_id = mt.household_id) AND (mb.month = mt.month) AND (mb.category_id = mt.category_id))))
     LEFT JOIN categories c ON ((c.id = COALESCE(mt.category_id, mb.category_id))));


create or replace view "public"."v_recent_transactions" as  SELECT t.id,
    t.household_id,
    t.account_id,
    a.name AS account_name,
    t.user_id,
    t.occurred_at,
    t.description,
    t.merchant,
    t.amount,
    t.direction,
    t.currency,
    t.attachment_url,
    t.created_at,
    array_agg(json_build_object('category_id', c.id, 'category_name', c.name, 'icon', c.icon, 'color', c.color, 'weight', tc.weight) ORDER BY tc.weight DESC) FILTER (WHERE (c.id IS NOT NULL)) AS categories,
    COALESCE((array_agg(c.name ORDER BY tc.weight DESC))[1], 'Uncategorized'::text) AS primary_category_name,
    COALESCE((array_agg(c.icon ORDER BY tc.weight DESC))[1], 'help'::text) AS primary_category_icon
   FROM (((transactions t
     LEFT JOIN accounts a ON ((a.id = t.account_id)))
     LEFT JOIN transaction_categories tc ON ((tc.transaction_id = t.id)))
     LEFT JOIN categories c ON ((c.id = tc.category_id)))
  GROUP BY t.id, t.household_id, t.account_id, a.name, t.user_id, t.occurred_at, t.description, t.merchant, t.amount, t.direction, t.currency, t.attachment_url, t.created_at
  ORDER BY t.occurred_at DESC;


create or replace view "public"."v_simple_burn_rate" as  WITH monthly_stats AS (
         SELECT transactions.household_id,
            date_trunc('month'::text, transactions.occurred_at) AS month,
            sum(
                CASE
                    WHEN (transactions.direction = 'outflow'::transaction_direction) THEN transactions.amount
                    ELSE (0)::numeric
                END) AS total_spent,
            count(DISTINCT date_trunc('day'::text, transactions.occurred_at)) AS active_days,
            EXTRACT(day FROM ((date_trunc('month'::text, transactions.occurred_at) + '1 mon'::interval) - '1 day'::interval)) AS days_in_month,
            EXTRACT(day FROM CURRENT_DATE) AS current_day
           FROM transactions
          WHERE ((transactions.occurred_at >= date_trunc('month'::text, now())) AND (transactions.occurred_at < (date_trunc('month'::text, now()) + '1 mon'::interval)))
          GROUP BY transactions.household_id, (date_trunc('month'::text, transactions.occurred_at))
        ), monthly_budgets_total AS (
         SELECT bp.household_id,
            (bp.month)::timestamp with time zone AS month,
            sum(b.amount) AS total_budget
           FROM (budget_periods bp
             JOIN budgets b ON ((b.period_id = bp.id)))
          WHERE (bp.month = (date_trunc('month'::text, now()))::date)
          GROUP BY bp.household_id, ((bp.month)::timestamp with time zone)
        )
 SELECT COALESCE(ms.household_id, mbt.household_id) AS household_id,
    COALESCE(ms.month, mbt.month) AS month,
    COALESCE(ms.total_spent, (0)::numeric) AS spent,
    COALESCE(mbt.total_budget, (0)::numeric) AS budget,
    (COALESCE(mbt.total_budget, (0)::numeric) - COALESCE(ms.total_spent, (0)::numeric)) AS remaining,
        CASE
            WHEN (ms.active_days > 0) THEN (ms.total_spent / (ms.active_days)::numeric)
            ELSE (0)::numeric
        END AS daily_average,
        CASE
            WHEN (ms.current_day > (0)::numeric) THEN (ms.total_spent / ms.current_day)
            ELSE (0)::numeric
        END AS daily_burn_rate,
        CASE
            WHEN ((ms.active_days > 0) AND (mbt.total_budget > (0)::numeric)) THEN ((ms.total_spent / (ms.active_days)::numeric) * ms.days_in_month)
            ELSE (0)::numeric
        END AS projected_monthly_spend,
    GREATEST((0)::numeric, (ms.days_in_month - ms.current_day)) AS remaining_days,
        CASE
            WHEN (GREATEST((0)::numeric, (ms.days_in_month - ms.current_day)) > (0)::numeric) THEN ((COALESCE(mbt.total_budget, (0)::numeric) - COALESCE(ms.total_spent, (0)::numeric)) / GREATEST((0)::numeric, (ms.days_in_month - ms.current_day)))
            ELSE (0)::numeric
        END AS suggested_daily_spend
   FROM (monthly_stats ms
     FULL JOIN monthly_budgets_total mbt ON (((mbt.household_id = ms.household_id) AND (mbt.month = ms.month))));


grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."budget_periods" to "anon";

grant insert on table "public"."budget_periods" to "anon";

grant references on table "public"."budget_periods" to "anon";

grant select on table "public"."budget_periods" to "anon";

grant trigger on table "public"."budget_periods" to "anon";

grant truncate on table "public"."budget_periods" to "anon";

grant update on table "public"."budget_periods" to "anon";

grant delete on table "public"."budget_periods" to "authenticated";

grant insert on table "public"."budget_periods" to "authenticated";

grant references on table "public"."budget_periods" to "authenticated";

grant select on table "public"."budget_periods" to "authenticated";

grant trigger on table "public"."budget_periods" to "authenticated";

grant truncate on table "public"."budget_periods" to "authenticated";

grant update on table "public"."budget_periods" to "authenticated";

grant delete on table "public"."budget_periods" to "service_role";

grant insert on table "public"."budget_periods" to "service_role";

grant references on table "public"."budget_periods" to "service_role";

grant select on table "public"."budget_periods" to "service_role";

grant trigger on table "public"."budget_periods" to "service_role";

grant truncate on table "public"."budget_periods" to "service_role";

grant update on table "public"."budget_periods" to "service_role";

grant delete on table "public"."budgets" to "anon";

grant insert on table "public"."budgets" to "anon";

grant references on table "public"."budgets" to "anon";

grant select on table "public"."budgets" to "anon";

grant trigger on table "public"."budgets" to "anon";

grant truncate on table "public"."budgets" to "anon";

grant update on table "public"."budgets" to "anon";

grant delete on table "public"."budgets" to "authenticated";

grant insert on table "public"."budgets" to "authenticated";

grant references on table "public"."budgets" to "authenticated";

grant select on table "public"."budgets" to "authenticated";

grant trigger on table "public"."budgets" to "authenticated";

grant truncate on table "public"."budgets" to "authenticated";

grant update on table "public"."budgets" to "authenticated";

grant delete on table "public"."budgets" to "service_role";

grant insert on table "public"."budgets" to "service_role";

grant references on table "public"."budgets" to "service_role";

grant select on table "public"."budgets" to "service_role";

grant trigger on table "public"."budgets" to "service_role";

grant truncate on table "public"."budgets" to "service_role";

grant update on table "public"."budgets" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."categorization_rules" to "anon";

grant insert on table "public"."categorization_rules" to "anon";

grant references on table "public"."categorization_rules" to "anon";

grant select on table "public"."categorization_rules" to "anon";

grant trigger on table "public"."categorization_rules" to "anon";

grant truncate on table "public"."categorization_rules" to "anon";

grant update on table "public"."categorization_rules" to "anon";

grant delete on table "public"."categorization_rules" to "authenticated";

grant insert on table "public"."categorization_rules" to "authenticated";

grant references on table "public"."categorization_rules" to "authenticated";

grant select on table "public"."categorization_rules" to "authenticated";

grant trigger on table "public"."categorization_rules" to "authenticated";

grant truncate on table "public"."categorization_rules" to "authenticated";

grant update on table "public"."categorization_rules" to "authenticated";

grant delete on table "public"."categorization_rules" to "service_role";

grant insert on table "public"."categorization_rules" to "service_role";

grant references on table "public"."categorization_rules" to "service_role";

grant select on table "public"."categorization_rules" to "service_role";

grant trigger on table "public"."categorization_rules" to "service_role";

grant truncate on table "public"."categorization_rules" to "service_role";

grant update on table "public"."categorization_rules" to "service_role";

grant delete on table "public"."household_members" to "anon";

grant insert on table "public"."household_members" to "anon";

grant references on table "public"."household_members" to "anon";

grant select on table "public"."household_members" to "anon";

grant trigger on table "public"."household_members" to "anon";

grant truncate on table "public"."household_members" to "anon";

grant update on table "public"."household_members" to "anon";

grant delete on table "public"."household_members" to "authenticated";

grant insert on table "public"."household_members" to "authenticated";

grant references on table "public"."household_members" to "authenticated";

grant select on table "public"."household_members" to "authenticated";

grant trigger on table "public"."household_members" to "authenticated";

grant truncate on table "public"."household_members" to "authenticated";

grant update on table "public"."household_members" to "authenticated";

grant delete on table "public"."household_members" to "service_role";

grant insert on table "public"."household_members" to "service_role";

grant references on table "public"."household_members" to "service_role";

grant select on table "public"."household_members" to "service_role";

grant trigger on table "public"."household_members" to "service_role";

grant truncate on table "public"."household_members" to "service_role";

grant update on table "public"."household_members" to "service_role";

grant delete on table "public"."households" to "anon";

grant insert on table "public"."households" to "anon";

grant references on table "public"."households" to "anon";

grant select on table "public"."households" to "anon";

grant trigger on table "public"."households" to "anon";

grant truncate on table "public"."households" to "anon";

grant update on table "public"."households" to "anon";

grant delete on table "public"."households" to "authenticated";

grant insert on table "public"."households" to "authenticated";

grant references on table "public"."households" to "authenticated";

grant select on table "public"."households" to "authenticated";

grant trigger on table "public"."households" to "authenticated";

grant truncate on table "public"."households" to "authenticated";

grant update on table "public"."households" to "authenticated";

grant delete on table "public"."households" to "service_role";

grant insert on table "public"."households" to "service_role";

grant references on table "public"."households" to "service_role";

grant select on table "public"."households" to "service_role";

grant trigger on table "public"."households" to "service_role";

grant truncate on table "public"."households" to "service_role";

grant update on table "public"."households" to "service_role";

grant delete on table "public"."transaction_categories" to "anon";

grant insert on table "public"."transaction_categories" to "anon";

grant references on table "public"."transaction_categories" to "anon";

grant select on table "public"."transaction_categories" to "anon";

grant trigger on table "public"."transaction_categories" to "anon";

grant truncate on table "public"."transaction_categories" to "anon";

grant update on table "public"."transaction_categories" to "anon";

grant delete on table "public"."transaction_categories" to "authenticated";

grant insert on table "public"."transaction_categories" to "authenticated";

grant references on table "public"."transaction_categories" to "authenticated";

grant select on table "public"."transaction_categories" to "authenticated";

grant trigger on table "public"."transaction_categories" to "authenticated";

grant truncate on table "public"."transaction_categories" to "authenticated";

grant update on table "public"."transaction_categories" to "authenticated";

grant delete on table "public"."transaction_categories" to "service_role";

grant insert on table "public"."transaction_categories" to "service_role";

grant references on table "public"."transaction_categories" to "service_role";

grant select on table "public"."transaction_categories" to "service_role";

grant trigger on table "public"."transaction_categories" to "service_role";

grant truncate on table "public"."transaction_categories" to "service_role";

grant update on table "public"."transaction_categories" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";


  create policy "Editors can manage accounts"
  on "public"."accounts"
  as permissive
  for all
  to public
using (has_editor_rights(household_id))
with check (has_editor_rights(household_id));



  create policy "Members can view accounts"
  on "public"."accounts"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Users can view household accounts"
  on "public"."accounts"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Editors can manage budget periods"
  on "public"."budget_periods"
  as permissive
  for all
  to public
using (has_editor_rights(household_id))
with check (has_editor_rights(household_id));



  create policy "Members can view budget periods"
  on "public"."budget_periods"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Users can view household budget periods"
  on "public"."budget_periods"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Editors can manage budgets"
  on "public"."budgets"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM budget_periods bp
  WHERE ((bp.id = budgets.period_id) AND has_editor_rights(bp.household_id)))))
with check ((EXISTS ( SELECT 1
   FROM budget_periods bp
  WHERE ((bp.id = budgets.period_id) AND has_editor_rights(bp.household_id)))));



  create policy "Members can view budgets"
  on "public"."budgets"
  as permissive
  for select
  to public
using (is_household_member(( SELECT budget_periods.household_id
   FROM budget_periods
  WHERE (budget_periods.id = budgets.period_id))));



  create policy "Users can view household budgets"
  on "public"."budgets"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM budget_periods bp
  WHERE ((bp.id = budgets.period_id) AND is_household_member(bp.household_id)))));



  create policy "Editors can manage categories"
  on "public"."categories"
  as permissive
  for all
  to public
using (has_editor_rights(household_id))
with check (has_editor_rights(household_id));



  create policy "Members can view categories"
  on "public"."categories"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Users can view household categories"
  on "public"."categories"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Editors can manage rules"
  on "public"."categorization_rules"
  as permissive
  for all
  to public
using (has_editor_rights(household_id))
with check (has_editor_rights(household_id));



  create policy "Members can view rules"
  on "public"."categorization_rules"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Users can view household rules"
  on "public"."categorization_rules"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Members can view memberships"
  on "public"."household_members"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Owners can manage household members"
  on "public"."household_members"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM household_members hm
  WHERE ((hm.household_id = household_members.household_id) AND (hm.user_id = auth.uid()) AND (hm.role = 'owner'::household_role)))))
with check ((EXISTS ( SELECT 1
   FROM household_members hm
  WHERE ((hm.household_id = household_members.household_id) AND (hm.user_id = auth.uid()) AND (hm.role = 'owner'::household_role)))));



  create policy "Owners can manage memberships"
  on "public"."household_members"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM household_members household_members_1
  WHERE ((household_members_1.household_id = household_members_1.household_id) AND (household_members_1.user_id = auth.uid()) AND (household_members_1.role = 'owner'::household_role)))));



  create policy "Users can join households"
  on "public"."household_members"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "Users can view household members"
  on "public"."household_members"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Members can view household"
  on "public"."households"
  as permissive
  for select
  to public
using (is_household_member(id));



  create policy "Owners can update household"
  on "public"."households"
  as permissive
  for update
  to public
using (has_editor_rights(id));



  create policy "Users can create households"
  on "public"."households"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users can update households they own"
  on "public"."households"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM household_members hm
  WHERE ((hm.household_id = households.id) AND (hm.user_id = auth.uid()) AND (hm.role = 'owner'::household_role)))))
with check ((EXISTS ( SELECT 1
   FROM household_members hm
  WHERE ((hm.household_id = households.id) AND (hm.user_id = auth.uid()) AND (hm.role = 'owner'::household_role)))));



  create policy "Users can view households they belong to"
  on "public"."households"
  as permissive
  for select
  to public
using (is_household_member(id));



  create policy "Editors can manage transaction categories"
  on "public"."transaction_categories"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM transactions t
  WHERE ((t.id = transaction_categories.transaction_id) AND has_editor_rights(t.household_id)))))
with check ((EXISTS ( SELECT 1
   FROM transactions t
  WHERE ((t.id = transaction_categories.transaction_id) AND has_editor_rights(t.household_id)))));



  create policy "Members can view transaction categories"
  on "public"."transaction_categories"
  as permissive
  for select
  to public
using (is_household_member(( SELECT transactions.household_id
   FROM transactions
  WHERE (transactions.id = transaction_categories.transaction_id))));



  create policy "Users can view transaction categories"
  on "public"."transaction_categories"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM transactions t
  WHERE ((t.id = transaction_categories.transaction_id) AND is_household_member(t.household_id)))));



  create policy "Editors can manage transactions"
  on "public"."transactions"
  as permissive
  for all
  to public
using (has_editor_rights(household_id))
with check (has_editor_rights(household_id));



  create policy "Members can view transactions"
  on "public"."transactions"
  as permissive
  for select
  to public
using (is_household_member(household_id));



  create policy "Users can view household transactions"
  on "public"."transactions"
  as permissive
  for select
  to public
using (is_household_member(household_id));




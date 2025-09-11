-- URGENT SQL FIX for Transaction Issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current transactions table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND table_schema = 'public';

-- 2. Fix the transactions table constraints
-- Option A: Make the 'type' column nullable if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'type' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE transactions ALTER COLUMN type DROP NOT NULL;
    END IF;
END $$;

-- 3. Fix RLS Policies (clean version without markdown)
-- Drop existing policies
DROP POLICY IF EXISTS "budget_periods_policy" ON budget_periods;
DROP POLICY IF EXISTS "budgets_policy" ON budgets;
DROP POLICY IF EXISTS "budget_periods_select" ON budget_periods;
DROP POLICY IF EXISTS "budget_periods_insert" ON budget_periods;
DROP POLICY IF EXISTS "budget_periods_update" ON budget_periods;
DROP POLICY IF EXISTS "budgets_select" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;

-- Create comprehensive policies for budget_periods
CREATE POLICY "budget_periods_select" ON budget_periods
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "budget_periods_insert" ON budget_periods
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "budget_periods_update" ON budget_periods
    FOR UPDATE USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

-- Create comprehensive policies for budgets
CREATE POLICY "budgets_select" ON budgets
    FOR SELECT USING (
        period_id IN (
            SELECT bp.id FROM budget_periods bp
            JOIN household_members hm ON bp.household_id = hm.household_id
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "budgets_insert" ON budgets
    FOR INSERT WITH CHECK (
        period_id IN (
            SELECT bp.id FROM budget_periods bp
            JOIN household_members hm ON bp.household_id = hm.household_id
            WHERE hm.user_id = auth.uid()
        )
    );

CREATE POLICY "budgets_update" ON budgets
    FOR UPDATE USING (
        period_id IN (
            SELECT bp.id FROM budget_periods bp
            JOIN household_members hm ON bp.household_id = hm.household_id
            WHERE hm.user_id = auth.uid()
        )
    );

-- 4. Ensure tables have RLS enabled
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create or update transaction policies
DROP POLICY IF EXISTS "transactions_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;

CREATE POLICY "transactions_select" ON transactions
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "transactions_insert" ON transactions
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "transactions_update" ON transactions
    FOR UPDATE USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

-- 6. Grant permissions
GRANT ALL ON budget_periods TO authenticated;
GRANT ALL ON budgets TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON transaction_categories TO authenticated;

-- 7. Create function to update account balance (if not exists)
CREATE OR REPLACE FUNCTION update_account_balance(account_id UUID, amount_change DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE accounts 
    SET current_balance = COALESCE(current_balance, 0) + amount_change
    WHERE id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_account_balance TO authenticated;

-- 9. Test the setup
SELECT 'Setup complete' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('budget_periods', 'budgets', 'transactions', 'transaction_categories');
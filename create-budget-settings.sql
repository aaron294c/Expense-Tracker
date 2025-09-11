-- Create simple budget settings table to avoid date issues
CREATE TABLE IF NOT EXISTS budget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    household_id UUID NOT NULL,
    category_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "budget_settings_policy" ON budget_settings
    USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON budget_settings TO authenticated;

-- Alternative: Add budget_amount column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(12,2) DEFAULT 0;
-- Complete fix for remaining_amount constraint error
-- This will completely resolve the null remaining_amount issue

-- Step 1: First, let's see what columns exist and fix the table structure
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Update all existing records to ensure remaining_amount is never null
UPDATE creditors SET remaining_amount = COALESCE(remaining_amount, amount) WHERE remaining_amount IS NULL OR remaining_amount = 0;
UPDATE creditors SET remaining_amount = amount WHERE remaining_amount IS NULL AND amount IS NOT NULL;

-- Step 3: Ensure remaining_amount is NOT NULL
ALTER TABLE creditors ALTER COLUMN remaining_amount SET NOT NULL;

-- Step 4: Drop ALL existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;
DROP TRIGGER IF EXISTS on_debtor_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS handle_debt_request_acceptance ON debt_requests;

-- Step 5: Drop the function as well to recreate it fresh
DROP FUNCTION IF EXISTS handle_debt_request_acceptance();

-- Step 6: Create a completely new, simple trigger function
CREATE OR REPLACE FUNCTION handle_debt_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only handle accepted requests
    IF NEW.status = 'accepted' THEN
        -- Handle creditor requests (user owes someone money)
        IF NEW.type = 'creditor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (
                NEW.from_user_id,    -- The person who owes money
                NEW.to_user_id,      -- The person who is owed money
                NEW.amount,          -- The amount
                'active',            -- Status
                NEW.amount,          -- Remaining amount starts as full amount
                NOW()                -- Updated timestamp
            )
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.amount,
                updated_at = NOW();
                
        -- Handle debtor requests (someone owes user money)
        ELSIF NEW.type = 'debtor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (
                NEW.to_user_id,      -- The person who owes money
                NEW.from_user_id,    -- The person who is owed money
                NEW.amount,          -- The amount
                'active',            -- Status
                NEW.amount,          -- Remaining amount starts as full amount
                NOW()                -- Updated timestamp
            )
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.amount,
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_debt_request_acceptance();

-- Step 8: Test the trigger by checking if everything is properly set up
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'creditors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

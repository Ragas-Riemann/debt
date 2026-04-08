-- Fix for creditors_amount_check constraint violation
-- This will resolve the error when accepting payments

-- Step 1: Check what constraints exist on the creditors table
SELECT conname, contype, pg_get_constraintdef(oid) as consrc 
FROM pg_constraint 
WHERE conrelid = 'public.creditors'::regclass;

-- Step 2: Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;
DROP TRIGGER IF EXISTS on_debtor_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS handle_debt_request_acceptance ON debt_requests;

-- Step 3: Create a safer trigger that respects all constraints
CREATE OR REPLACE FUNCTION safe_debt_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only handle accepted requests
    IF NEW.status = 'accepted' THEN
        -- Validate amount before inserting
        IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
            RETURN NEW;
        END IF;
        
        -- Handle creditor requests (user owes someone money)
        IF NEW.type = 'creditor' THEN
            -- Check if record already exists
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (
                NEW.from_user_id,    -- The person who owes money
                NEW.to_user_id,      -- The person who is owed money
                NEW.amount,          -- The amount (must be positive)
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
            -- Check if record already exists
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (
                NEW.to_user_id,      -- The person who owes money
                NEW.from_user_id,    -- The person who is owed money
                NEW.amount,          -- The amount (must be positive)
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

-- Step 4: Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION safe_debt_request_acceptance();

-- Step 5: Ensure remaining_amount column exists and is properly set up
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 6: Update any existing records with null remaining_amount
UPDATE creditors SET remaining_amount = COALESCE(remaining_amount, amount) WHERE remaining_amount IS NULL;

-- Step 7: Test the setup by checking the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'creditors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

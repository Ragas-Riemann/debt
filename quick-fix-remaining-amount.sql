-- Quick fix for remaining_amount constraint error
-- Run this if you're getting the null remaining_amount error

-- Step 1: Add the missing remaining_amount column
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC;

-- Step 2: Update any existing records to have remaining_amount = amount
UPDATE creditors SET remaining_amount = amount WHERE remaining_amount IS NULL;

-- Step 3: Make the column NOT NULL (only after updating existing records)
ALTER TABLE creditors ALTER COLUMN remaining_amount SET NOT NULL;

-- Step 4: Add updated_at column if missing
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 5: Drop any existing problematic triggers
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;

-- Step 6: Create a simple working trigger
CREATE OR REPLACE FUNCTION handle_debt_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        IF NEW.type = 'creditor' THEN
            -- Creditor request: from_user_id owes to_user_id
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount)
            VALUES (NEW.from_user_id, NEW.to_user_id, NEW.amount, 'active', NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.amount;
                
        ELSIF NEW.type = 'debtor' THEN
            -- Debtor request: to_user_id owes from_user_id
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount)
            VALUES (NEW.to_user_id, NEW.from_user_id, NEW.amount, 'active', NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.amount;
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

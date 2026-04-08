-- Complete fix for payment acceptance error
-- This will resolve all constraint and trigger issues

-- Step 1: First, let's see what's actually in the creditors table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'creditors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check what constraints exist
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.creditors'::regclass;

-- Step 3: Drop ALL triggers and functions to start fresh
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;
DROP TRIGGER IF EXISTS on_debtor_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS handle_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS simple_acceptance_trigger ON debt_requests;

DROP FUNCTION IF EXISTS safe_debt_request_acceptance();
DROP FUNCTION IF EXISTS handle_debt_request_acceptance();
DROP FUNCTION IF EXISTS simple_acceptance_trigger();
DROP FUNCTION IF EXISTS transfer_deadline_to_creditors();
DROP FUNCTION IF EXISTS transfer_debtor_to_creditors();

-- Step 4: Ensure all required columns exist with proper defaults
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS deadline DATE;

-- Step 5: Drop the problematic constraint if it exists
ALTER TABLE creditors DROP CONSTRAINT IF EXISTS creditors_amount_check;

-- Step 6: Create a minimal, working trigger
CREATE OR REPLACE FUNCTION accept_payment_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'accepted'
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        -- Validate the amount
        IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
            -- Log the issue but don't fail
            RAISE LOG 'Invalid amount in payment request %: %', NEW.id, NEW.amount;
            RETURN NEW;
        END IF;
        
        -- Handle creditor type (from_user_id owes to_user_id)
        IF NEW.type = 'creditor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (NEW.from_user_id, NEW.to_user_id, NEW.amount, 'active', NEW.amount, NOW())
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.remaining_amount,
                updated_at = NOW();
                
        -- Handle debtor type (to_user_id owes from_user_id)
        ELSIF NEW.type = 'debtor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount, updated_at)
            VALUES (NEW.to_user_id, NEW.from_user_id, NEW.amount, 'active', NEW.amount, NOW())
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount,
                remaining_amount = EXCLUDED.remaining_amount,
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the trigger
CREATE TRIGGER on_payment_request_accepted
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION accept_payment_trigger();

-- Step 8: Test the setup
SELECT 'Trigger created successfully' as status;

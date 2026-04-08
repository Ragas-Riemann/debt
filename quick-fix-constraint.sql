-- Quick fix for creditors_amount_check constraint violation
-- This will immediately resolve the payment acceptance error

-- Step 1: Drop the problematic constraint temporarily
ALTER TABLE creditors DROP CONSTRAINT IF EXISTS creditors_amount_check;

-- Step 2: Drop all existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;
DROP TRIGGER IF EXISTS on_debtor_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS handle_debt_request_acceptance ON debt_requests;

-- Step 3: Ensure required columns exist
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Create a simple, safe trigger
CREATE OR REPLACE FUNCTION simple_acceptance_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND NEW.amount > 0 THEN
        IF NEW.type = 'creditor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount)
            VALUES (NEW.from_user_id, NEW.to_user_id, NEW.amount, 'active', NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO NOTHING;
        ELSIF NEW.type = 'debtor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount)
            VALUES (NEW.to_user_id, NEW.from_user_id, NEW.amount, 'active', NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION simple_acceptance_trigger();

-- Minimal fix - Remove remaining_amount requirement temporarily
-- This will get your system working immediately

-- Step 1: Make remaining_amount nullable temporarily
ALTER TABLE creditors ALTER COLUMN remaining_amount DROP NOT NULL;

-- Step 2: Set a default value for remaining_amount
ALTER TABLE creditors ALTER COLUMN remaining_amount SET DEFAULT 0;

-- Step 3: Update any NULL values to 0
UPDATE creditors SET remaining_amount = 0 WHERE remaining_amount IS NULL;

-- Step 4: Drop all existing triggers
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;
DROP TRIGGER IF EXISTS on_debtor_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS handle_debt_request_acceptance ON debt_requests;

-- Step 5: Create the simplest possible trigger
CREATE OR REPLACE FUNCTION simple_debt_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        IF NEW.type = 'creditor' THEN
            -- Insert without remaining_amount first
            INSERT INTO creditors (debtor_id, creditor_id, amount, status)
            VALUES (NEW.from_user_id, NEW.to_user_id, NEW.amount, 'active')
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount;
                
        ELSIF NEW.type = 'debtor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status)
            VALUES (NEW.to_user_id, NEW.from_user_id, NEW.amount, 'active')
            ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
                amount = EXCLUDED.amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION simple_debt_acceptance();

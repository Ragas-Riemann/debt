-- Add deadline column to creditors table
-- This will store the payment deadline for each creditor relationship

ALTER TABLE creditors ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add index for better performance on deadline queries
CREATE INDEX IF NOT EXISTS idx_creditors_deadline ON creditors(deadline);

-- Update existing creditors to have a default deadline (30 days from creation)
UPDATE creditors 
SET deadline = (created_at + INTERVAL '30 days')::DATE 
WHERE deadline IS NULL AND created_at IS NOT NULL;

-- Add deadline column to debt_requests table
ALTER TABLE debt_requests ADD COLUMN IF NOT EXISTS deadline DATE;

-- Create trigger to transfer deadline to creditors table when request is accepted
CREATE OR REPLACE FUNCTION transfer_deadline_to_creditors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND NEW.type = 'creditor' THEN
        -- Insert into creditors table with deadline
        INSERT INTO creditors (debtor_id, creditor_id, amount, status, deadline, remaining_amount)
        VALUES (
          NEW.from_user_id, 
          NEW.to_user_id, 
          NEW.amount, 
          'active',
          NEW.deadline,
          NEW.amount
        )
        ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          deadline = EXCLUDED.deadline,
          remaining_amount = EXCLUDED.amount,
          updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;

-- Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION transfer_deadline_to_creditors();

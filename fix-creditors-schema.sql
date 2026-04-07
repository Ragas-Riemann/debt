-- Fix creditors table schema for deadline and remaining_amount
-- This will fix the null remaining_amount constraint error

-- First, add remaining_amount column if it doesn't exist
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC NOT NULL DEFAULT 0;

-- Add updated_at column if it doesn't exist
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add deadline column to creditors table
ALTER TABLE creditors ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add index for better performance on deadline queries
CREATE INDEX IF NOT EXISTS idx_creditors_deadline ON creditors(deadline);

-- Update existing creditors to have proper remaining_amount (should equal amount initially)
UPDATE creditors 
SET remaining_amount = amount 
WHERE remaining_amount = 0 AND amount > 0;

-- Update existing creditors to have a default deadline (30 days from creation)
UPDATE creditors 
SET deadline = (created_at + INTERVAL '30 days')::DATE 
WHERE deadline IS NULL AND created_at IS NOT NULL;

-- Add deadline column to debt_requests table
ALTER TABLE debt_requests ADD COLUMN IF NOT EXISTS deadline DATE;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_debt_request_acceptance ON debt_requests;
DROP TRIGGER IF EXISTS transfer_deadline_trigger ON debt_requests;

-- Create improved trigger to transfer deadline to creditors table when request is accepted
CREATE OR REPLACE FUNCTION transfer_deadline_to_creditors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND NEW.type = 'creditor' THEN
        -- Insert into creditors table with deadline and remaining_amount
        INSERT INTO creditors (debtor_id, creditor_id, amount, status, deadline, remaining_amount, updated_at)
        VALUES (
          NEW.from_user_id, 
          NEW.to_user_id, 
          NEW.amount, 
          'active',
          NEW.deadline,
          NEW.amount,
          NOW()
        )
        ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          deadline = EXCLUDED.deadline,
          remaining_amount = EXCLUDED.remaining_amount,
          updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_debt_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION transfer_deadline_to_creditors();

-- Also handle debtor requests
CREATE OR REPLACE FUNCTION transfer_debtor_to_creditors()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND NEW.type = 'debtor' THEN
        -- For debtor requests, the roles are reversed
        INSERT INTO creditors (debtor_id, creditor_id, amount, status, deadline, remaining_amount, updated_at)
        VALUES (
          NEW.to_user_id,  -- The person who owes money (debtor)
          NEW.from_user_id, -- The person who is owed (creditor)
          NEW.amount, 
          'active',
          NEW.deadline,
          NEW.amount,
          NOW()
        )
        ON CONFLICT (debtor_id, creditor_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          deadline = EXCLUDED.deadline,
          remaining_amount = EXCLUDED.remaining_amount,
          updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for debtor requests
CREATE TRIGGER on_debtor_request_acceptance
    AFTER UPDATE ON debt_requests
    FOR EACH ROW
    EXECUTE FUNCTION transfer_debtor_to_creditors();

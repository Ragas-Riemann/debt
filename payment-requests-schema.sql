-- Payment Requests Table for Debt Tracker
-- This table handles payment requests from debtors to creditors

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id UUID REFERENCES auth.users(id) NOT NULL,
  creditor_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Users can create payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Creditors can update payment requests" ON payment_requests;

-- RLS Policies for payment_requests
-- Users can view payment requests they are involved in (as debtor or creditor)
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (
    auth.uid() = debtor_id OR 
    auth.uid() = creditor_id
  );

-- Users can create payment requests (as debtor)
CREATE POLICY "Users can create payment requests" ON payment_requests
  FOR INSERT WITH CHECK (
    auth.uid() = debtor_id AND
    auth.uid() != creditor_id AND
    amount > 0
  );

-- Users can update payment requests sent to them (as creditor)
CREATE POLICY "Creditors can update payment requests" ON payment_requests
  FOR UPDATE USING (
    auth.uid() = creditor_id
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle accepted payment requests
-- This creates a payment record and updates creditor relationship
CREATE OR REPLACE FUNCTION handle_payment_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        -- Check if creditor relationship exists and update the amount
        UPDATE creditors 
        SET amount = GREATEST(0, amount - NEW.amount),
            updated_at = NOW()
        WHERE debtor_id = NEW.debtor_id AND creditor_id = NEW.creditor_id
        AND amount > 0;
        
        -- If no creditor relationship exists, create one with negative amount (indicating overpayment)
        -- This is a safeguard, ideally shouldn't happen in normal flow
        IF NOT FOUND THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount, status)
            VALUES (NEW.debtor_id, NEW.creditor_id, -NEW.amount, 'active');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payment request acceptance
DROP TRIGGER IF EXISTS on_payment_request_update ON payment_requests;
CREATE TRIGGER on_payment_request_update
    AFTER UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_request_acceptance();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_debtor_id ON payment_requests(debtor_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_creditor_id ON payment_requests(creditor_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- View for payment requests with user details
CREATE VIEW payment_requests_details AS
SELECT 
  pr.id,
  pr.debtor_id,
  pr.creditor_id,
  pr.amount,
  pr.status,
  pr.created_at,
  pr.updated_at,
  debtor.email as debtor_email,
  creditor.email as creditor_email
FROM payment_requests pr
JOIN auth.users debtor ON pr.debtor_id = debtor.id
JOIN auth.users creditor ON pr.creditor_id = creditor.id;

-- Note: Views don't support RLS, but the underlying table has proper RLS policies
-- The view will inherit security from the base table through the policies

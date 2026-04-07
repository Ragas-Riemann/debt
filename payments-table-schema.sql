-- Payments Table for Debt Tracker
-- This table records actual payments made by debtors to creditors

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id UUID REFERENCES auth.users(id) NOT NULL,
  creditor_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
-- Users can view payments they are involved in (as debtor or creditor)
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = debtor_id OR 
    auth.uid() = creditor_id
  );

-- Users can create payments (as debtor paying creditor)
CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (
    auth.uid() = debtor_id AND
    auth.uid() != creditor_id
  );

-- Function to handle payment creation and update remaining amount
CREATE OR REPLACE FUNCTION handle_payment_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the remaining amount in creditors table
    UPDATE creditors 
    SET remaining_amount = GREATEST(0, remaining_amount - NEW.amount),
        updated_at = NOW()
    WHERE debtor_id = NEW.debtor_id 
    AND creditor_id = NEW.creditor_id
    AND remaining_amount > 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payment creation
DROP TRIGGER IF EXISTS on_payment_insert ON payments;
CREATE TRIGGER on_payment_insert
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_creation();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_debtor_id ON payments(debtor_id);
CREATE INDEX IF NOT EXISTS idx_payments_creditor_id ON payments(creditor_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

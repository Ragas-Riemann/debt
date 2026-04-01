-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debtors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debtor_id UUID REFERENCES debtors(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Debtors policies
CREATE POLICY "Users can view their own debtors" ON debtors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debtors" ON debtors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debtors" ON debtors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debtors" ON debtors
  FOR DELETE USING (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can view their own debts" ON debts
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = debts.debtor_id)
  );

CREATE POLICY "Users can insert their own debts" ON debts
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = debts.debtor_id)
  );

CREATE POLICY "Users can update their own debts" ON debts
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = debts.debtor_id)
  );

CREATE POLICY "Users can delete their own debts" ON debts
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = debts.debtor_id)
  );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = 
      (SELECT debtor_id FROM debts WHERE debts.id = payments.debt_id))
  );

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = 
      (SELECT debtor_id FROM debts WHERE debts.id = payments.debt_id))
  );

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = 
      (SELECT debtor_id FROM debts WHERE debts.id = payments.debt_id))
  );

CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM debtors WHERE debtors.id = 
      (SELECT debtor_id FROM debts WHERE debts.id = payments.debt_id))
  );

-- Function to automatically create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create helpful views
CREATE VIEW debtor_summary AS
SELECT 
  d.id,
  d.user_id,
  d.name,
  d.phone,
  d.email,
  d.notes,
  d.created_at,
  COALESCE(SUM(debt.amount), 0) as total_debt,
  COALESCE(SUM(debt.amount) - COALESCE(SUM(payment.amount_paid), 0), 0) as remaining_balance,
  COALESCE(SUM(payment.amount_paid), 0) as total_paid
FROM debtors d
LEFT JOIN debts debt ON d.id = debt.debtor_id
LEFT JOIN payments payment ON debt.id = payment.debt_id
GROUP BY d.id, d.user_id, d.name, d.phone, d.email, d.notes, d.created_at;

-- Enable RLS on the view
ALTER TABLE debtor_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debtor summary" ON debtor_summary
  FOR SELECT USING (auth.uid() = user_id);

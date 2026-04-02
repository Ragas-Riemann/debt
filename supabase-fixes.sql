-- =====================================================
-- SUPABASE RLS POLICIES FOR DEBT TRACKER APP
-- =====================================================
-- Run these SQL commands in your Supabase SQL Editor

-- 1. ENABLE RLS ON ALL TABLES (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditors ENABLE ROW LEVEL SECURITY;

-- 2. USERS TABLE POLICIES
-- Allow users to read all users (for selection dropdown)
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 3. DEBT_REQUESTS TABLE POLICIES
-- Users can see requests sent to them or by them
CREATE POLICY "Users can view own debt requests" ON debt_requests
  FOR SELECT USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

-- Users can create debt requests (as sender)
CREATE POLICY "Users can create debt requests" ON debt_requests
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    auth.uid() != to_user_id
  );

-- Users can update requests sent to them (accept/reject)
CREATE POLICY "Users can update requests sent to them" ON debt_requests
  FOR UPDATE USING (
    auth.uid() = to_user_id
  );

-- 4. CREDITORS TABLE POLICIES
-- Users can see creditor relationships they're part of
CREATE POLICY "Users can view own creditor relationships" ON creditors
  FOR SELECT USING (
    auth.uid() = debtor_id OR 
    auth.uid() = creditor_id
  );

-- Allow inserts for accepted debt requests (via trigger or direct)
CREATE POLICY "Allow creditor inserts for accepted requests" ON creditors
  FOR INSERT WITH CHECK (
    -- Allow if the current user is the debtor or creditor in the relationship
    auth.uid() = debtor_id OR 
    auth.uid() = creditor_id
  );

-- Users can update their own creditor relationships
CREATE POLICY "Users can update own creditor relationships" ON creditors
  FOR UPDATE USING (
    auth.uid() = debtor_id OR 
    auth.uid() = creditor_id
  );

-- 4. FUNCTION: AUTO CREATE CREDITOR ON ACCEPT
CREATE OR REPLACE FUNCTION handle_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN

        -- If request type = creditor (current user owes someone)
        IF NEW.type = 'creditor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount)
            VALUES (NEW.from_user_id, NEW.to_user_id, NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO NOTHING;
        END IF;

        -- If request type = debtor (someone owes current user)
        IF NEW.type = 'debtor' THEN
            INSERT INTO creditors (debtor_id, creditor_id, amount)
            VALUES (NEW.to_user_id, NEW.from_user_id, NEW.amount)
            ON CONFLICT (debtor_id, creditor_id) DO NOTHING;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ADDITIONAL FIXES
-- Ensure the auth.users table syncs with your users table
-- This trigger creates a user profile when someone signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. VERIFICATION QUERIES
-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'debt_requests', 'creditors')
ORDER BY tablename, policyname;

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'debt_requests', 'creditors')
ORDER BY tablename;

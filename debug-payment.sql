-- Debug payment acceptance issues
-- Run this to understand what's happening

-- Step 1: Check recent payment requests
SELECT 
    id,
    from_user_id,
    to_user_id,
    type,
    amount,
    status,
    created_at,
    updated_at
FROM payment_requests 
ORDER BY updated_at DESC 
LIMIT 5;

-- Step 2: Check creditors table
SELECT 
    id,
    debtor_id,
    creditor_id,
    amount,
    status,
    remaining_amount,
    deadline,
    created_at,
    updated_at
FROM creditors 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Check if there are any failed transactions
SELECT 
    id,
    from_user_id,
    to_user_id,
    type,
    amount,
    status
FROM payment_requests 
WHERE status = 'accepted' 
ORDER BY updated_at DESC 
LIMIT 5;

-- Step 4: Manual test - try to insert a creditor record directly
-- (This will help identify the exact constraint issue)
-- Uncomment and run with actual values to test:
-- INSERT INTO creditors (debtor_id, creditor_id, amount, status, remaining_amount)
-- VALUES ('test-debtor-id', 'test-creditor-id', 1000, 'active', 1000);

-- Step 5: Check for any remaining constraints
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint 
WHERE conrelid = 'public.creditors'::regclass;

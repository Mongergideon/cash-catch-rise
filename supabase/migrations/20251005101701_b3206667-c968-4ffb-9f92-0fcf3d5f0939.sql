-- Fix duplicate withdrawal issue for user 9ab6f4c2-119f-4503-bec0-69a8fbb4d46c
-- This user has 18 duplicate withdrawals of ₦34,000 each

-- Step 1: Keep the first withdrawal and delete the 17 duplicates
DELETE FROM withdrawals 
WHERE user_id = '9ab6f4c2-119f-4503-bec0-69a8fbb4d46c'
AND amount = 34000
AND status = 'pending'
AND created_at >= '2025-10-04 18:46:35'
AND created_at <= '2025-10-04 18:46:37'
AND id != (
  SELECT id FROM withdrawals 
  WHERE user_id = '9ab6f4c2-119f-4503-bec0-69a8fbb4d46c'
  AND amount = 34000
  AND status = 'pending'
  AND created_at >= '2025-10-04 18:46:35'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Step 2: Refund the user's wallet
-- The user had 18 withdrawals: 18 * 34,000 = 612,000 deducted from earnings
-- Plus 18 * 500 = 9,000 in fees deducted from funding
-- We need to refund 17 withdrawals worth: 17 * 34,000 = 578,000 to earnings
-- And 17 * 500 = 8,500 to funding wallet

UPDATE profiles 
SET 
  wallet_earnings = wallet_earnings + 578000,
  wallet_funding = wallet_funding + 8500
WHERE id = '9ab6f4c2-119f-4503-bec0-69a8fbb4d46c';

-- Step 3: Update withdrawal limits and fees
-- Set minimum withdrawal to ₦50,000 and standard fee to ₦1,500

-- Note: The withdrawal limits are enforced in the application code (Wallet.tsx)
-- The fee is also handled in application code, so we'll update that separately
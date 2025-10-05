-- Add a database function to check for recent pending withdrawals before allowing a new one
-- This prevents duplicate withdrawals from being created in quick succession

CREATE OR REPLACE FUNCTION check_recent_pending_withdrawal(
  user_uuid UUID,
  withdrawal_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has a pending withdrawal for the same amount in the last 2 minutes
  IF EXISTS (
    SELECT 1 
    FROM withdrawals
    WHERE user_id = user_uuid
    AND amount = withdrawal_amount
    AND status = 'pending'
    AND created_at > NOW() - INTERVAL '2 minutes'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;
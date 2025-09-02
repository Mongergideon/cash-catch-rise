-- Create RPC function to allow admin to update withdrawal details
CREATE OR REPLACE FUNCTION admin_update_withdrawal_details(
    withdrawal_id uuid,
    new_account_name text,
    new_account_number text,
    new_bank_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM admins 
        WHERE user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Update withdrawal details
    UPDATE withdrawals 
    SET 
        account_name = new_account_name,
        account_number = new_account_number,
        bank_name = new_bank_name
    WHERE id = withdrawal_id;

    -- Check if update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal not found or could not be updated';
    END IF;
END;
$$;
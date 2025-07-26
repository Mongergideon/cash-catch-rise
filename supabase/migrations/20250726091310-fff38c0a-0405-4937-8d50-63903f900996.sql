-- Add phone column to profiles table if it doesn't exist
-- First check if phone column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- Create admin functions to manage withdrawals
CREATE OR REPLACE FUNCTION public.admin_get_all_withdrawals()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  fee numeric,
  bank_name text,
  account_number text,
  account_name text,
  status withdrawal_status,
  created_at timestamp with time zone,
  processed_at timestamp with time zone,
  processed_by uuid,
  admin_notes text,
  first_name text,
  last_name text,
  email text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    w.id,
    w.user_id,
    w.amount,
    w.fee,
    w.bank_name,
    w.account_number,
    w.account_name,
    w.status,
    w.created_at,
    w.processed_at,
    w.processed_by,
    w.admin_notes,
    p.first_name,
    p.last_name,
    p.email,
    p.phone
  FROM public.withdrawals w
  LEFT JOIN public.profiles p ON p.id = w.user_id
  ORDER BY w.created_at DESC;
$$;

-- Update admin_get_all_users to include phone numbers
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  phone text,
  wallet_earnings numeric,
  wallet_funding numeric,
  current_plan text,
  plan_expires_at timestamp with time zone,
  is_banned boolean,
  created_at timestamp with time zone,
  referral_code text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.wallet_earnings,
    p.wallet_funding,
    p.current_plan::text,
    p.plan_expires_at,
    p.is_banned,
    p.created_at,
    p.referral_code
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$$;

-- Function to update withdrawal status (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_withdrawal_status(
  withdrawal_id uuid,
  new_status withdrawal_status,
  admin_id uuid,
  notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.withdrawals 
  SET 
    status = new_status,
    processed_by = admin_id,
    processed_at = CASE WHEN new_status != 'pending' THEN now() ELSE processed_at END,
    admin_notes = COALESCE(notes, admin_notes)
  WHERE id = withdrawal_id;
  
  RETURN TRUE;
END;
$$;
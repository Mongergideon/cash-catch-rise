
-- Create admin RPC functions to bypass RLS for admin dashboard

-- Function to get total user count
CREATE OR REPLACE FUNCTION public.admin_get_user_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer FROM public.profiles;
$$;

-- Function to get wallet totals
CREATE OR REPLACE FUNCTION public.admin_get_wallet_totals()
RETURNS TABLE(total_earnings numeric, total_funding numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(SUM(wallet_earnings), 0) as total_earnings,
    COALESCE(SUM(wallet_funding), 0) as total_funding
  FROM public.profiles;
$$;

-- Function to get all users for admin
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
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

-- Function to ban/unban users
CREATE OR REPLACE FUNCTION public.admin_ban_user(user_uuid uuid, banned boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET is_banned = banned,
      updated_at = NOW()
  WHERE id = user_uuid;
  
  RETURN TRUE;
END;
$$;

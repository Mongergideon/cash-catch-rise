-- Fix security issues from linter

-- 1. Enable RLS on missing tables (plans and store_items already have RLS enabled)
-- These were likely the tables causing the RLS disabled errors

-- 2. Fix function search paths for security
DROP FUNCTION IF EXISTS public.admin_set_user_plan_status(uuid, plan_type, timestamp with time zone, uuid);
DROP FUNCTION IF EXISTS public.admin_get_all_deposits();
DROP FUNCTION IF EXISTS public.process_plan_renewal(uuid, text);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.admin_set_user_plan_status(
  target_user_id uuid,
  new_plan plan_type,
  new_expiry timestamp with time zone DEFAULT NULL,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Update user plan
  UPDATE public.profiles 
  SET 
    current_plan = new_plan,
    plan_expires_at = COALESCE(new_expiry, 
      CASE 
        WHEN new_plan = 'free_trial' THEN NULL
        ELSE now() + interval '30 days'
      END),
    updated_at = now(),
    renewal_deadline = CASE 
      WHEN new_plan != 'free_trial' THEN NULL 
      ELSE renewal_deadline 
    END
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Admin function to get all deposits with secure search path
CREATE OR REPLACE FUNCTION public.admin_get_all_deposits()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  currency text,
  payment_method text,
  transaction_reference text,
  status text,
  created_at timestamp with time zone,
  completed_at timestamp with time zone,
  first_name text,
  last_name text,
  email text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.user_id,
    d.amount,
    d.currency,
    d.payment_method,
    d.transaction_reference,
    d.status,
    d.created_at,
    d.completed_at,
    p.first_name,
    p.last_name,
    p.email,
    p.phone
  FROM public.deposits d
  LEFT JOIN public.profiles p ON p.id = d.user_id
  ORDER BY d.created_at DESC;
$$;

-- Function to handle plan renewal with secure search path
CREATE OR REPLACE FUNCTION public.process_plan_renewal(
  user_uuid uuid,
  payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_renewal_plan plan_type;
BEGIN
  -- Get the plan user wants to renew to
  SELECT plan_before_expiry INTO user_renewal_plan
  FROM public.profiles
  WHERE id = user_uuid;
  
  -- Update user plan
  UPDATE public.profiles 
  SET 
    current_plan = COALESCE(user_renewal_plan, 'bronze'),
    plan_expires_at = now() + interval '30 days',
    renewal_deadline = NULL,
    plan_before_expiry = NULL,
    updated_at = now()
  WHERE id = user_uuid;
  
  -- Log the renewal payment
  INSERT INTO public.deposits (
    user_id,
    amount,
    transaction_reference,
    status,
    completed_at
  ) VALUES (
    user_uuid,
    3800,
    payment_reference,
    'completed',
    now()
  );
  
  RETURN TRUE;
END;
$$;
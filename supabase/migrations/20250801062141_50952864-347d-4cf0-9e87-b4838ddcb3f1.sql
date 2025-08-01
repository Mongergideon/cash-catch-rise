-- Mark all currently active plans as expired and add renewal system
UPDATE public.profiles 
SET 
  plan_expires_at = now() - interval '1 day',
  current_plan = 'free_trial'
WHERE current_plan != 'free_trial';

-- Add renewal tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS renewal_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS renewal_price numeric DEFAULT 3800,
ADD COLUMN IF NOT EXISTS plan_before_expiry plan_type;

-- Update profiles with renewal deadline (24 hours from now)
UPDATE public.profiles 
SET 
  renewal_deadline = now() + interval '24 hours',
  plan_before_expiry = 'bronze'  -- Default to bronze for renewal
WHERE current_plan = 'free_trial' AND renewal_deadline IS NULL;

-- Create deposits table for payment history tracking
CREATE TABLE IF NOT EXISTS public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'NGN',
  payment_method text DEFAULT 'flutterwave',
  transaction_reference text,
  status text DEFAULT 'pending', -- pending, completed, failed
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on deposits table
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposits
CREATE POLICY "Users can view own deposits" ON public.deposits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits" ON public.deposits
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin function to manually set user plan status
CREATE OR REPLACE FUNCTION public.admin_set_user_plan_status(
  target_user_id uuid,
  new_plan plan_type,
  new_expiry timestamp with time zone DEFAULT NULL,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin (you can modify this check based on your admin system)
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
    -- Clear renewal deadline if setting to active plan
    renewal_deadline = CASE 
      WHEN new_plan != 'free_trial' THEN NULL 
      ELSE renewal_deadline 
    END
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Admin function to get all deposits
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

-- Function to handle plan renewal
CREATE OR REPLACE FUNCTION public.process_plan_renewal(
  user_uuid uuid,
  payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
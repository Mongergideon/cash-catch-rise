
-- Add withdrawal frequency tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS next_withdrawal_allowed_at timestamp with time zone DEFAULT now();

-- Update plans table to include withdrawal frequency and game access info
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS withdrawal_frequency text DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS games_unlocked integer DEFAULT 1;

-- Insert/Update plan data with game access and withdrawal rules
INSERT INTO public.plans (name, type, cost, max_daily_earnings, duration_days, can_withdraw, withdrawal_frequency, games_unlocked) 
VALUES 
  ('Free Trial', 'free_trial', 0, 1000, 7, false, 'never', 1),
  ('Starter', 'starter', 5000, 2500, 30, true, 'weekly', 2),
  ('Bronze', 'bronze', 15000, 5000, 30, true, 'weekly', 3),
  ('Silver', 'silver', 30000, 10000, 30, true, 'weekly', 4),
  ('Gold', 'gold', 60000, 20000, 30, true, 'daily', 4),
  ('Platinum', 'platinum', 120000, 50000, 30, true, 'daily', 4)
ON CONFLICT (type) DO UPDATE SET
  withdrawal_frequency = EXCLUDED.withdrawal_frequency,
  games_unlocked = EXCLUDED.games_unlocked,
  can_withdraw = EXCLUDED.can_withdraw;

-- Function to check if user can withdraw based on plan and frequency
CREATE OR REPLACE FUNCTION public.can_user_withdraw(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  plan_frequency text;
  next_allowed timestamp with time zone;
  plan_can_withdraw boolean;
BEGIN
  -- Get user's current plan and next allowed withdrawal time
  SELECT 
    current_plan::text,
    next_withdrawal_allowed_at,
    p.can_withdraw,
    p.withdrawal_frequency
  INTO user_plan, next_allowed, plan_can_withdraw, plan_frequency
  FROM public.profiles pr
  LEFT JOIN public.plans p ON p.type = pr.current_plan
  WHERE pr.id = user_uuid;
  
  -- Check if plan allows withdrawal at all
  IF NOT plan_can_withdraw THEN
    RETURN false;
  END IF;
  
  -- Check if enough time has passed
  IF next_allowed > now() THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to update next withdrawal time after successful withdrawal
CREATE OR REPLACE FUNCTION public.update_next_withdrawal_time(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_frequency text;
BEGIN
  -- Get user's plan withdrawal frequency
  SELECT p.withdrawal_frequency
  INTO plan_frequency
  FROM public.profiles pr
  LEFT JOIN public.plans p ON p.type = pr.current_plan
  WHERE pr.id = user_uuid;
  
  -- Update next allowed withdrawal time based on frequency
  IF plan_frequency = 'daily' THEN
    UPDATE public.profiles 
    SET next_withdrawal_allowed_at = now() + interval '1 day'
    WHERE id = user_uuid;
  ELSIF plan_frequency = 'weekly' THEN
    UPDATE public.profiles 
    SET next_withdrawal_allowed_at = now() + interval '7 days'
    WHERE id = user_uuid;
  END IF;
  
  RETURN true;
END;
$$;

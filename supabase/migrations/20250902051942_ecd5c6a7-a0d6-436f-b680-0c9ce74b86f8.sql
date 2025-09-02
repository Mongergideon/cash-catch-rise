-- Expire all active plans and set renewal price to ₦4700
UPDATE public.profiles 
SET 
  plan_expires_at = now() - interval '1 day',  -- Set all plans to expired
  renewal_deadline = now() + interval '3 days', -- Give 3 days to renew
  renewal_price = 4700,  -- Set rollover fee to ₦4700
  plan_before_expiry = CASE 
    WHEN current_plan != 'free_trial' THEN current_plan 
    ELSE 'bronze' 
  END,
  current_plan = 'free_trial',  -- Revert everyone to free trial
  updated_at = now()
WHERE current_plan != 'free_trial' OR plan_expires_at > now();
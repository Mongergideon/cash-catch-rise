-- Update all existing renewal deadlines to be 3 days instead of 1 day
UPDATE public.profiles 
SET renewal_deadline = plan_expires_at + interval '3 days'
WHERE renewal_deadline IS NOT NULL;
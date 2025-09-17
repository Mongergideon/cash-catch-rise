-- Update users who still have the 4700 renewal price to 14000
UPDATE public.profiles 
SET renewal_price = 14000 
WHERE renewal_price = 4700;

-- Also ensure the default is set to 14000 for new users
ALTER TABLE public.profiles 
ALTER COLUMN renewal_price SET DEFAULT 14000;
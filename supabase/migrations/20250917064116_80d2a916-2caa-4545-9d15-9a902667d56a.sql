-- Update the default renewal price to 14,000
ALTER TABLE public.profiles 
ALTER COLUMN renewal_price SET DEFAULT 14000;

-- Update existing users who still have the old default price
UPDATE public.profiles 
SET renewal_price = 14000 
WHERE renewal_price = 3800;
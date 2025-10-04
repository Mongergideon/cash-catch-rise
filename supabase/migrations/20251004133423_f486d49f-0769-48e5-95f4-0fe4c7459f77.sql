-- Add RLS policies for admins table to allow login functionality

-- Allow anyone to check if admins exist (needed for the sign up/login switch)
CREATE POLICY "Anyone can check if admins exist"
ON public.admins
FOR SELECT
USING (true);

-- Note: INSERT is handled through the sign-up flow which uses service role

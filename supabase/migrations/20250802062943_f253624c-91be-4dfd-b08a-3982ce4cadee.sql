-- Add daily play tracking and limits
CREATE TABLE public.daily_game_plays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  game_type text NOT NULL,
  plays_count integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add unique constraint to prevent duplicate daily records
ALTER TABLE public.daily_game_plays
ADD CONSTRAINT unique_user_game_date UNIQUE (user_id, game_type, date);

-- Enable RLS
ALTER TABLE public.daily_game_plays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own daily plays" 
ON public.daily_game_plays 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plays" 
ON public.daily_game_plays 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plays" 
ON public.daily_game_plays 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add daily play limits to plans table
ALTER TABLE public.plans 
ADD COLUMN daily_play_limit integer DEFAULT 5;

-- Update existing plans with play limits
UPDATE public.plans SET daily_play_limit = 3 WHERE type = 'free_trial';
UPDATE public.plans SET daily_play_limit = 5 WHERE type = 'starter';
UPDATE public.plans SET daily_play_limit = 8 WHERE type = 'bronze';
UPDATE public.plans SET daily_play_limit = 12 WHERE type = 'silver';
UPDATE public.plans SET daily_play_limit = 20 WHERE type = 'gold';
UPDATE public.plans SET daily_play_limit = 30 WHERE type = 'platinum';

-- Function to check if user can play a game today
CREATE OR REPLACE FUNCTION public.can_user_play_game(user_uuid uuid, game_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan_limit integer;
  current_plays integer;
BEGIN
  -- Get user's daily play limit
  SELECT p.daily_play_limit
  INTO user_plan_limit
  FROM public.profiles pr
  LEFT JOIN public.plans p ON p.type = pr.current_plan
  WHERE pr.id = user_uuid;
  
  -- Get current plays for today
  SELECT COALESCE(plays_count, 0)
  INTO current_plays
  FROM public.daily_game_plays
  WHERE user_id = user_uuid 
    AND game_type = game_name 
    AND date = CURRENT_DATE;
  
  -- Check if user can play
  RETURN current_plays < user_plan_limit;
END;
$$;

-- Function to increment play count
CREATE OR REPLACE FUNCTION public.increment_game_play(user_uuid uuid, game_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.daily_game_plays (user_id, game_type, plays_count, date)
  VALUES (user_uuid, game_name, 1, CURRENT_DATE)
  ON CONFLICT (user_id, game_type, date)
  DO UPDATE SET 
    plays_count = daily_game_plays.plays_count + 1,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;
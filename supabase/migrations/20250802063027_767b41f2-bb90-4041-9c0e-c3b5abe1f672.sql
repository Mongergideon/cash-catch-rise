-- Fix security issues by adding SET search_path to functions
CREATE OR REPLACE FUNCTION public.can_user_play_game(user_uuid uuid, game_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.increment_game_play(user_uuid uuid, game_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
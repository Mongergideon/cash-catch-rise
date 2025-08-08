-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for maintenance mode
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for app_settings (admin only)
CREATE POLICY "Only admins can view settings" 
ON public.app_settings 
FOR SELECT 
USING (EXISTS(SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Only admins can modify settings" 
ON public.app_settings 
FOR ALL 
USING (EXISTS(SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admin function to send notifications
CREATE OR REPLACE FUNCTION public.admin_send_notification(
  user_ids UUID[],
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Insert notification for each user
  FOREACH user_id IN ARRAY user_ids
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (user_id, notification_title, notification_message, notification_type);
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Admin function to toggle maintenance mode
CREATE OR REPLACE FUNCTION public.admin_set_maintenance_mode(
  enabled BOOLEAN,
  custom_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Upsert maintenance mode setting
  INSERT INTO public.app_settings (key, value)
  VALUES (
    'maintenance_mode',
    jsonb_build_object(
      'enabled', enabled,
      'message', COALESCE(custom_message, 'We are currently performing scheduled maintenance to improve your experience.'),
      'updated_at', now(),
      'updated_by', auth.uid()
    )
  )
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = jsonb_build_object(
      'enabled', enabled,
      'message', COALESCE(custom_message, 'We are currently performing scheduled maintenance to improve your experience.'),
      'updated_at', now(),
      'updated_by', auth.uid()
    ),
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Function to get maintenance mode status (public)
CREATE OR REPLACE FUNCTION public.get_maintenance_mode()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT value INTO settings
  FROM public.app_settings
  WHERE key = 'maintenance_mode';
  
  -- Return default if no setting exists
  IF settings IS NULL THEN
    RETURN jsonb_build_object('enabled', false, 'message', '');
  END IF;
  
  RETURN settings;
END;
$$;
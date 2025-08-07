-- Update withdrawal_status enum to include 'approved' and 'processing'
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'approved';

-- Create admin notifications table for rich notifications feature
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on admin notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view published notifications
CREATE POLICY "Users can view published notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (published = true);

-- Create maintenance mode settings table
CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  message TEXT DEFAULT 'We are currently performing scheduled maintenance.',
  scheduled_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on maintenance settings
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Policy for public access to maintenance settings
CREATE POLICY "Anyone can view maintenance settings" 
ON public.maintenance_settings 
FOR SELECT 
USING (true);

-- Insert default maintenance settings
INSERT INTO public.maintenance_settings (is_enabled, message) 
VALUES (false, 'We are currently performing scheduled maintenance to improve your experience.')
ON CONFLICT DO NOTHING;
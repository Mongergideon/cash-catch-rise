-- Add edit-related columns to withdrawals table
ALTER TABLE public.withdrawals 
ADD COLUMN is_edited boolean DEFAULT false,
ADD COLUMN edit_fee_paid boolean DEFAULT false,
ADD COLUMN edit_payment_reference text;

-- Create withdrawal edit requests table
CREATE TABLE public.withdrawal_edit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  withdrawal_id uuid NOT NULL REFERENCES public.withdrawals(id),
  user_id uuid NOT NULL,
  new_account_name text NOT NULL,
  new_account_number text NOT NULL,
  new_bank_name text NOT NULL,
  edit_fee_paid boolean DEFAULT false,
  payment_reference text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  processed_by uuid
);

-- Enable RLS on withdrawal_edit_requests
ALTER TABLE public.withdrawal_edit_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for withdrawal_edit_requests
CREATE POLICY "Users can insert own edit requests" 
ON public.withdrawal_edit_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own edit requests" 
ON public.withdrawal_edit_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Function to create notification when user performs actions
CREATE OR REPLACE FUNCTION public.create_user_action_notification(
  user_uuid uuid,
  action_type text,
  action_details jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_title text;
  notification_message text;
BEGIN
  -- Generate notification content based on action type
  CASE action_type
    WHEN 'withdrawal_request' THEN
      notification_title := 'Withdrawal Request Submitted';
      notification_message := format('Your withdrawal request for ₦%s has been submitted and is under review.', 
        (action_details->>'amount')::text);
    
    WHEN 'withdrawal_approved' THEN
      notification_title := 'Withdrawal Approved';
      notification_message := format('Your withdrawal of ₦%s has been approved and will be processed within 24-48 hours.', 
        (action_details->>'amount')::text);
    
    WHEN 'withdrawal_rejected' THEN
      notification_title := 'Withdrawal Rejected';
      notification_message := format('Your withdrawal request for ₦%s has been rejected. Please contact support for details.', 
        (action_details->>'amount')::text);
    
    WHEN 'game_earning' THEN
      notification_title := 'Game Earnings';
      notification_message := format('You earned ₦%s playing %s!', 
        (action_details->>'amount')::text,
        (action_details->>'game_name')::text);
    
    WHEN 'daily_bonus' THEN
      notification_title := 'Daily Bonus Claimed';
      notification_message := format('You received your daily bonus of ₦%s!', 
        (action_details->>'amount')::text);
    
    WHEN 'referral_reward' THEN
      notification_title := 'Referral Reward';
      notification_message := format('You earned ₦%s for referring a new user!', 
        (action_details->>'amount')::text);
    
    WHEN 'plan_upgrade' THEN
      notification_title := 'Plan Upgraded';
      notification_message := format('Your plan has been upgraded to %s. Enjoy increased earning limits!', 
        (action_details->>'plan_name')::text);
    
    ELSE
      notification_title := 'Account Activity';
      notification_message := 'There has been activity on your account.';
  END CASE;

  -- Insert notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (user_uuid, notification_title, notification_message, 'info');

  RETURN true;
END;
$$;

-- Function for admins to process withdrawal edit requests
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal_edit(
  edit_request_id uuid,
  new_status text,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edit_request RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = admin_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin';
  END IF;
  
  -- Get edit request details
  SELECT * INTO edit_request
  FROM public.withdrawal_edit_requests
  WHERE id = edit_request_id;
  
  IF edit_request IS NULL THEN
    RAISE EXCEPTION 'Edit request not found';
  END IF;
  
  -- Update edit request status
  UPDATE public.withdrawal_edit_requests
  SET 
    status = new_status,
    processed_at = now(),
    processed_by = admin_user_id
  WHERE id = edit_request_id;
  
  -- If approved, update the original withdrawal with new details
  IF new_status = 'approved' THEN
    UPDATE public.withdrawals
    SET 
      account_name = edit_request.new_account_name,
      account_number = edit_request.new_account_number,
      bank_name = edit_request.new_bank_name,
      is_edited = true
    WHERE id = edit_request.withdrawal_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to get maintenance mode status for users
CREATE OR REPLACE FUNCTION public.get_maintenance_status()
RETURNS jsonb
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
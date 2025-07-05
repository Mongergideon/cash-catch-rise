
-- Create enum types for better data integrity
CREATE TYPE plan_type AS ENUM ('free_trial', 'starter', 'bronze', 'silver', 'gold', 'platinum');
CREATE TYPE transaction_type AS ENUM ('wallet_fund', 'plan_purchase', 'store_purchase', 'game_earning', 'referral_earning', 'daily_bonus', 'withdrawal_fee');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE game_type AS ENUM ('money_falling', 'coin_runner', 'spin_wheel', 'memory_flip');

-- Users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  wallet_funding DECIMAL(10,2) DEFAULT 0.00,
  wallet_earnings DECIMAL(10,2) DEFAULT 0.00,
  current_plan plan_type DEFAULT 'free_trial',
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  next_withdraw_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type plan_type NOT NULL UNIQUE,
  cost DECIMAL(10,2) NOT NULL,
  max_daily_earnings DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  can_withdraw BOOLEAN NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User plan history
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Daily earnings tracking
CREATE TABLE public.daily_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  game_earnings DECIMAL(10,2) DEFAULT 0.00,
  referral_earnings DECIMAL(10,2) DEFAULT 0.00,
  bonus_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Game sessions and earnings
CREATE TABLE public.game_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  taps_count INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions log
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status withdrawal_status DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store items
CREATE TABLE public.store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store purchases
CREATE TABLE public.store_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.store_items(id),
  cost DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily bonus claims
CREATE TABLE public.daily_bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_amount DECIMAL(10,2) DEFAULT 500.00,
  reward_issued BOOLEAN DEFAULT FALSE,
  reward_issued_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Admin users
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.plans (name, type, cost, max_daily_earnings, duration_days, can_withdraw) VALUES
('Free Trial', 'free_trial', 0.00, 3000.00, 999999, false),
('Starter', 'starter', 5000.00, 8000.00, 30, true),
('Bronze', 'bronze', 10000.00, 20000.00, 30, true),
('Silver', 'silver', 20000.00, 40000.00, 30, true),
('Gold', 'gold', 50000.00, 100000.00, 30, true),
('Platinum', 'platinum', 100000.00, 200000.00, 30, true);

-- Insert default store items
INSERT INTO public.store_items (name, description, cost, type) VALUES
('Magnet Power', 'Attracts money items for 30 seconds', 100.00, 'power_up'),
('Auto Tap Glove', 'Automatically taps for 60 seconds', 200.00, 'power_up'),
('Slow Motion', 'Slows down falling money for 45 seconds', 150.00, 'power_up'),
('Bonus Spin Token', 'Extra spin for the wheel game', 50.00, 'token');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_plans
CREATE POLICY "Users can view own plans" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_earnings
CREATE POLICY "Users can view own earnings" ON public.daily_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own earnings" ON public.daily_earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own earnings" ON public.daily_earnings FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for game_earnings
CREATE POLICY "Users can view own game earnings" ON public.game_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game earnings" ON public.game_earnings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for store_purchases
CREATE POLICY "Users can view own purchases" ON public.store_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.store_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_bonus
CREATE POLICY "Users can view own bonuses" ON public.daily_bonus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bonuses" ON public.daily_bonus FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they made" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view referrals they were referred by" ON public.referrals FOR SELECT USING (auth.uid() = referred_id);
CREATE POLICY "Users can insert referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Public read access for plans and store items
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Anyone can view store items" ON public.store_items FOR SELECT USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, referral_code, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referred_by' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'referred_by')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update wallet balances
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  user_uuid UUID,
  wallet_type TEXT,
  amount DECIMAL,
  transaction_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the appropriate wallet
  IF wallet_type = 'funding' THEN
    UPDATE public.profiles 
    SET wallet_funding = wallet_funding + amount,
        updated_at = NOW()
    WHERE id = user_uuid;
  ELSIF wallet_type = 'earnings' THEN
    UPDATE public.profiles 
    SET wallet_earnings = wallet_earnings + amount,
        updated_at = NOW()
    WHERE id = user_uuid;
  ELSE
    RETURN FALSE;
  END IF;

  -- Log the transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (
    user_uuid,
    CASE 
      WHEN wallet_type = 'funding' THEN 'wallet_fund'::transaction_type
      ELSE 'game_earning'::transaction_type
    END,
    amount,
    COALESCE(transaction_description, 'Wallet update')
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and issue referral rewards
CREATE OR REPLACE FUNCTION public.check_referral_rewards()
RETURNS TRIGGER AS $$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if this is a game earning that crosses the 5000 threshold
  IF NEW.type = 'game_earning' THEN
    -- Get user's total earnings
    SELECT SUM(amount) as total_earnings INTO referrer_record
    FROM public.transactions 
    WHERE user_id = NEW.user_id AND type = 'game_earning';
    
    -- Check if user just crossed 5000 and has a referrer
    IF referrer_record.total_earnings >= 5000 THEN
      -- Get user's referrer info
      SELECT r.referrer_id, r.reward_issued INTO referrer_record
      FROM public.referrals r
      WHERE r.referred_id = NEW.user_id AND r.reward_issued = FALSE
      LIMIT 1;
      
      -- Issue reward if referrer exists and reward not yet issued
      IF FOUND THEN
        -- Add reward to referrer's earnings wallet
        UPDATE public.profiles 
        SET wallet_earnings = wallet_earnings + 500.00,
            updated_at = NOW()
        WHERE id = referrer_record.referrer_id;
        
        -- Mark reward as issued
        UPDATE public.referrals 
        SET reward_issued = TRUE,
            reward_issued_at = NOW()
        WHERE referrer_id = referrer_record.referrer_id AND referred_id = NEW.user_id;
        
        -- Log the referral reward transaction
        INSERT INTO public.transactions (user_id, type, amount, description)
        VALUES (
          referrer_record.referrer_id,
          'referral_earning'::transaction_type,
          500.00,
          'Referral reward - referred user earned ₦5,000+'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral rewards
CREATE TRIGGER check_referral_rewards_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_referral_rewards();

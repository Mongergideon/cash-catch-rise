
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Coins, 
  RotateCcw, 
  Brain, 
  TrendingUp, 
  Gift,
  Wallet,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import WelcomePopup from '@/components/WelcomePopup';
import GameCard from '@/components/GameCard';

interface Profile {
  wallet_earnings: number;
  wallet_funding: number;
  current_plan: string;
  plan_expires_at: string;
  first_name: string;
}

interface DailyEarnings {
  total_earned: number;
}

interface Plan {
  games_unlocked: number;
}

const Index = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings | null>(null);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDailyEarnings();
      checkFirstLogin();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  const checkFirstLogin = () => {
    const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user?.id}`);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem(`welcome_seen_${user?.id}`, 'true');
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_earnings, wallet_funding, current_plan, plan_expires_at, first_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('plans')
        .select('games_unlocked')
        .eq('type', profile.current_plan)
        .single();

      if (error) throw error;
      setUserPlan(data);
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const fetchDailyEarnings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_earnings')
        .select('total_earned')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setDailyEarnings(data || { total_earned: 0 });
    } catch (error) {
      console.error('Error fetching daily earnings:', error);
    }
  };

  const claimDailyBonus = async () => {
    if (!user) return;

    try {
      const bonusAmount = Math.floor(Math.random() * 401) + 100; // ₦100-₦500
      
      const { error: bonusError } = await supabase
        .from('daily_bonus')
        .insert({
          user_id: user.id,
          amount: bonusAmount
        });

      if (bonusError) {
        if (bonusError.code === '23505') {
          toast({
            variant: "destructive",
            title: "Already Claimed",
            description: "You've already claimed today's bonus",
          });
          return;
        }
        throw bonusError;
      }

      // Update wallet balance
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        user_uuid: user.id,
        wallet_type: 'earnings',
        amount: bonusAmount,
        transaction_description: 'Daily login bonus'
      });

      if (walletError) throw walletError;

      toast({
        title: "Daily Bonus Claimed!",
        description: `You earned ₦${bonusAmount.toLocaleString()}`,
      });

      fetchProfile();
      fetchDailyEarnings();
    } catch (error) {
      console.error('Error claiming daily bonus:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim daily bonus",
      });
    }
  };

  useEffect(() => {
    if (profile) {
      fetchUserPlan();
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to Cash Catch Rise</h2>
        <p className="mb-6">Please login to start earning money by playing games!</p>
        <Link to="/auth">
          <Button className="gradient-primary text-white">
            Login / Register
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const games = [
    {
      title: 'Cashing Money Falling',
      description: 'Tap falling money to earn real cash',
      icon: <Coins className="h-8 w-8 text-yellow-500" />,
      route: '/game/money-falling',
      color: 'from-yellow-400 to-yellow-600',
      gameNumber: 1,
      requiredPlan: 'Any Plan'
    },
    {
      title: 'Coin Runner',
      description: 'Endless runner with coin collection',
      icon: <Gamepad2 className="h-8 w-8 text-blue-500" />,
      route: '/game/coin-runner',
      color: 'from-blue-400 to-blue-600',
      gameNumber: 2,
      requiredPlan: 'Starter Plan'
    },
    {
      title: 'Spin to Win',
      description: 'Spin the wheel every 2 hours',
      icon: <RotateCcw className="h-8 w-8 text-purple-500" />,
      route: '/game/spin-wheel',
      color: 'from-purple-400 to-purple-600',
      gameNumber: 3,
      requiredPlan: 'Bronze Plan'
    },
    {
      title: 'Memory Flip',
      description: 'Match Naira pairs under timer',
      icon: <Brain className="h-8 w-8 text-green-500" />,
      route: '/game/memory-flip',
      color: 'from-green-400 to-green-600',
      gameNumber: 4,
      requiredPlan: 'Silver Plan'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <WelcomePopup isOpen={showWelcome} onClose={handleWelcomeClose} />

      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.first_name || 'Player'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Ready to earn some money today?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Wallet className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">₦{profile?.wallet_earnings?.toLocaleString() || '0'}</p>
              <p className="text-gray-600">Earnings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">₦{dailyEarnings?.total_earned?.toLocaleString() || '0'}</p>
              <p className="text-gray-600">Today's Earnings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <Badge variant="outline" className="capitalize">
                {profile?.current_plan?.replace('_', ' ') || 'Free Trial'}
              </Badge>
              <p className="text-gray-600 mt-1">Current Plan</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <Button 
                onClick={claimDailyBonus}
                variant="outline" 
                size="sm"
                className="mb-1"
              >
                Claim Bonus
              </Button>
              <p className="text-gray-600 text-xs">Daily ₦100-₦500</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎮 Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <GameCard
              key={index}
              title={game.title}
              description={game.description}
              icon={game.icon}
              route={game.route}
              color={game.color}
              gameNumber={game.gameNumber}
              userPlanGames={userPlan?.games_unlocked || 1}
              requiredPlan={game.requiredPlan}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/wallet">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <Wallet className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="font-semibold">View Wallet</p>
                  <p className="text-sm text-gray-600">Check balances & withdraw</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/plans">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-semibold">Upgrade Plan</p>
                  <p className="text-sm text-gray-600">Increase daily earnings</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/referral">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="font-semibold">Refer Friends</p>
                  <p className="text-sm text-gray-600">Earn ₦500 per referral</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

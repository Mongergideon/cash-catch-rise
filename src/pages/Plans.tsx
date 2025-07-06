import React, { useState, useEffect } from 'react';
import { Crown, Star, Award, Gem, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Declare FlutterwaveCheckout for TypeScript
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

interface Plan {
  id: string;
  name: string;
  cost: number;
  max_daily_earnings: number;
  duration_days: number;
  can_withdraw: boolean;
  type: string;
  withdrawal_frequency?: string;
  games_unlocked?: number;
}

interface UserProfile {
  current_plan: string;
  plan_expires_at: string | null;
  wallet_funding: number;
}

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const getIconForPlan = (type: string) => {
    switch (type.toLowerCase()) {
      case 'starter': return Zap;
      case 'bronze': return Award;
      case 'silver': return Star;
      case 'gold': return Crown;
      case 'platinum': return Gem;
      default: return Star;
    }
  };

  const getColorForPlan = (type: string) => {
    switch (type.toLowerCase()) {
      case 'starter': return 'text-blue-500';
      case 'bronze': return 'text-orange-600';
      case 'silver': return 'text-gray-500';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchUserProfile();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('cost');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load plans",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_plan, plan_expires_at, wallet_funding')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handlePlanPurchase = async (plan: Plan) => {
    if (!user || !userProfile) return;

    if (userProfile.wallet_funding < plan.cost) {
      // Use Flutterwave for direct payment if insufficient wallet funds
      const flutterwaveConfig = {
        public_key: "FLWPUBK-b816426ded5868e3496fc1e7cba02c85-X", // Your live public key
        tx_ref: `plan_${plan.id}_${Date.now()}`,
        amount: plan.cost,
        currency: "NGN",
        country: "NG",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: user.email || "",
          phone_number: "",
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        },
        customizations: {
          title: `Purchase ${plan.name} Plan`,
          description: `Upgrade to ${plan.name} plan`,
          logo: "",
        },
        callback: async (response: any) => {
          if (response.status === "successful") {
            await completePlanPurchase(plan);
          }
        },
        onclose: () => {
          console.log("Payment modal closed");
        },
      };

      // Check if FlutterwaveCheckout is available
      if (typeof window.FlutterwaveCheckout !== 'undefined') {
        window.FlutterwaveCheckout(flutterwaveConfig);
      } else {
        // Fallback: Load Flutterwave script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.onload = () => {
          if (window.FlutterwaveCheckout) {
            window.FlutterwaveCheckout(flutterwaveConfig);
          }
        };
        document.head.appendChild(script);
      }
      return;
    }

    // Use wallet funds if sufficient
    await completePlanPurchase(plan);
  };

  const completePlanPurchase = async (plan: Plan) => {
    setPurchasing(plan.id);
    try {
      // Update wallet balance only if using wallet funds
      if (userProfile && userProfile.wallet_funding >= plan.cost) {
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: user!.id,
          wallet_type: 'funding',
          amount: -plan.cost,
          transaction_description: `Plan purchase: ${plan.name}`
        });

        if (walletError) throw walletError;
      }

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      // Insert user plan
      const { error: planError } = await supabase
        .from('user_plans')
        .insert({
          user_id: user!.id,
          plan_type: plan.type as any,
          cost: plan.cost,
          expires_at: expiresAt.toISOString()
        });

      if (planError) throw planError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_plan: plan.type as any,
          plan_expires_at: expiresAt.toISOString()
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      toast({
        title: "Plan Purchased Successfully!",
        description: `You've upgraded to ${plan.name}`,
      });

      // Refresh user profile
      fetchUserProfile();
    } catch (error) {
      console.error('Error purchasing plan:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to purchase plan. Please try again.",
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to view plans.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Investment Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upgrade your plan to unlock higher earning potential and withdrawal privileges. Free Trial users have limited features.
        </p>
      </div>

      {/* Current Plan Alert */}
      {userProfile && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-blue-500" size={20} />
              <div>
                <p className="font-semibold text-blue-900">
                  Current Plan: {userProfile.current_plan?.replace('_', ' ').toUpperCase() || 'FREE TRIAL'}
                </p>
                <p className="text-sm text-blue-700">
                  {userProfile.plan_expires_at 
                    ? `Expires: ${new Date(userProfile.plan_expires_at).toLocaleDateString()}`
                    : 'No expiry date'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Restrictions Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="font-semibold text-amber-900">Plan Benefits & Restrictions:</p>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• <strong>Free Trial:</strong> Cannot withdraw earnings - upgrade to unlock withdrawals</li>
              <li>• <strong>Starter - Silver:</strong> Weekly withdrawals only</li>
              <li>• <strong>Gold & Platinum:</strong> Daily withdrawals + access to all games</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const IconComponent = getIconForPlan(plan.type);
          const isCurrentPlan = userProfile?.current_plan === plan.type;
          const isPopular = plan.type === 'bronze';
          
          return (
            <Card 
              key={plan.id} 
              className={`relative bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              } ${isPopular ? 'border-2 border-primary' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center bg-gray-50 rounded-t-lg">
                <div className="flex justify-center mb-2">
                  <IconComponent className={getColorForPlan(plan.type)} size={32} />
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    ₦{plan.cost.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">{plan.duration_days} days</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    Daily Cap: ₦{plan.max_daily_earnings.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {plan.can_withdraw ? 
                      `${plan.withdrawal_frequency === 'daily' ? 'Daily' : 'Weekly'} withdrawals` : 
                      'No withdrawal rights'
                    }
                  </p>
                </div>
                
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm text-gray-700">
                      {plan.games_unlocked === 1 ? '1 game access' : 
                       plan.games_unlocked === 4 ? 'All games access' :
                       `${plan.games_unlocked || 1} games access`}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm text-gray-700">Daily earning cap: ₦{plan.max_daily_earnings.toLocaleString()}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" size={16} />
                    <span className="text-sm text-gray-700">{plan.duration_days} days duration</span>
                  </li>
                  {plan.can_withdraw && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm text-gray-700">
                        {plan.withdrawal_frequency === 'daily' ? 'Daily' : 'Weekly'} withdrawal access
                      </span>
                    </li>
                  )}
                  {!plan.can_withdraw && (
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="text-red-500" size={16} />
                      <span className="text-sm text-red-700">No withdrawal privileges</span>
                    </li>
                  )}
                </ul>
                
                <Button
                  onClick={() => handlePlanPurchase(plan)}
                  disabled={purchasing === plan.id || isCurrentPlan}
                  className={`w-full ${
                    isCurrentPlan 
                      ? 'bg-gray-500 hover:bg-gray-600' 
                      : 'gradient-primary hover:opacity-90'
                  } text-white`}
                >
                  {purchasing === plan.id ? 'Purchasing...' : isCurrentPlan ? 'Current Plan' : 'Purchase Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wallet Balance */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 text-center">
          <p className="text-green-900 font-semibold">
            Funding Wallet Balance: ₦{userProfile?.wallet_funding?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-700">
            Need more funds? Visit the Wallet page to add money.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Plans;

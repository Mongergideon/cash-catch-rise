import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Declare FlutterwaveCheckout for TypeScript
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

interface Profile {
  renewal_deadline: string | null;
  renewal_price: number;
  plan_before_expiry: string | null;
}

const PlanRenewalBanner = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.renewal_deadline) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const deadline = new Date(profile.renewal_deadline!).getTime();
        const distance = deadline - now;

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft('Expired');
          clearInterval(timer);
          // Auto-refresh profile when deadline passes
          fetchProfile();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [profile?.renewal_deadline]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('renewal_deadline, renewal_price, plan_before_expiry')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleRenewal = async () => {
    if (!user || !profile) return;

    const flutterwaveConfig = {
      public_key: "FLWPUBK-b816426ded5868e3496fc1e7cba02c85-X",
      tx_ref: `renewal_${user.id}_${Date.now()}`,
      amount: profile.renewal_price,
      currency: "NGN",
      country: "NG",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: user.email || "",
        phone_number: "",
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
      },
      customizations: {
        title: "Plan Renewal",
        description: `Renew your ${profile.plan_before_expiry} plan`,
        logo: "",
      },
      callback: async (response: any) => {
        if (response.status === "successful") {
          await processRenewal(response.transaction_id);
        }
      },
      onclose: () => {
        console.log("Payment modal closed");
      },
    };

    setProcessing(true);
    try {
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
    } finally {
      setProcessing(false);
    }
  };

  const processRenewal = async (transactionId: string) => {
    try {
      const { error } = await supabase.rpc('process_plan_renewal', {
        user_uuid: user!.id,
        payment_reference: transactionId
      });

      if (error) throw error;

      toast({
        title: "Plan Renewed Successfully!",
        description: "Your plan has been renewed for 30 days.",
      });

      // Refresh profile to hide banner
      fetchProfile();
    } catch (error) {
      console.error('Error processing renewal:', error);
      toast({
        variant: "destructive",
        title: "Renewal Failed",
        description: "Failed to process renewal. Please contact support.",
      });
    }
  };

  // Don't show banner if no renewal deadline or if expired
  if (!profile?.renewal_deadline || timeLeft === 'Expired') {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <h3 className="font-semibold text-orange-900">Plan Renewal Required</h3>
              <p className="text-sm text-orange-700">
                Your plan has expired. Renew now for only ₦{profile.renewal_price?.toLocaleString()} to continue earning!
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock size={16} />
                <span className="font-mono text-sm font-semibold">{timeLeft}</span>
              </div>
              <p className="text-xs text-orange-500">Time left</p>
            </div>
            
            <Button
              onClick={handleRenewal}
              disabled={processing}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {processing ? 'Processing...' : 'Renew Now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanRenewalBanner;
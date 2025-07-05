
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, Gift, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  referral_code: string;
  wallet_earnings: number;
}

interface Referral {
  id: string;
  referred_id: string;
  reward_amount: number;
  reward_issued: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const Referral = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchReferrals();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, wallet_earnings')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          reward_amount,
          reward_issued,
          created_at,
          profiles!referrals_referred_id_fkey(first_name, last_name)
        `)
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const copyReferralLink = () => {
    if (!profile?.referral_code) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareReferral = () => {
    if (!profile?.referral_code) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${profile.referral_code}`;
    const text = `Join Cash Catch Rise and start earning real money! Use my referral code: ${profile.referral_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Cash Catch Rise',
        text: text,
        url: referralLink,
      });
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to access referrals.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading referral data...</p>
      </div>
    );
  }

  const totalEarnings = referrals.reduce((sum, ref) => 
    sum + (ref.reward_issued ? ref.reward_amount : 0), 0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-600 mt-2">Earn ₦500 for each successful referral</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-gray-600">Total Referrals</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</p>
              <p className="text-gray-600">Total Earned</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Share className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{referrals.filter(r => r.reward_issued).length}</p>
              <p className="text-gray-600">Paid Referrals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={profile?.referral_code || ''}
              readOnly
              className="font-mono text-lg"
            />
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={shareReferral} className="gradient-primary text-white">
              <Share className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
            <Button onClick={copyReferralLink} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">How it works:</h4>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>• Share your referral code with friends</li>
              <li>• They sign up and start earning ₦5,000+</li>
              <li>• You earn ₦500 for each successful referral</li>
              <li>• Rewards are paid to your earnings wallet</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No referrals yet. Start sharing your code!
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {referral.profiles?.first_name} {referral.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Joined: {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{referral.reward_amount.toLocaleString()}</p>
                    <Badge variant={referral.reward_issued ? "default" : "secondary"}>
                      {referral.reward_issued ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Referral;

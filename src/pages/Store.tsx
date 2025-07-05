
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Zap, Target, Clock, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: string;
  is_active: boolean;
}

interface Profile {
  wallet_funding: number;
}

const Store = () => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const getItemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'magnet power':
        return <Target className="h-8 w-8 text-blue-500" />;
      case 'auto tap glove':
        return <Zap className="h-8 w-8 text-yellow-500" />;
      case 'slow motion':
        return <Clock className="h-8 w-8 text-purple-500" />;
      case 'bonus spin token':
        return <RotateCcw className="h-8 w-8 text-green-500" />;
      default:
        return <ShoppingBag className="h-8 w-8 text-gray-500" />;
    }
  };

  useEffect(() => {
    if (user) {
      fetchStoreItems();
      fetchProfile();
    }
  }, [user]);

  const fetchStoreItems = async () => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('cost');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching store items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load store items",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_funding')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const purchaseItem = async (item: StoreItem) => {
    if (!user || !profile) return;

    if (profile.wallet_funding < item.cost) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "You don't have enough funding wallet balance",
      });
      return;
    }

    setPurchasing(item.id);
    try {
      // Update wallet balance
      const { error: updateError } = await supabase.rpc('update_wallet_balance', {
        user_uuid: user.id,
        wallet_type: 'funding',
        amount: -item.cost,
        transaction_description: `Store purchase: ${item.name}`
      });

      if (updateError) throw updateError;

      // Record purchase with proper date conversion
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const { error: purchaseError } = await supabase
        .from('store_purchases')
        .insert({
          user_id: user.id,
          item_id: item.id,
          cost: item.cost,
          expires_at: expiresAt.toISOString()
        });

      if (purchaseError) throw purchaseError;

      toast({
        title: "Purchase Successful!",
        description: `You've purchased ${item.name}`,
      });

      // Refresh profile
      fetchProfile();
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to complete purchase",
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to access the store.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading store items...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Power-Up Store</h1>
        <p className="text-gray-600 mt-2">Boost your earnings with power-ups</p>
        <div className="mt-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Funding Balance: ₦{profile?.wallet_funding?.toLocaleString() || '0'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {getItemIcon(item.name)}
              </div>
              <CardTitle className="text-xl">{item.name}</CardTitle>
              <p className="text-gray-600">{item.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-green-600">
                  ₦{item.cost.toLocaleString()}
                </span>
              </div>
              <Button
                onClick={() => purchaseItem(item)}
                disabled={purchasing === item.id || (profile?.wallet_funding || 0) < item.cost}
                className="w-full gradient-primary text-white"
              >
                {purchasing === item.id ? 'Purchasing...' : 'Purchase'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Store;

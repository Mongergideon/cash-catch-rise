
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCw, Gift, Clock, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const SpinWheel = () => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpinTime, setLastSpinTime] = useState<Date | null>(null);
  const [nextSpinTime, setNextSpinTime] = useState<Date | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [profile, setProfile] = useState<{wallet_funding: number} | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const prizes = [
    { label: '₦50', value: 50, color: '#ef4444', probability: 30 },
    { label: '₦100', value: 100, color: '#f97316', probability: 25 },
    { label: '₦200', value: 200, color: '#eab308', probability: 20 },
    { label: '₦300', value: 300, color: '#22c55e', probability: 15 },
    { label: '₦400', value: 400, color: '#3b82f6', probability: 7 },
    { label: '₦500', value: 500, color: '#8b5cf6', probability: 3 },
  ];

  useEffect(() => {
    if (user) {
      checkLastSpin();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (nextSpinTime) {
        const now = new Date();
        setCanSpin(now >= nextSpinTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextSpinTime]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_funding')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkLastSpin = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_earnings')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('game_type', 'spin_wheel')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastSpin = new Date(data[0].created_at);
        setLastSpinTime(lastSpin);
        
        const nextSpin = new Date(lastSpin.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
        setNextSpinTime(nextSpin);
        
        const now = new Date();
        setCanSpin(now >= nextSpin);
      }
    } catch (error) {
      console.error('Error checking last spin:', error);
    }
  };

  const getRandomPrize = () => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    
    return prizes[0]; // fallback
  };

  const spin = async (isBonus = false) => {
    if (!user || spinning) return;

    if (!canSpin && !isBonus) {
      toast({
        variant: "destructive",
        title: "Too Soon!",
        description: "You can spin again in 2 hours",
      });
      return;
    }

    if (isBonus && (profile?.wallet_funding || 0) < 50) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "You need ₦50 in your funding wallet for a bonus spin",
      });
      return;
    }

    setSpinning(true);

    // Deduct bonus spin cost if applicable
    if (isBonus) {
      try {
        const { error } = await supabase.rpc('update_wallet_balance', {
          user_uuid: user.id,
          wallet_type: 'funding',
          amount: -50,
          transaction_description: 'Bonus spin purchase'
        });

        if (error) throw error;
        await fetchProfile(); // Refresh balance
      } catch (error) {
        console.error('Error deducting bonus spin cost:', error);
        setSpinning(false);
        return;
      }
    }

    const selectedPrize = getRandomPrize();
    const prizeIndex = prizes.indexOf(selectedPrize);
    const segmentAngle = 360 / prizes.length;
    const targetAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
    const spins = 3 + Math.random() * 3; // 3-6 full rotations
    const finalRotation = rotation + (spins * 360) + targetAngle;

    setRotation(finalRotation);

    setTimeout(async () => {
      setSpinning(false);
      setSessionEarnings(prev => prev + selectedPrize.value);

      try {
        // Update wallet balance
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: user.id,
          wallet_type: 'earnings',
          amount: selectedPrize.value,
          transaction_description: `Spin Wheel - Won ${selectedPrize.label}`
        });

        if (walletError) throw walletError;

        // Record game earnings
        const { error: gameError } = await supabase
          .from('game_earnings')
          .insert({
            user_id: user.id,
            game_type: 'spin_wheel',
            amount: selectedPrize.value,
            session_duration: 1
          });

        if (gameError) throw gameError;

        toast({
          title: "Congratulations!",
          description: `You won ${selectedPrize.label}!`,
        });

        // Update spin timing
        if (!isBonus) {
          const now = new Date();
          setLastSpinTime(now);
          const nextSpin = new Date(now.getTime() + (2 * 60 * 60 * 1000));
          setNextSpinTime(nextSpin);
          setCanSpin(false);
        }
      } catch (error) {
        console.error('Error recording spin:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to record winnings",
        });
      }
    }, 3000);
  };

  const getTimeUntilNextSpin = () => {
    if (!nextSpinTime || canSpin) return null;
    
    const now = new Date();
    const diff = nextSpinTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Spin to Win</h1>
        <p className="text-gray-600 mt-2">Spin every 2 hours for free prizes!</p>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Gift className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">₦{sessionEarnings}</p>
              <p className="text-sm text-gray-600">Session Winnings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold">
                {canSpin ? 'Ready!' : getTimeUntilNextSpin()}
              </p>
              <p className="text-sm text-gray-600">Next Free Spin</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-lg font-bold">₦{profile?.wallet_funding?.toLocaleString() || '0'}</p>
              <p className="text-sm text-gray-600">Funding Balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spin Wheel */}
      <Card>
        <CardContent className="flex flex-col items-center p-6">
          <div className="relative">
            <svg width="300" height="300" className="drop-shadow-lg">
              {prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index;
                const nextAngle = (360 / prizes.length) * (index + 1);
                const midAngle = (angle + nextAngle) / 2;
                
                const x1 = 150 + 140 * Math.cos((angle * Math.PI) / 180);
                const y1 = 150 + 140 * Math.sin((angle * Math.PI) / 180);
                const x2 = 150 + 140 * Math.cos((nextAngle * Math.PI) / 180);
                const y2 = 150 + 140 * Math.sin((nextAngle * Math.PI) / 180);
                
                const textX = 150 + 100 * Math.cos((midAngle * Math.PI) / 180);
                const textY = 150 + 100 * Math.sin((midAngle * Math.PI) / 180);
                
                return (
                  <g key={index}>
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 140 140 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            {/* Spinning wheel overlay */}
            <div
              className="absolute inset-0 transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg width="300" height="300">
                {prizes.map((prize, index) => {
                  const angle = (360 / prizes.length) * index;
                  const nextAngle = (360 / prizes.length) * (index + 1);
                  const midAngle = (angle + nextAngle) / 2;
                  
                  const x1 = 150 + 140 * Math.cos((angle * Math.PI) / 180);
                  const y1 = 150 + 140 * Math.sin((angle * Math.PI) / 180);
                  const x2 = 150 + 140 * Math.cos((nextAngle * Math.PI) / 180);
                  const y2 = 150 + 140 * Math.sin((nextAngle * Math.PI) / 180);
                  
                  return (
                    <path
                      key={index}
                      d={`M 150 150 L ${x1} ${y1} A 140 140 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spin Controls */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={() => spin(false)}
          disabled={!canSpin || spinning}
          className="gradient-primary text-white"
          size="lg"
        >
          <RotateCw className={`h-5 w-5 mr-2 ${spinning ? 'animate-spin' : ''}`} />
          {spinning ? 'Spinning...' : canSpin ? 'Free Spin' : 'Wait for Next Spin'}
        </Button>
        
        <Button
          onClick={() => spin(true)}
          disabled={spinning || (profile?.wallet_funding || 0) < 50}
          variant="outline"
          size="lg"
        >
          <Gift className="h-5 w-5 mr-2" />
          Bonus Spin (₦50)
        </Button>
      </div>

      {/* Prize Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prize Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {prizes.map((prize, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: prize.color + '20' }}>
                <span className="font-semibold">{prize.label}</span>
                <Badge variant="secondary">{prize.probability}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpinWheel;

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FallingMoney {
  id: number;
  x: number;
  y: number;
  value: number;
  type: 'note' | 'coin';
  collected: boolean;
}

const GameMoneyFalling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const [fallingMoney, setFallingMoney] = useState<FallingMoney[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [dailyPlays, setDailyPlays] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [canPlay, setCanPlay] = useState(true);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const spawnIntervalRef = useRef<NodeJS.Timeout>();

  const moneyValues = [10, 20, 50, 100, 200, 500];
  const maxTapsPerHour = 500;
  const dailyCap = 3000; // Based on current plan

  useEffect(() => {
    if (user) {
      checkDailyPlays();
    }
  }, [user]);

  useEffect(() => {
    if (gameStarted && !gamePaused) {
      startGameLoop();
      startMoneySpawning();
    } else {
      stopGameLoop();
      stopMoneySpawning();
    }

    return () => {
      stopGameLoop();
      stopMoneySpawning();
    };
  }, [gameStarted, gamePaused]);

  const checkDailyPlays = async () => {
    if (!user) return;

    try {
      // Check daily plays
      const { data: playsData } = await supabase
        .from('daily_game_plays')
        .select('plays_count')
        .eq('user_id', user.id)
        .eq('game_type', 'money_falling')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      // Get user's plan limit
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_plan')
        .eq('id', user.id)
        .single();

      if (profileData) {
        const { data: planData } = await supabase
          .from('plans')
          .select('daily_play_limit')
          .eq('type', profileData.current_plan)
          .single();

        setDailyLimit(planData?.daily_play_limit || 5);
      }

      const currentPlays = playsData?.plays_count || 0;
      setDailyPlays(currentPlays);
      setCanPlay(currentPlays < dailyLimit);
    } catch (error) {
      console.error('Error checking daily plays:', error);
    }
  };

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      updateFallingMoney();
    }, 50);
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  const startMoneySpawning = () => {
    spawnIntervalRef.current = setInterval(() => {
      spawnMoney();
    }, 1500);
  };

  const stopMoneySpawning = () => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
    }
  };

  const spawnMoney = () => {
    if (!gameAreaRef.current) return;

    const gameArea = gameAreaRef.current;
    const money: FallingMoney = {
      id: Date.now() + Math.random(),
      x: Math.random() * (gameArea.offsetWidth - 60),
      y: -60,
      value: moneyValues[Math.floor(Math.random() * moneyValues.length)],
      type: Math.random() > 0.7 ? 'note' : 'coin',
      collected: false
    };

    setFallingMoney(prev => [...prev, money]);
  };

  const updateFallingMoney = () => {
    setFallingMoney(prev => 
      prev
        .map(money => ({ ...money, y: money.y + 3 }))
        .filter(money => money.y < window.innerHeight && !money.collected)
    );
  };

  const handleMoneyTap = async (moneyId: number, value: number) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to play games and earn rewards.",
      });
      return;
    }

    if (tapCount >= maxTapsPerHour) {
      toast({
        variant: "destructive",
        title: "Tap Limit Reached",
        description: "You've reached your hourly tap limit. Please try again later.",
      });
      return;
    }

    if (sessionEarnings >= dailyCap) {
      toast({
        variant: "destructive",
        title: "Daily Cap Reached",
        description: "You've reached your daily earning cap!",
      });
      return;
    }

    setFallingMoney(prev => 
      prev.map(money => 
        money.id === moneyId ? { ...money, collected: true } : money
      )
    );

    const actualEarning = Math.min(value, dailyCap - sessionEarnings);
    setScore(prev => prev + actualEarning);
    setSessionEarnings(prev => prev + actualEarning);
    setTapCount(prev => prev + 1);

    // Add earnings to wallet immediately
    if (actualEarning > 0) {
      try {
        // Update wallet earnings
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: user.id,
          wallet_type: 'earnings',
          amount: actualEarning,
          transaction_description: `Money Falling Game - Tap reward: ₦${actualEarning}`
        });

        if (walletError) {
          console.error('Error updating wallet:', walletError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update wallet balance.",
          });
          return;
        }

        // Record game earnings
        const { error: gameError } = await supabase
          .from('game_earnings')
          .insert({
            user_id: user.id,
            game_type: 'money_falling',
            amount: actualEarning,
            taps_count: 1,
            session_duration: Math.floor(Date.now() / 1000)
          });

        if (gameError) {
          console.error('Error recording game earnings:', gameError);
        }

        toast({
          title: "Earning Added!",
          description: `₦${actualEarning} added to your wallet.`,
        });
      } catch (error) {
        console.error('Error processing earnings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while processing your earnings.",
        });
      }
    }

    // Add bounce effect
    const element = document.getElementById(`money-${moneyId}`);
    if (element) {
      element.classList.add('bounce-effect');
      setTimeout(() => {
        element.classList.remove('bounce-effect');
      }, 500);
    }
  };

  const togglePause = () => {
    setGamePaused(!gamePaused);
  };

  const startGame = async () => {
    if (!canPlay) {
      toast({
        variant: "destructive",
        title: "Daily Limit Reached",
        description: `You can only play ${dailyLimit} times per day with your current plan.`,
      });
      return;
    }

    // Increment play count
    await supabase.rpc('increment_game_play', {
      user_uuid: user?.id,
      game_name: 'money_falling'
    });

    setGameStarted(true);
    checkDailyPlays();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGamePaused(false);
    setScore(0);
    setSessionEarnings(0);
    setFallingMoney([]);
    setTapCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center space-x-2 text-gray-700">
            <ArrowLeft size={24} />
            <span>Back</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Money Falling</h1>
          <div className="flex items-center space-x-2">
            {gameStarted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className="text-gray-700"
              >
                {gamePaused ? <Play size={20} /> : <Pause size={20} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGame}
              className="text-gray-700"
            >
              <RotateCcw size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="absolute top-20 left-0 right-0 z-20 p-4">
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-green-600">₦{score}</p>
              <p className="text-xs text-gray-600">Score</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{tapCount}/{maxTapsPerHour}</p>
              <p className="text-xs text-gray-600">Taps</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-purple-600">₦{sessionEarnings}</p>
              <p className="text-xs text-gray-600">Earned</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Area */}
      <div 
        ref={gameAreaRef}
        className="absolute inset-0 pt-32 pb-20"
        style={{ touchAction: 'none' }}
      >
        {/* Falling Money */}
        {fallingMoney.map((money) => (
          <div
            key={money.id}
            id={`money-${money.id}`}
            className={`absolute cursor-pointer transition-all duration-100 ${
              money.collected ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
            }`}
            style={{
              left: money.x,
              top: money.y,
              transform: money.collected ? 'scale(1.5)' : 'scale(1)',
            }}
            onClick={() => handleMoneyTap(money.id, money.value)}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
              money.type === 'note' 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
            }`}>
              ₦{money.value}
            </div>
          </div>
        ))}

        {/* Start Game Button */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="bg-white shadow-xl max-w-sm mx-4">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Money Falling Game
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-gray-600">
                  <p className="mb-2">Tap falling money to earn rewards!</p>
                  <ul className="text-sm space-y-1">
                    <li>• Earn ₦10 - ₦500 per tap</li>
                    <li>• Daily cap: ₦{dailyCap.toLocaleString()}</li>
                    <li>• Max {maxTapsPerHour} taps per hour</li>
                    <li>• Daily plays: {dailyPlays}/{dailyLimit}</li>
                  </ul>
                </div>
                <Button
                  onClick={startGame}
                  className="w-full gradient-primary text-white text-lg py-3"
                  disabled={!user || !canPlay}
                >
                  {!user ? 'Login Required' : !canPlay ? 'Daily Limit Reached' : 'Start Game'}
                </Button>
                {!user && (
                  <p className="text-sm text-red-600 text-center">
                    Please log in to play games and earn rewards.
                  </p>
                )}
                {!canPlay && user && (
                  <p className="text-sm text-red-600 text-center">
                    You've reached your daily play limit for your current plan.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pause Overlay */}
        {gameStarted && gamePaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Card className="bg-white shadow-xl">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">Game Paused</h3>
                <Button
                  onClick={togglePause}
                  className="gradient-primary text-white"
                >
                  Resume Game
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4">
        <p className="text-center text-sm text-gray-600">
          💡 Tip: Tap the falling money quickly to maximize your earnings! 
          {sessionEarnings >= dailyCap && " Daily cap reached!"}
        </p>
      </div>
    </div>
  );
};

export default GameMoneyFalling;

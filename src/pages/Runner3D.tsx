import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RotateCcw, TrendingUp, Coins, Zap, ShoppingCart, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: string;
  icon: React.ReactNode;
  multiplier: number;
}

interface GameState {
  isPlaying: boolean;
  score: number;
  distance: number;
  coins: number;
  speed: number;
  multiplier: number;
  activeBoosts: string[];
}

interface Player {
  x: number;
  y: number;
  z: number;
  lane: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  z: number;
  type: 'coin' | 'barrier' | 'boost';
  collected: boolean;
}

const Runner3D = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const gameRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    distance: 0,
    coins: 0,
    speed: 1,
    multiplier: 1,
    activeBoosts: []
  });

  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    z: 0,
    lane: 1
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [userWallet, setUserWallet] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [dailyPlays, setDailyPlays] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [canPlay, setCanPlay] = useState(true);

  const storeItems: StoreItem[] = [
    {
      id: 'speed_boost',
      name: 'Speed Boost',
      description: 'Increases game speed by 50%',
      cost: 1000,
      type: 'boost',
      icon: <Zap className="h-5 w-5" />,
      multiplier: 1.5
    },
    {
      id: 'coin_magnet',
      name: 'Coin Magnet',
      description: 'Attracts coins automatically',
      cost: 1500,
      type: 'power',
      icon: <Coins className="h-5 w-5" />,
      multiplier: 2
    },
    {
      id: 'double_earnings',
      name: 'Double Earnings',
      description: 'Doubles coin value for this game',
      cost: 2000,
      type: 'multiplier',
      icon: <TrendingUp className="h-5 w-5" />,
      multiplier: 2
    }
  ];

  useEffect(() => {
    if (user) {
      fetchUserData();
      checkDailyPlays();
    }
  }, [user]);

  useEffect(() => {
    if (gameState.isPlaying) {
      startGameLoop();
    } else {
      stopGameLoop();
    }
    return () => stopGameLoop();
  }, [gameState.isPlaying]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_earnings')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserWallet(data?.wallet_earnings || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkDailyPlays = async () => {
    if (!user) return;

    try {
      // Check daily plays
      const { data: playsData } = await supabase
        .from('daily_game_plays')
        .select('plays_count')
        .eq('user_id', user.id)
        .eq('game_type', 'runner_3d')
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
    intervalRef.current = setInterval(() => {
      updateGame();
    }, 100);
  };

  const stopGameLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const updateGame = () => {
    setGameState(prev => ({
      ...prev,
      distance: prev.distance + prev.speed,
      score: prev.score + Math.floor(prev.speed * prev.multiplier)
    }));

    // Spawn obstacles
    if (Math.random() < 0.1) {
      spawnObstacle();
    }

    // Move and clean obstacles
    setObstacles(prev => 
      prev.map(obstacle => ({
        ...obstacle,
        z: obstacle.z - gameState.speed * 2
      })).filter(obstacle => obstacle.z > -10)
    );

    // Check collisions
    checkCollisions();
  };

  const spawnObstacle = () => {
    const types: ('coin' | 'barrier' | 'boost')[] = ['coin', 'coin', 'coin', 'barrier', 'boost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);

    const newObstacle: Obstacle = {
      id: Date.now().toString(),
      x: (lane - 1) * 2,
      y: 0,
      z: 20,
      type,
      collected: false
    };

    setObstacles(prev => [...prev, newObstacle]);
  };

  const checkCollisions = () => {
    setObstacles(prev => 
      prev.map(obstacle => {
        if (
          !obstacle.collected &&
          Math.abs(obstacle.x - player.x) < 1 &&
          Math.abs(obstacle.z) < 1
        ) {
          handleCollision(obstacle);
          return { ...obstacle, collected: true };
        }
        return obstacle;
      })
    );
  };

  const handleCollision = (obstacle: Obstacle) => {
    switch (obstacle.type) {
      case 'coin':
        setGameState(prev => ({
          ...prev,
          coins: prev.coins + (1 * prev.multiplier),
          score: prev.score + (10 * prev.multiplier)
        }));
        break;
      case 'barrier':
        endGame();
        break;
      case 'boost':
        setGameState(prev => ({
          ...prev,
          speed: Math.min(prev.speed + 0.5, 3),
          score: prev.score + (50 * prev.multiplier)
        }));
        break;
    }
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
      game_name: 'runner_3d'
    });

    setGameState({
      isPlaying: true,
      score: 0,
      distance: 0,
      coins: 0,
      speed: 1,
      multiplier: 1 + (purchasedItems.includes('double_earnings') ? 1 : 0),
      activeBoosts: [...purchasedItems]
    });
    setObstacles([]);
    setPlayer({ x: 0, y: 0, z: 0, lane: 1 });
    setEarnings(0);
    checkDailyPlays();
  };

  const endGame = async () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    await calculateEarnings();
  };

  const movePlayer = (direction: 'left' | 'right') => {
    setPlayer(prev => {
      const newLane = direction === 'left' 
        ? Math.max(0, prev.lane - 1)
        : Math.min(2, prev.lane + 1);
      
      return {
        ...prev,
        lane: newLane,
        x: (newLane - 1) * 2
      };
    });
  };

  const calculateEarnings = async () => {
    if (!user) return;

    const baseEarnings = Math.floor(gameState.coins * 0.5);
    const distanceBonus = Math.floor(gameState.distance * 0.1);
    const totalEarnings = (baseEarnings + distanceBonus) * gameState.multiplier;

    setEarnings(totalEarnings);

    try {
      await supabase.rpc('update_wallet_balance', {
        user_uuid: user.id,
        wallet_type: 'earnings',
        amount: totalEarnings,
        transaction_description: `3D Runner game - ${gameState.score} points`
      });

      await supabase.from('game_earnings').insert({
        user_id: user.id,
        game_type: 'runner_3d',
        amount: totalEarnings,
        session_duration: Math.floor(gameState.distance / 10)
      });

      fetchUserData();
    } catch (error) {
      console.error('Error saving earnings:', error);
    }
  };

  const purchaseItem = async (item: StoreItem) => {
    if (userWallet < item.cost) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "You don't have enough earnings to purchase this item.",
      });
      return;
    }

    try {
      await supabase.rpc('update_wallet_balance', {
        user_uuid: user?.id,
        wallet_type: 'earnings',
        amount: -item.cost,
        transaction_description: `Store purchase: ${item.name}`
      });

      setPurchasedItems(prev => [...prev, item.id]);
      fetchUserData();

      toast({
        title: "Purchase Successful!",
        description: `${item.name} has been added to your inventory.`,
      });
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to complete purchase. Please try again.",
      });
    }
  };

  const resetGame = () => {
    setGameState({
      isPlaying: false,
      score: 0,
      distance: 0,
      coins: 0,
      speed: 1,
      multiplier: 1,
      activeBoosts: []
    });
    setObstacles([]);
    setPlayer({ x: 0, y: 0, z: 0, lane: 1 });
    setEarnings(0);
    setPurchasedItems([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">3D Runner</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Game Store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Wallet Balance: ₦{userWallet.toLocaleString()}
              </div>
              {storeItems.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₦{item.cost.toLocaleString()}</div>
                      {purchasedItems.includes(item.id) ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Owned
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => purchaseItem(item)}
                          disabled={userWallet < item.cost}
                        >
                          Buy
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{gameState.score.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{gameState.coins}</div>
            <div className="text-sm text-gray-600">Coins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.floor(gameState.distance)}m</div>
            <div className="text-sm text-gray-600">Distance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">₦{earnings.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Earnings</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-600">
        Daily Plays: {dailyPlays}/{dailyLimit} • 
        <span className={canPlay ? "text-green-600" : "text-red-600"}>
          {canPlay ? " Can Play" : " Limit Reached"}
        </span>
      </div>

      {/* 3D Game Area */}
      <Card className="relative overflow-hidden bg-gradient-to-b from-sky-400 to-blue-600">
        <div 
          ref={gameRef}
          className="h-96 relative perspective-1000"
          style={{ perspective: '1000px' }}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-gray-600">
            {/* Lane lines */}
            <div className="absolute top-0 left-1/3 w-1 h-full bg-white opacity-50"></div>
            <div className="absolute top-0 left-2/3 w-1 h-full bg-white opacity-50"></div>
          </div>

          {/* Player */}
          <div 
            className="absolute bottom-8 transition-all duration-200 z-10"
            style={{
              left: `${33.33 + (player.lane * 33.33)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>

          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className={`absolute transition-all duration-100 ${
                obstacle.collected ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                left: `${33.33 + ((obstacle.x / 2 + 1) * 33.33)}%`,
                bottom: `${(obstacle.z + 10) * 2}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {obstacle.type === 'coin' && (
                <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-spin"></div>
              )}
              {obstacle.type === 'barrier' && (
                <div className="w-8 h-8 bg-red-500 border-2 border-red-700"></div>
              )}
              {obstacle.type === 'boost' && (
                <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-green-600 animate-pulse"></div>
              )}
            </div>
          ))}

          {/* Game Over Overlay */}
          {!gameState.isPlaying && gameState.score > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <Card className="bg-white p-6 text-center max-w-sm">
                <CardHeader>
                  <CardTitle>Game Over!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Score: {gameState.score.toLocaleString()}</div>
                    <div>Coins: {gameState.coins}</div>
                    <div>Distance: {Math.floor(gameState.distance)}m</div>
                    <div>Earned: ₦{earnings.toLocaleString()}</div>
                  </div>
                  <Button onClick={startGame} className="w-full" disabled={!canPlay}>
                    {canPlay ? "Play Again" : "Daily Limit Reached"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!gameState.isPlaying && gameState.score === 0 ? (
          <Button 
            onClick={startGame} 
            className="gradient-primary text-white gap-2"
            disabled={!canPlay}
          >
            <Play className="h-4 w-4" />
            {canPlay ? "Start Game" : "Daily Limit Reached"}
          </Button>
        ) : (
          <>
            <Button onClick={() => movePlayer('left')} variant="outline">
              ← Left
            </Button>
            <Button onClick={() => movePlayer('right')} variant="outline">
              Right →
            </Button>
            <Button onClick={resetGame} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>🏃‍♂️ Control your runner by moving left and right between lanes</p>
          <p>🪙 Collect coins to earn money and increase your score</p>
          <p>🚧 Avoid red barriers - they will end your game</p>
          <p>⚡ Green boosts increase your speed and score multiplier</p>
          <p>🛒 Purchase items from the store to enhance your gameplay</p>
          <p>💰 Earnings = (Coins × 0.5 + Distance × 0.1) × Multiplier</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Runner3D;

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CoinRunner = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(50);
  const [obstacles, setObstacles] = useState<Array<{id: number, x: number, y: number, type: 'coin' | 'obstacle'}>>([]);
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 50);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, obstacles, playerPosition]);

  const updateGame = () => {
    setDistance(prev => prev + 1);
    
    // Move obstacles
    setObstacles(prev => {
      const updated = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - 5
      })).filter(obstacle => obstacle.x > -50);

      // Add new obstacles randomly
      if (Math.random() < 0.3) {
        const newObstacle = {
          id: Date.now(),
          x: 800,
          y: Math.random() * 60 + 20,
          type: Math.random() < 0.7 ? 'coin' : 'obstacle' as 'coin' | 'obstacle'
        };
        updated.push(newObstacle);
      }

      return updated;
    });

    // Check collisions
    obstacles.forEach(obstacle => {
      if (
        obstacle.x > 40 && obstacle.x < 90 &&
        obstacle.y > playerPosition - 10 && obstacle.y < playerPosition + 10
      ) {
        if (obstacle.type === 'coin') {
          setCoins(prev => prev + 1);
          setScore(prev => prev + 10);
          // Remove collected coin
          setObstacles(prev => prev.filter(o => o.id !== obstacle.id));
        } else {
          // Hit obstacle - game over
          setGameState('gameOver');
          calculateEarnings();
        }
      }
    });
  };

  const calculateEarnings = async () => {
    if (!user || coins === 0) return;

    const baseEarning = coins * 5; // ₦5 per coin
    const distanceBonus = Math.floor(distance / 100) * 10; // ₦10 per 100 distance
    const totalEarnings = baseEarning + distanceBonus;

    setSessionEarnings(totalEarnings);

    try {
      // Update wallet balance
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        user_uuid: user.id,
        wallet_type: 'earnings',
        amount: totalEarnings,
        transaction_description: `Coin Runner game - Coins: ${coins}, Distance: ${distance}`
      });

      if (walletError) throw walletError;

      // Record game earnings
      const { error: gameError } = await supabase
        .from('game_earnings')
        .insert({
          user_id: user.id,
          game_type: 'coin_runner',
          amount: totalEarnings,
          taps_count: coins,
          session_duration: Math.floor(distance / 10)
        });

      if (gameError) throw gameError;

      toast({
        title: "Game Complete!",
        description: `You earned ₦${totalEarnings.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Error recording earnings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record earnings",
      });
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCoins(0);
    setDistance(0);
    setPlayerPosition(50);
    setObstacles([]);
    setSessionEarnings(0);
  };

  const resetGame = () => {
    setGameState('idle');
    setScore(0);
    setCoins(0);
    setDistance(0);
    setPlayerPosition(50);
    setObstacles([]);
    setSessionEarnings(0);
  };

  const movePlayer = (direction: 'up' | 'down') => {
    if (gameState !== 'playing') return;
    
    setPlayerPosition(prev => {
      if (direction === 'up') {
        return Math.max(10, prev - 15);
      } else {
        return Math.min(90, prev + 15);
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Coin Runner</h1>
        <p className="text-gray-600 mt-2">Collect coins while avoiding obstacles!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{coins}</p>
              <p className="text-sm text-gray-600">Coins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{distance}m</p>
              <p className="text-sm text-gray-600">Distance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₦{sessionEarnings}</p>
              <p className="text-sm text-gray-600">Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Area */}
      <Card>
        <CardContent className="p-6">
          <div 
            className="relative bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg overflow-hidden"
            style={{ height: '400px', width: '100%' }}
          >
            {/* Player */}
            <div
              className="absolute w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ left: '50px', top: `${playerPosition}%`, transform: 'translateY(-50%)' }}
            >
              🏃‍♂️
            </div>

            {/* Obstacles and Coins */}
            {obstacles.map(obstacle => (
              <div
                key={obstacle.id}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center ${
                  obstacle.type === 'coin' ? 'bg-yellow-400' : 'bg-red-500'
                }`}
                style={{ 
                  left: `${obstacle.x}px`, 
                  top: `${obstacle.y}%`, 
                  transform: 'translateY(-50%)' 
                }}
              >
                {obstacle.type === 'coin' ? '🪙' : '🚧'}
              </div>
            ))}

            {/* Game Over Overlay */}
            {gameState === 'gameOver' && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                  <p className="text-xl mb-2">Final Score: {score}</p>
                  <p className="text-lg mb-4">Coins Collected: {coins}</p>
                  {sessionEarnings > 0 && (
                    <Badge className="mb-4 text-lg px-4 py-2">
                      Earned: ₦{sessionEarnings.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-2">
          {gameState === 'idle' && (
            <Button onClick={startGame} className="gradient-primary text-white">
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          )}
          
          {gameState === 'playing' && (
            <Button onClick={() => setGameState('paused')} variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          {gameState === 'paused' && (
            <Button onClick={() => setGameState('playing')} className="gradient-primary text-white">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {(gameState === 'gameOver' || gameState === 'paused') && (
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Movement Controls */}
        {gameState === 'playing' && (
          <div className="flex justify-center gap-4">
            <Button onClick={() => movePlayer('up')} variant="outline" size="lg">
              ↑ Up
            </Button>
            <Button onClick={() => movePlayer('down')} variant="outline" size="lg">
              ↓ Down
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• Use the Up/Down buttons to move your player</p>
          <p>• Collect coins (🪙) to earn points and money</p>
          <p>• Avoid obstacles (🚧) or the game ends</p>
          <p>• Earn ₦5 per coin + distance bonus</p>
          <p>• The longer you survive, the more you earn!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoinRunner;

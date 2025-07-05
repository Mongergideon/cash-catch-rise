
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Brain, Timer, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryFlip = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [sessionEarnings, setSessionEarnings] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const nairaSymbols = ['₦100', '₦200', '₦500', '₦1000', '₦2000', '₦5000', '₦10000', '₦20000'];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(card => card.id === first);
      const secondCard = cards.find(card => card.id === second);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (matchedPairs === 8 && gameState === 'playing') {
      setGameState('won');
      calculateEarnings();
    }
  }, [matchedPairs, gameState]);

  const initializeGame = () => {
    const cardPairs = [...nairaSymbols, ...nairaSymbols];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(60);
    setSessionEarnings(0);
    setGameState('playing');
  };

  const calculateEarnings = async () => {
    if (!user) return;

    const baseEarning = matchedPairs * 200; // ₦200 per match
    const timeBonus = timeLeft * 5; // ₦5 per second remaining
    const movesPenalty = Math.max(0, (moves - 16) * 10); // Penalty for excessive moves
    const totalEarnings = Math.max(0, baseEarning + timeBonus - movesPenalty);

    setSessionEarnings(totalEarnings);

    if (totalEarnings > 0) {
      try {
        // FIXED: Update wallet balance immediately
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: user.id,
          wallet_type: 'earnings',
          amount: totalEarnings,
          transaction_description: `Memory Flip - Matches: ${matchedPairs}, Time: ${60-timeLeft}s, Moves: ${moves}`
        });

        if (walletError) throw walletError;

        // Record game earnings
        const { error: gameError } = await supabase
          .from('game_earnings')
          .insert({
            user_id: user.id,
            game_type: 'memory_flip',
            amount: totalEarnings,
            taps_count: moves,
            session_duration: 60 - timeLeft
          });

        if (gameError) throw gameError;

        toast({
          title: "Congratulations!",
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
    }
  };

  const flipCard = (cardId: number) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  const resetGame = () => {
    setGameState('idle');
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimeLeft(60);
    setSessionEarnings(0);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Memory Flip</h1>
        <p className="text-gray-600 mt-2">Match pairs of Naira notes to earn money!</p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <Timer className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{timeLeft}s</p>
              <p className="text-sm text-gray-600">Time Left</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <Brain className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{moves}</p>
              <p className="text-sm text-gray-600">Moves</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{matchedPairs}/8</p>
              <p className="text-sm text-gray-600">Matches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">₦{sessionEarnings}</p>
              <p className="text-sm text-gray-600">Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Board */}
      <Card>
        <CardContent className="p-6">
          {gameState === 'idle' ? (
            <div className="text-center py-20">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to play?</h3>
              <p className="text-gray-600 mb-6">Match pairs of Naira notes within 60 seconds</p>
              <Button onClick={initializeGame} className="gradient-primary text-white" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Game
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => flipCard(card.id)}
                  className={`
                    aspect-square rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${card.isMatched ? 'bg-green-200 border-2 border-green-400' : 
                      card.isFlipped ? 'bg-blue-100 border-2 border-blue-400' : 
                      'bg-gray-200 border-2 border-gray-300 hover:bg-gray-300'}
                  `}
                >
                  <div className="h-full flex items-center justify-center">
                    {card.isFlipped || card.isMatched ? (
                      <span className="text-lg font-bold text-green-700">
                        {card.value}
                      </span>
                    ) : (
                      <div className="w-8 h-8 bg-gray-400 rounded"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Game Over Overlay */}
          {(gameState === 'won' || gameState === 'lost') && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center text-white p-6">
                <h2 className="text-3xl font-bold mb-4">
                  {gameState === 'won' ? '🎉 You Won!' : '⏰ Time\'s Up!'}
                </h2>
                <p className="text-xl mb-2">Matches: {matchedPairs}/8</p>
                <p className="text-lg mb-2">Moves: {moves}</p>
                <p className="text-lg mb-4">Time: {60 - timeLeft} seconds</p>
                {sessionEarnings > 0 && (
                  <Badge className="mb-4 text-lg px-4 py-2">
                    Earned: ₦{sessionEarnings.toLocaleString()}
                  </Badge>
                )}
                <div className="flex gap-4 justify-center">
                  <Button onClick={initializeGame} className="gradient-primary text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button onClick={resetGame} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Main Menu
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• Click cards to flip them and reveal Naira notes</p>
          <p>• Match pairs of identical notes to score</p>
          <p>• Complete all 8 pairs within 60 seconds to win</p>
          <p>• Earn ₦200 per match + time bonus</p>
          <p>• Fewer moves = higher score!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoryFlip;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Dice1 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Ludo = () => {
  const navigate = useNavigate();
  const [diceValue, setDiceValue] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [players] = useState([
    { id: 1, name: 'You', color: 'gold', pieces: [0, 0, 0, 0] },
    { id: 2, name: 'AI Player 1', color: 'pink', pieces: [0, 0, 0, 0] },
    { id: 3, name: 'AI Player 2', color: 'blue', pieces: [0, 0, 0, 0] },
    { id: 4, name: 'AI Player 3', color: 'green', pieces: [0, 0, 0, 0] }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);

  const rollDice = () => {
    const newValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(newValue);
    toast.success(`Rolled ${newValue}!`);
    
    // Switch to next player
    setTimeout(() => {
      setCurrentPlayer((prev) => (prev + 1) % 4);
    }, 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    toast.success('Ludo game started! Roll the dice to begin.');
  };

  const renderBoard = () => {
    return (
      <div className="grid grid-cols-15 gap-1 p-4 bg-card rounded-lg border">
        {/* Simplified Ludo board representation */}
        {Array.from({ length: 225 }, (_, i) => (
          <div
            key={i}
            className="w-4 h-4 border border-border bg-muted rounded-sm"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-gold-glow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          <h1 className="text-2xl font-bold text-primary">Ludo Championship</h1>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {players.map((player, index) => (
            <Card 
              key={player.id} 
              className={`${currentPlayer === index ? 'ring-2 ring-primary pink-pulse' : ''} slide-fade-in`}
            >
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 mr-2 text-secondary" />
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className={`w-6 h-6 rounded-full mx-auto bg-${player.color} border-2`} />
                {currentPlayer === index && (
                  <div className="text-xs text-primary mt-2">Your Turn!</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Game Board */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Game Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameStarted ? (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Ludo board would be rendered here with full game logic
                </p>
                {renderBoard()}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">
                  Welcome to Ludo! A classic board game for 2-4 players.
                </p>
                <Button 
                  onClick={startGame}
                  className="hover-gold-glow gradient-primary"
                  size="lg"
                >
                  Start Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dice Section */}
        {gameStarted && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-card border-2 border-primary rounded-lg flex items-center justify-center mb-2">
                    <Dice1 className="w-8 h-8 text-primary" />
                    <span className="absolute text-xl font-bold">{diceValue}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Dice Value</p>
                </div>
                <Button 
                  onClick={rollDice}
                  disabled={currentPlayer !== 0}
                  className="hover-gold-glow gradient-primary"
                  size="lg"
                >
                  Roll Dice
                </Button>
              </div>
              {currentPlayer !== 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Waiting for other players...
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Ludo;
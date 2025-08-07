import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;

const SnakeLeader = () => {
  const navigate = useNavigate();
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<string>('RIGHT');
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameRunning(false);
    generateFood();
  };

  const startGame = () => {
    if (gameOver) resetGame();
    setGameRunning(true);
    toast.success('Snake game started!');
  };

  const pauseGame = () => {
    setGameRunning(false);
    toast.info('Game paused');
  };

  const moveSnake = useCallback(() => {
    if (!gameRunning || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      // Move head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setGameRunning(false);
        toast.error('Game Over! Hit the wall!');
        return currentSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setGameRunning(false);
        toast.error('Game Over! Hit yourself!');
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            toast.success('New High Score!');
          }
          return newScore;
        });
        generateFood();
        toast.success('+10 points!');
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameRunning, gameOver, generateFood, highScore]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(moveSnake, 150);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRunning) return;

      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameRunning]);

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let cellClass = 'w-5 h-5 border border-border';
        
        // Check if this cell contains snake
        if (snake.some(segment => segment.x === x && segment.y === y)) {
          cellClass += ' bg-primary';
        }
        // Check if this cell contains food
        else if (food.x === x && food.y === y) {
          cellClass += ' bg-secondary animate-pink-pulse';
        }
        // Empty cell
        else {
          cellClass += ' bg-muted';
        }

        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
          />
        );
      }
    }
    return grid;
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
          <h1 className="text-2xl font-bold text-primary">Snake Leader</h1>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{score}</div>
              <div className="text-sm text-muted-foreground">Current Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-secondary" />
              <div className="text-2xl font-bold text-secondary">{highScore}</div>
              <div className="text-sm text-muted-foreground">High Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Game Board */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Game Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div 
                className="grid gap-0 border-2 border-primary p-2 bg-card"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: `${GRID_SIZE * CELL_SIZE + 16}px`,
                  height: `${GRID_SIZE * CELL_SIZE + 16}px`
                }}
              >
                {renderGrid()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center space-x-4 mb-6">
              {!gameRunning ? (
                <Button 
                  onClick={startGame}
                  className="hover-gold-glow gradient-primary"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {gameOver ? 'Play Again' : 'Start Game'}
                </Button>
              ) : (
                <Button 
                  onClick={pauseGame}
                  className="hover-gold-glow"
                  size="lg"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button 
                onClick={resetGame}
                variant="outline"
                size="lg"
                className="hover-gold-glow"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto md:hidden">
              <div></div>
              <Button 
                onClick={() => setDirection('UP')}
                disabled={!gameRunning || direction === 'DOWN'}
                size="sm"
              >
                ↑
              </Button>
              <div></div>
              <Button 
                onClick={() => setDirection('LEFT')}
                disabled={!gameRunning || direction === 'RIGHT'}
                size="sm"
              >
                ←
              </Button>
              <div></div>
              <Button 
                onClick={() => setDirection('RIGHT')}
                disabled={!gameRunning || direction === 'LEFT'}
                size="sm"
              >
                →
              </Button>
              <div></div>
              <Button 
                onClick={() => setDirection('DOWN')}
                disabled={!gameRunning || direction === 'UP'}
                size="sm"
              >
                ↓
              </Button>
              <div></div>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-4 hidden md:block">
              Use arrow keys to control the snake
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SnakeLeader;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Spade, Heart, Diamond, Club, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface PlayingCard {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  rank: string;
  value: number;
}

const Blackjack = () => {
  const navigate = useNavigate();
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [bet, setBet] = useState(100);
  const [balance, setBalance] = useState(1000);
  const [message, setMessage] = useState('');

  const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = (): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        let value = parseInt(rank);
        if (rank === 'A') value = 11;
        else if (['J', 'Q', 'K'].includes(rank)) value = 10;
        
        deck.push({
          suit: suit as PlayingCard['suit'],
          rank,
          value
        });
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  };

  const [deck, setDeck] = useState<PlayingCard[]>(createDeck());

  const calculateHandValue = (hand: PlayingCard[]) => {
    let value = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const dealCard = () => {
    if (deck.length === 0) {
      setDeck(createDeck());
      return createDeck()[0];
    }
    const card = deck[0];
    setDeck(prev => prev.slice(1));
    return card;
  };

  const startGame = () => {
    if (balance < bet) {
      toast.error('Insufficient balance!');
      return;
    }

    setGameStarted(true);
    setGameEnded(false);
    setMessage('');
    
    // Deal initial cards
    const newPlayerHand = [dealCard(), dealCard()];
    const newDealerHand = [dealCard(), dealCard()];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    
    toast.success('Game started! Good luck!');
  };

  const hit = () => {
    const newCard = dealCard();
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    
    if (calculateHandValue(newHand) > 21) {
      endGame('bust');
    }
  };

  const stand = () => {
    // Dealer plays
    let newDealerHand = [...dealerHand];
    while (calculateHandValue(newDealerHand) < 17) {
      newDealerHand.push(dealCard());
    }
    setDealerHand(newDealerHand);
    
    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(newDealerHand);
    
    if (dealerValue > 21) {
      endGame('dealer_bust');
    } else if (playerValue > dealerValue) {
      endGame('win');
    } else if (playerValue < dealerValue) {
      endGame('lose');
    } else {
      endGame('push');
    }
  };

  const endGame = (result: string) => {
    setGameEnded(true);
    let newBalance = balance;
    
    switch (result) {
      case 'bust':
        setMessage('Bust! You lose.');
        newBalance -= bet;
        break;
      case 'dealer_bust':
        setMessage('Dealer busts! You win!');
        newBalance += bet;
        break;
      case 'win':
        setMessage('You win!');
        newBalance += bet;
        break;
      case 'lose':
        setMessage('You lose.');
        newBalance -= bet;
        break;
      case 'push':
        setMessage('Push! It\'s a tie.');
        break;
    }
    
    setBalance(newBalance);
    toast.success(message);
  };

  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'spades': return <Spade className="w-4 h-4" />;
      case 'hearts': return <Heart className="w-4 h-4 text-red-500" />;
      case 'diamonds': return <Diamond className="w-4 h-4 text-red-500" />;
      case 'clubs': return <Club className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderCard = (card: PlayingCard, hidden = false) => (
    <div className="w-16 h-24 bg-card border border-border rounded-lg flex flex-col items-center justify-center m-1">
      {hidden ? (
        <div className="w-full h-full bg-primary rounded-lg" />
      ) : (
        <>
          <div className="text-lg font-bold">{card.rank}</div>
          {getSuitIcon(card.suit)}
        </>
      )}
    </div>
  );

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
          <h1 className="text-2xl font-bold text-primary">Blackjack 21</h1>
        </div>

        {/* Balance & Bet */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">₦{balance}</div>
              <div className="text-sm text-muted-foreground">Balance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">₦{bet}</div>
              <div className="text-sm text-muted-foreground">Current Bet</div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setBet(Math.max(50, bet - 50))}>-50</Button>
                <Button size="sm" onClick={() => setBet(bet + 50)}>+50</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Area */}
        <div className="space-y-6">
          {/* Dealer's Hand */}
          <Card>
            <CardHeader>
              <CardTitle>Dealer's Hand {gameStarted && `(${gameEnded ? calculateHandValue(dealerHand) : '?'})`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center">
                {dealerHand.map((card, index) => 
                  renderCard(card, !gameEnded && index === 1)
                )}
              </div>
            </CardContent>
          </Card>

          {/* Player's Hand */}
          <Card>
            <CardHeader>
              <CardTitle>Your Hand {gameStarted && `(${calculateHandValue(playerHand)})`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center">
                {playerHand.map((card, index) => 
                  <div key={index}>{renderCard(card)}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardContent className="p-6 text-center">
              {!gameStarted ? (
                <Button 
                  onClick={startGame}
                  className="hover-gold-glow gradient-primary"
                  size="lg"
                >
                  Deal Cards
                </Button>
              ) : gameEnded ? (
                <div>
                  <p className="text-lg mb-4 text-primary">{message}</p>
                  <Button 
                    onClick={startGame}
                    className="hover-gold-glow gradient-primary"
                  >
                    Play Again
                  </Button>
                </div>
              ) : (
                <div className="space-x-4">
                  <Button 
                    onClick={hit}
                    className="hover-gold-glow gradient-primary"
                  >
                    Hit
                  </Button>
                  <Button 
                    onClick={stand}
                    className="hover-gold-glow gradient-secondary"
                  >
                    Stand
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Blackjack;
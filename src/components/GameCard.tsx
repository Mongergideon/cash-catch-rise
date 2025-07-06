
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  gameNumber: number;
  userPlanGames: number;
  requiredPlan: string;
}

const GameCard = ({ 
  title, 
  description, 
  icon, 
  route, 
  color, 
  gameNumber, 
  userPlanGames, 
  requiredPlan 
}: GameCardProps) => {
  const isLocked = gameNumber > userPlanGames;

  if (isLocked) {
    return (
      <Card className="hover:shadow-lg transition-shadow opacity-75">
        <CardHeader>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${color} flex items-center justify-center mb-3 relative`}>
            {icon}
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl flex items-center justify-between">
            {title}
            <Badge variant="secondary" className="ml-2">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-orange-800 text-sm">
              🔒 This game is unlocked with the <strong>{requiredPlan}</strong> Plan.
            </p>
          </div>
          <Link to="/plans">
            <Button className="w-full gradient-primary text-white">
              Upgrade now to play
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <Link to={route}>
        <CardHeader>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${color} flex items-center justify-center mb-3`}>
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{description}</p>
          <Button className="w-full gradient-primary text-white">
            Play Now
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
};

export default GameCard;

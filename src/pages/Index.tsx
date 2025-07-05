
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, Coins, RotateCcw, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [dailyCap, setDailyCap] = useState(3000);
  const [currentPlan, setCurrentPlan] = useState('Free Trial');

  const games = [
    {
      id: 1,
      name: 'Cashing Money Falling',
      description: 'Tap falling money to earn rewards',
      icon: Coins,
      earnings: '₦10 - ₦500 per tap',
      color: 'gradient-primary',
      route: '/game/money-falling'
    },
    {
      id: 2,
      name: 'Coin Catcher Runner',
      description: 'Endless runner collecting coins',
      icon: Play,
      earnings: 'Distance × Coins',
      color: 'gradient-secondary',
      route: '/game/coin-runner'
    },
    {
      id: 3,
      name: 'Spin to Win',
      description: 'Spin the wheel every 2 hours',
      icon: RotateCcw,
      earnings: '₦50 - ₦500 per spin',
      color: 'gradient-gold',
      route: '/game/spin-wheel'
    },
    {
      id: 4,
      name: 'Memory Flip',
      description: 'Match Naira pairs under timer',
      icon: Brain,
      earnings: '₦200 per match',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      route: '/game/memory-flip'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Daily Progress Card */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Progress</span>
            <Trophy className="text-yellow-500" size={24} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Earnings: ₦{todayEarnings.toLocaleString()}</span>
                <span>Cap: ₦{dailyCap.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="gradient-secondary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayEarnings / dailyCap) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                <p className="font-semibold text-primary">{currentPlan}</p>
              </div>
              <Link to="/plans">
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Game Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => {
            const IconComponent = game.icon;
            return (
              <Card key={game.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 ${game.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <IconComponent className="text-white" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{game.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{game.description}</p>
                      <p className="text-green-600 font-semibold text-sm">{game.earnings}</p>
                    </div>
                  </div>
                  <Link to={game.route}>
                    <Button className="w-full mt-4 gradient-primary text-white">
                      Play Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">₦0</p>
            <p className="text-sm text-gray-600">Total Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">0</p>
            <p className="text-sm text-gray-600">Games Played</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">1</p>
            <p className="text-sm text-gray-600">Current Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">0</p>
            <p className="text-sm text-gray-600">Referrals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

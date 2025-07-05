
import React, { useState } from 'react';
import { Crown, Star, Award, Gem, Zap, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Plans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      cost: 0,
      maxDaily: 3000,
      duration: 'Unlimited',
      canWithdraw: false,
      icon: Star,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      features: ['Basic games access', 'Daily earning cap: ₦3,000', 'No withdrawal rights', 'Unlimited duration'],
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      cost: 5000,
      maxDaily: 8000,
      duration: '30 days',
      canWithdraw: true,
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      features: ['All games access', 'Daily earning cap: ₦8,000', 'Weekly withdrawals', '30 days duration'],
      popular: false
    },
    {
      id: 'bronze',
      name: 'Bronze',
      cost: 10000,
      maxDaily: 20000,
      duration: '30 days',
      canWithdraw: true,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      features: ['All games access', 'Daily earning cap: ₦20,000', 'Weekly withdrawals', '30 days duration'],
      popular: true
    },
    {
      id: 'silver',
      name: 'Silver',
      cost: 20000,
      maxDaily: 40000,
      duration: '30 days',
      canWithdraw: true,
      icon: Star,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      features: ['All games access', 'Daily earning cap: ₦40,000', 'Weekly withdrawals', '30 days duration'],
      popular: false
    },
    {
      id: 'gold',
      name: 'Gold',
      cost: 50000,
      maxDaily: 100000,
      duration: '30 days',
      canWithdraw: true,
      icon: Crown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      features: ['All games access', 'Daily earning cap: ₦100,000', 'Weekly withdrawals', '30 days duration'],
      popular: false
    },
    {
      id: 'platinum',
      name: 'Platinum',
      cost: 100000,
      maxDaily: 200000,
      duration: '30 days',
      canWithdraw: true,
      icon: Gem,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      features: ['All games access', 'Daily earning cap: ₦200,000', 'Weekly withdrawals', '30 days duration', 'Premium support'],
      popular: false
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    // TODO: Implement plan purchase logic
    console.log('Selected plan:', planId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Investment Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a plan that fits your earning goals. Upgrade anytime to increase your daily earning potential.
        </p>
      </div>

      {/* Current Plan Alert */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-blue-500" size={20} />
            <div>
              <p className="font-semibold text-blue-900">Current Plan: Free Trial</p>
              <p className="text-sm text-blue-700">Daily earning cap: ₦3,000 • No withdrawal rights</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <Card 
              key={plan.id} 
              className={`relative bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              } ${plan.popular ? 'border-2 border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className={`text-center ${plan.bgColor} rounded-t-lg`}>
                <div className="flex justify-center mb-2">
                  <IconComponent className={plan.color} size={32} />
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {plan.cost === 0 ? 'Free' : `₦${plan.cost.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-gray-600">{plan.duration}</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    Daily Cap: ₦{plan.maxDaily.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {plan.canWithdraw ? 'Weekly withdrawals allowed' : 'No withdrawal rights'}
                  </p>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full ${
                    plan.id === 'free' 
                      ? 'bg-gray-500 hover:bg-gray-600' 
                      : 'gradient-primary hover:opacity-90'
                  } text-white`}
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Comparison */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Plan Benefits Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Feature</th>
                  <th className="text-center py-2">Free</th>
                  <th className="text-center py-2">Starter</th>
                  <th className="text-center py-2">Bronze</th>
                  <th className="text-center py-2">Silver</th>
                  <th className="text-center py-2">Gold</th>
                  <th className="text-center py-2">Platinum</th>
                </tr>
              </thead>
              <tbody className="text-center">
                <tr className="border-b">
                  <td className="text-left py-2 font-medium">Daily Earning Cap</td>
                  <td className="py-2">₦3,000</td>
                  <td className="py-2">₦8,000</td>
                  <td className="py-2">₦20,000</td>
                  <td className="py-2">₦40,000</td>
                  <td className="py-2">₦100,000</td>
                  <td className="py-2">₦200,000</td>
                </tr>
                <tr className="border-b">
                  <td className="text-left py-2 font-medium">Withdrawal Rights</td>
                  <td className="py-2 text-red-500">❌</td>
                  <td className="py-2 text-green-500">✅</td>
                  <td className="py-2 text-green-500">✅</td>
                  <td className="py-2 text-green-500">✅</td>
                  <td className="py-2 text-green-500">✅</td>
                  <td className="py-2 text-green-500">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="text-left py-2 font-medium">Plan Duration</td>
                  <td className="py-2">Unlimited</td>
                  <td className="py-2">30 days</td>
                  <td className="py-2">30 days</td>
                  <td className="py-2">30 days</td>
                  <td className="py-2">30 days</td>
                  <td className="py-2">30 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Plans;

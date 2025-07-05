
import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownToLine, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  
  // Mock data - will be replaced with real data from Supabase
  const walletData = {
    funding: 0,
    earnings: 0,
    todayEarnings: 0,
    totalEarnings: 0
  };

  const recentTransactions = [
    {
      id: 1,
      type: 'game_earning',
      amount: 450,
      description: 'Money Falling Game',
      date: new Date(),
      status: 'completed'
    },
    {
      id: 2,
      type: 'plan_purchase',
      amount: -5000,
      description: 'Starter Plan Purchase',
      date: new Date(Date.now() - 86400000),
      status: 'completed'
    }
  ];

  const handleFundWallet = () => {
    // TODO: Implement Flutterwave integration
    console.log('Fund wallet clicked');
  };

  const handleWithdraw = () => {
    // TODO: Implement withdrawal logic
    console.log('Withdraw clicked');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
          className="text-gray-600"
        >
          {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funding Wallet */}
        <Card className="gradient-primary text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Funding Wallet</span>
              <WalletIcon size={24} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-white/80 text-sm">Available Balance</p>
                <p className="text-3xl font-bold">
                  {showBalance ? `₦${walletData.funding.toLocaleString()}` : '₦****'}
                </p>
              </div>
              <Button 
                onClick={handleFundWallet}
                className="w-full bg-white text-primary hover:bg-gray-100"
              >
                <Plus size={16} className="mr-2" />
                Fund Wallet
              </Button>
              <p className="text-xs text-white/70">
                Use for plan purchases, store items, and withdrawal fees
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Wallet */}
        <Card className="gradient-secondary text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Earnings Wallet</span>
              <TrendingUp size={24} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-white/80 text-sm">Withdrawable Balance</p>
                <p className="text-3xl font-bold">
                  {showBalance ? `₦${walletData.earnings.toLocaleString()}` : '₦****'}
                </p>
              </div>
              <Button 
                onClick={handleWithdraw}
                className="w-full bg-white text-green-600 hover:bg-gray-100"
                disabled={walletData.earnings < 30000}
              >
                <ArrowDownToLine size={16} className="mr-2" />
                Withdraw
              </Button>
              <p className="text-xs text-white/70">
                Minimum withdrawal: ₦30,000 • Fee: ₦500
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              ₦{showBalance ? walletData.todayEarnings.toLocaleString() : '****'}
            </p>
            <p className="text-sm text-gray-600">Today's Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">
              ₦{showBalance ? walletData.totalEarnings.toLocaleString() : '****'}
            </p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">₦3,000</p>
            <p className="text-sm text-gray-600">Daily Cap</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <WalletIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Start playing games to see your earnings here!</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 ? (
                          <TrendingUp className="text-green-600" size={20} />
                        ) : (
                          <ArrowDownToLine className="text-red-600" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Rules */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Withdrawal Information</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="space-y-2 text-sm">
            <li>• Minimum withdrawal amount: ₦30,000</li>
            <li>• Withdrawal fee: ₦500 (deducted from funding wallet)</li>
            <li>• Frequency: Maximum 1 withdrawal per 7 days</li>
            <li>• Processing time: 1-3 business days after approval</li>
            <li>• Free Trial users cannot withdraw earnings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;

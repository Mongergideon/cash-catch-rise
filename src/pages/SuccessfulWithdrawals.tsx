import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, Trophy, Users, TrendingUp } from 'lucide-react';

// Nigerian names data
const NIGERIAN_NAMES = {
  first: [
    'Adebayo', 'Adeola', 'Adunni', 'Aisha', 'Akeem', 'Akintunde', 'Alabi', 'Amara',
    'Amina', 'Ayo', 'Bayo', 'Bolaji', 'Chidi', 'Chiamaka', 'Chioma', 'Damilola',
    'David', 'Ebuka', 'Emeka', 'Emmanuel', 'Esther', 'Fadilah', 'Fatima', 'Felix',
    'Folake', 'Funmi', 'Grace', 'Ibrahim', 'Ikechukwu', 'Ifeoma', 'James', 'Joseph',
    'Kehinde', 'Kemi', 'Khadijah', 'Kunle', 'Lawal', 'Mercy', 'Mohammed', 'Ngozi',
    'Nneka', 'Olabisi', 'Olumide', 'Omolola', 'Patience', 'Peter', 'Rasheed', 'Segun',
    'Sola', 'Temitope', 'Tunde', 'Uche', 'Victor', 'Yemi', 'Zainab'
  ],
  last: [
    'Adebayo', 'Adeyemi', 'Afolabi', 'Agbaje', 'Ahmed', 'Ajayi', 'Akande', 'Alabi',
    'Balogun', 'Coker', 'Dada', 'Ekundayo', 'Falana', 'Garba', 'Hassan', 'Ibrahim',
    'Jegede', 'Kazeem', 'Lawal', 'Musa', 'Nwosu', 'Ogbonna', 'Okafor', 'Okoro',
    'Olayemi', 'Olusegun', 'Onwuegbuzie', 'Oparah', 'Oyewale', 'Salami', 'Tijani',
    'Udofia', 'Yusuf', 'Zubair'
  ]
};

interface FakeWithdrawal {
  id: string;
  name: string;
  amount: number;
  date: string;
  accountNumber: string;
  bank: string;
}

const SuccessfulWithdrawals = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const withdrawalsPerPage = 20;

  // Generate fake withdrawals with memoization for performance
  const fakeWithdrawals = useMemo<FakeWithdrawal[]>(() => {
    const withdrawals: FakeWithdrawal[] = [];
    const banks = ['GTBank', 'Access Bank', 'First Bank', 'UBA', 'Zenith Bank', 'Stanbic IBTC', 'Kuda Bank', 'Opay'];
    
    for (let i = 0; i < 320; i++) {
      const firstName = NIGERIAN_NAMES.first[Math.floor(Math.random() * NIGERIAN_NAMES.first.length)];
      const lastName = NIGERIAN_NAMES.last[Math.floor(Math.random() * NIGERIAN_NAMES.last.length)];
      
      // Generate amount between ₦30,000 and ₦500,000
      const amount = Math.floor(Math.random() * (500000 - 30000) + 30000);
      
      // Generate random date within last 60 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));
      
      // Generate fake account number (10 digits)
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const bank = banks[Math.floor(Math.random() * banks.length)];
      
      withdrawals.push({
        id: `fake_${i}`,
        name: `${firstName} ${lastName}`,
        amount,
        date: date.toISOString(),
        accountNumber,
        bank
      });
    }
    
    // Sort by date (most recent first)
    return withdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setCurrentPage(1);
  };

  // Calculate statistics
  const totalAmount = fakeWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const todayWithdrawals = fakeWithdrawals.filter(w => {
    const today = new Date();
    const withdrawalDate = new Date(w.date);
    return withdrawalDate.toDateString() === today.toDateString();
  }).length;

  const thisWeekWithdrawals = fakeWithdrawals.filter(w => {
    const today = new Date();
    const withdrawalDate = new Date(w.date);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return withdrawalDate >= weekAgo;
  }).length;

  // Pagination
  const totalPages = Math.ceil(fakeWithdrawals.length / withdrawalsPerPage);
  const startIndex = (currentPage - 1) * withdrawalsPerPage;
  const currentWithdrawals = fakeWithdrawals.slice(startIndex, startIndex + withdrawalsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Successful Withdrawals</h1>
          <p className="text-gray-600 mt-1">See recent successful payments from our platform</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800">{fakeWithdrawals.length}</p>
                <p className="text-green-600 text-sm">Total Withdrawals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-800">₦{totalAmount.toLocaleString()}</p>
                <p className="text-blue-600 text-sm">Total Paid Out</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-800">{todayWithdrawals}</p>
                <p className="text-purple-600 text-sm">Today's Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-800">{thisWeekWithdrawals}</p>
                <p className="text-orange-600 text-sm">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Withdrawals List */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Recent Successful Payments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {currentWithdrawals.map((withdrawal, index) => (
              <div 
                key={withdrawal.id} 
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">
                      {startIndex + index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{withdrawal.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{withdrawal.bank}</span>
                        <span>***{withdrawal.accountNumber.slice(-3)}</span>
                        <span>{new Date(withdrawal.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">₦{withdrawal.amount.toLocaleString()}</p>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Paid ✓
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-green-100">
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + withdrawalsPerPage, fakeWithdrawals.length)} of {fakeWithdrawals.length} withdrawals
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Building Message */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">We Pay Our Users Consistently</h3>
            <p className="text-gray-700 mb-4">
              Over ₦{totalAmount.toLocaleString()} paid out to {fakeWithdrawals.length}+ satisfied users. 
              Join thousands of users who earn and withdraw successfully on our platform.
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Instant Processing</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessfulWithdrawals;
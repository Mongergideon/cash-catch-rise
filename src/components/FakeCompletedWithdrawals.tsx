import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

const FakeCompletedWithdrawals = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Generate fake withdrawals with memoization for performance
  const fakeWithdrawals = useMemo<FakeWithdrawal[]>(() => {
    const withdrawals: FakeWithdrawal[] = [];
    
    for (let i = 0; i < 300; i++) {
      const firstName = NIGERIAN_NAMES.first[Math.floor(Math.random() * NIGERIAN_NAMES.first.length)];
      const lastName = NIGERIAN_NAMES.last[Math.floor(Math.random() * NIGERIAN_NAMES.last.length)];
      
      // Generate amount between ₦30,000 and ₦500,000
      const amount = Math.floor(Math.random() * (500000 - 30000) + 30000);
      
      // Generate random date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Generate fake account number (10 digits)
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      withdrawals.push({
        id: `fake_${i}`,
        name: `${firstName} ${lastName}`,
        amount,
        date: date.toISOString(),
        accountNumber
      });
    }
    
    // Sort by date (most recent first)
    return withdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Recent Successful Withdrawals ({fakeWithdrawals.length})</span>
          </CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {fakeWithdrawals.slice(0, 50).map((withdrawal) => (
            <div 
              key={withdrawal.id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100 hover:border-green-200 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{withdrawal.name}</p>
                    <p className="text-xs text-gray-500">***{withdrawal.accountNumber.slice(-3)}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₦{withdrawal.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {new Date(withdrawal.date).toLocaleDateString()}
                </p>
              </div>
              <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-100">
                Paid
              </Badge>
            </div>
          ))}
          
          {fakeWithdrawals.length > 50 && (
            <div className="text-center text-gray-500 text-sm pt-2">
              And {fakeWithdrawals.length - 50} more successful withdrawals...
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-1">
            ✅ Great news! Withdrawals are being processed regularly
          </p>
          <p className="text-green-700 text-xs">
            Your withdrawal will be processed within 1-7 business days after approval
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FakeCompletedWithdrawals;
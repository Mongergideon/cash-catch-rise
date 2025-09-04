import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TransactionResult {
  id: string;
  status: 'successful' | 'failed' | 'pending';
  amount: number;
  currency: string;
  reference: string;
  date: string;
  description: string;
  paymentMethod: string;
}

const PaymentVerification = () => {
  const [transactionRef, setTransactionRef] = useState('');
  const [verificationResult, setVerificationResult] = useState<TransactionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyTransaction = async () => {
    if (!transactionRef.trim()) {
      toast.error('Please enter a transaction reference');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { transactionReference: transactionRef }
      });

      if (error) throw error;

      if (data.success) {
        const transaction = data.transaction;
        setVerificationResult({
          id: `tx_${Date.now()}`,
          status: 'successful',
          amount: transaction.amount,
          currency: transaction.currency,
          reference: transaction.reference,
          date: new Date().toISOString(),
          description: 'Wallet Funding',
          paymentMethod: transaction.payment_method || 'Payment Gateway'
        });
        toast.success(`Payment verified! ₦${transaction.amount.toLocaleString()} added to your wallet.`);
      } else {
        setVerificationResult(null);
        toast.error(data.error || 'Transaction verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationResult(null);
      toast.error(error.message || 'Transaction verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
          <p className="text-gray-600">
            Verify your payment status using your transaction reference
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Verify Transaction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter your transaction reference (e.g., FLW_REF_123456789)"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleVerifyTransaction}
                  disabled={isLoading}
                  className="px-6"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p className="mb-2"><strong>Where to find your reference:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your email confirmation</li>
                <li>Look in your bank SMS notification</li>
                <li>Check your payment app transaction history</li>
                <li>Look for references starting with "FLW_REF_"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {verificationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transaction Details</span>
                <Badge className={getStatusColor(verificationResult.status)}>
                  {getStatusIcon(verificationResult.status)}
                  <span className="ml-1 capitalize">{verificationResult.status}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-medium">{verificationResult.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-lg">
                        ₦{verificationResult.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {new Date(verificationResult.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{verificationResult.paymentMethod}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{verificationResult.description}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {verificationResult.reference}
                </p>
              </div>

              {verificationResult.status === 'successful' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Payment Successful!</p>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your payment has been processed successfully. If you were upgrading your plan or editing a withdrawal, the changes should be reflected in your account.
                  </p>
                </div>
              )}

              {verificationResult.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">Payment Failed</p>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    This payment was not successful. Please try again or contact support if you believe this is an error.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>• If you can't find your transaction reference, check your email or SMS</p>
              <p>• For successful payments not reflecting, wait up to 10 minutes</p>
              <p>• Contact support if you continue to experience issues</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentVerification;
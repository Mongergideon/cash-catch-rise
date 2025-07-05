
import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownToLine, Eye, EyeOff, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Declare FlutterwaveCheckout for TypeScript
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

interface WalletData {
  wallet_funding: number;
  wallet_earnings: number;
  next_withdraw_at: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [walletData, setWalletData] = useState<WalletData>({
    wallet_funding: 0,
    wallet_earnings: 0,
    next_withdraw_at: null
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundingAmount, setFundingAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [fundingDialog, setFundingDialog] = useState(false);
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_funding, wallet_earnings, next_withdraw_at')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setWalletData(data || { wallet_funding: 0, wallet_earnings: 0, next_withdraw_at: null });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleFlutterwaveFunding = async () => {
    const amount = parseFloat(fundingAmount);
    if (!amount || amount < 100) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum funding amount is ₦100",
      });
      return;
    }

    try {
      // Initialize Flutterwave payment
      const flutterwaveConfig = {
        public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X", // Replace with your public key
        tx_ref: `fund_${Date.now()}`,
        amount: amount,
        currency: "NGN",
        country: "NG",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: user?.email || "",
          phone_number: "",
          name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
        },
        customizations: {
          title: "Fund Wallet",
          description: "Add money to your wallet",
          logo: "",
        },
        callback: async (response: any) => {
          if (response.status === "successful") {
            // Update wallet balance
            const { error } = await supabase.rpc('update_wallet_balance', {
              user_uuid: user?.id,
              wallet_type: 'funding',
              amount: amount,
              transaction_description: `Wallet funding via Flutterwave - ${response.tx_ref}`
            });

            if (!error) {
              toast({
                title: "Funding Successful!",
                description: `₦${amount.toLocaleString()} has been added to your wallet`,
              });
              fetchWalletData();
              fetchTransactions();
              setFundingDialog(false);
              setFundingAmount('');
            }
          }
        },
        onclose: () => {
          console.log("Payment modal closed");
        },
      };

      // Check if FlutterwaveCheckout is available
      if (typeof window.FlutterwaveCheckout !== 'undefined') {
        window.FlutterwaveCheckout(flutterwaveConfig);
      } else {
        // Fallback: Load Flutterwave script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.onload = () => {
          if (window.FlutterwaveCheckout) {
            window.FlutterwaveCheckout(flutterwaveConfig);
          }
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
      });
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount < 30000) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₦30,000",
      });
      return;
    }

    if (amount > walletData.wallet_earnings) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough earnings to withdraw this amount",
      });
      return;
    }

    if (walletData.wallet_funding < 500) {
      toast({
        variant: "destructive",
        title: "Insufficient Funding Balance",
        description: "You need at least ₦500 in your funding wallet to cover withdrawal fees",
      });
      return;
    }

    if (!bankDetails.account_name || !bankDetails.account_number || !bankDetails.bank_name) {
      toast({
        variant: "destructive",
        title: "Incomplete Details",
        description: "Please fill in all bank details",
      });
      return;
    }

    try {
      // Create withdrawal request
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: amount,
          fee: 500,
          account_name: bankDetails.account_name,
          account_number: bankDetails.account_number,
          bank_name: bankDetails.bank_name,
          status: 'pending'
        });

      if (error) throw error;

      // Deduct fee from funding wallet
      await supabase.rpc('update_wallet_balance', {
        user_uuid: user?.id,
        wallet_type: 'funding',
        amount: -500,
        transaction_description: 'Withdrawal fee'
      });

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request is being processed. You'll be notified once approved.",
      });

      setWithdrawalDialog(false);
      setWithdrawalAmount('');
      setBankDetails({ account_name: '', account_number: '', bank_name: '' });
      fetchWalletData();
      fetchTransactions();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Withdrawal Error",
        description: "Failed to process withdrawal request. Please try again.",
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'game_earning':
      case 'referral_earning':
      case 'daily_bonus':
        return <TrendingUp className="text-green-600" size={20} />;
      default:
        return <ArrowDownToLine className="text-red-600" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'game_earning':
      case 'referral_earning':
      case 'daily_bonus':
      case 'wallet_fund':
        return 'text-green-600';
      default:
        return 'text-red-600';
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please login to access your wallet.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading wallet data...</p>
      </div>
    );
  }

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
                  {showBalance ? `₦${walletData.wallet_funding?.toLocaleString() || '0'}` : '₦****'}
                </p>
              </div>
              <Dialog open={fundingDialog} onOpenChange={setFundingDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-white text-primary hover:bg-gray-100">
                    <Plus size={16} className="mr-2" />
                    Fund Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fund Your Wallet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount (min ₦100)"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleFlutterwaveFunding} className="w-full">
                      <DollarSign size={16} className="mr-2" />
                      Pay with Flutterwave
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                  {showBalance ? `₦${walletData.wallet_earnings?.toLocaleString() || '0'}` : '₦****'}
                </p>
              </div>
              <Dialog open={withdrawalDialog} onOpenChange={setWithdrawalDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-white text-green-600 hover:bg-gray-100"
                    disabled={(walletData.wallet_earnings || 0) < 30000}
                  >
                    <ArrowDownToLine size={16} className="mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Earnings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount (₦)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter amount (min ₦30,000)"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input
                        id="account-name"
                        placeholder="Enter account name"
                        value={bankDetails.account_name}
                        onChange={(e) => setBankDetails({...bankDetails, account_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        placeholder="Enter account number"
                        value={bankDetails.account_number}
                        onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        placeholder="Enter bank name"
                        value={bankDetails.bank_name}
                        onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleWithdrawal} className="w-full">
                      Submit Withdrawal Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-xs text-white/70">
                Minimum withdrawal: ₦30,000 • Fee: ₦500
              </p>
            </div>
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
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <WalletIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Start playing games to see your earnings here!</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ['game_earning', 'referral_earning', 'daily_bonus', 'wallet_fund'].includes(transaction.type) 
                          ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || transaction.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                    </p>
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

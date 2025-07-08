import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, ArrowDownToLine, Eye, EyeOff, TrendingUp, DollarSign, MessageCircle, AlertCircle, History, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';
import WithdrawalCard from '@/components/WithdrawalCard';
import WalletNotificationBanner from '@/components/WalletNotificationBanner';

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
  current_plan: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  account_name: string;
  account_number: string;
  bank_name: string;
  status: string;
  created_at: string;
}

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [walletData, setWalletData] = useState<WalletData>({
    wallet_funding: 0,
    wallet_earnings: 0,
    next_withdraw_at: null,
    current_plan: 'free_trial'
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successWithdrawal, setSuccessWithdrawal] = useState<any>(null);
  const [lastWithdrawal, setLastWithdrawal] = useState<Withdrawal | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
      fetchWithdrawals();
      checkWithdrawalEligibility();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_funding, wallet_earnings, next_withdraw_at, current_plan')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setWalletData(data || { wallet_funding: 0, wallet_earnings: 0, next_withdraw_at: null, current_plan: 'free_trial' });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWithdrawalEligibility = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('can_user_withdraw', {
        user_uuid: user.id
      });

      if (error) throw error;
      setCanWithdraw(data);
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      setCanWithdraw(false);
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

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
      
      // Set the most recent withdrawal for display
      if (data && data.length > 0) {
        setLastWithdrawal(data[0]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
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
      // Initialize Flutterwave payment with LIVE credentials
      const flutterwaveConfig = {
        public_key: "FLWPUBK-b816426ded5868e3496fc1e7cba02c85-X", // Your live public key
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

    // Check for withdrawal fee - ₦3,000 for amounts ₦100,000 and above
    const requiresFee = amount >= 100000;
    const withdrawalFee = requiresFee ? 3000 : 500;
    
    if (walletData.wallet_funding < withdrawalFee) {
      const feeMessage = requiresFee 
        ? "Withdrawals of ₦100,000 and above require a ₦3,000 processing fee in your funding wallet."
        : "You don't have enough balance to cover the withdrawal fee. Fund your wallet first.";
      
      toast({
        variant: "destructive",
        title: "Insufficient Funding Balance",
        description: feeMessage,
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
      // CRITICAL FIX: Deduct withdrawal amount from earnings wallet IMMEDIATELY
      const { error: earningsError } = await supabase.rpc('update_wallet_balance', {
        user_uuid: user?.id,
        wallet_type: 'earnings',
        amount: -amount,
        transaction_description: `Withdrawal request - ₦${amount.toLocaleString()}`
      });

      if (earningsError) throw earningsError;

      // Deduct fee from funding wallet
      const { error: feeError } = await supabase.rpc('update_wallet_balance', {
        user_uuid: user?.id,
        wallet_type: 'funding',
        amount: -withdrawalFee,
        transaction_description: `Withdrawal fee - ${requiresFee ? 'High amount (₦100k+)' : 'Standard'}`
      });

      if (feeError) throw feeError;

      // Create withdrawal request
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: amount,
          fee: withdrawalFee,
          account_name: bankDetails.account_name,
          account_number: bankDetails.account_number,
          bank_name: bankDetails.bank_name,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update next withdrawal time
      await supabase.rpc('update_next_withdrawal_time', {
        user_uuid: user?.id
      });

      // Set success data and show modal
      setSuccessWithdrawal({
        amount: amount,
        bank_name: bankDetails.bank_name,
        expected_date: getExpectedPaymentDate()
      });
      setShowSuccessModal(true);
      
      setWithdrawalDialog(false);
      setWithdrawalAmount('');
      setBankDetails({ account_name: '', account_number: '', bank_name: '' });
      fetchWalletData(); // Refresh balances immediately
      fetchTransactions();
      fetchWithdrawals();
      checkWithdrawalEligibility();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Withdrawal Error",
        description: "Failed to process withdrawal request. Please try again.",
      });
    }
  };

  const getExpectedPaymentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString();
  };

  // Check if user is on free plan
  const isFreeUser = walletData.current_plan === 'free_trial';

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

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      {/* Notification Banner */}
      <WalletNotificationBanner />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span>Withdrawal Submitted!</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">💳 Amount:</span> ₦{successWithdrawal?.amount?.toLocaleString()}</p>
              <p><span className="font-medium">🏦 Bank:</span> {successWithdrawal?.bank_name}</p>
              <p><span className="font-medium">📅 Expected Payment:</span> {successWithdrawal?.expected_date}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-800 mb-2">💬 Need help? Contact support via WhatsApp anytime:</p>
              <a 
                href="https://wa.me/2349136139429" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                👉 https://wa.me/2349136139429
              </a>
            </div>
            <Button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Free User Withdrawal Restriction */}
      {isFreeUser && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p>❌ Withdrawals are locked for Free Plan users.</p>
            <p>🔓 Upgrade to unlock this feature.</p>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Balance Summary Card - UPDATED TO SHOW LAST WITHDRAWAL */}
      {lastWithdrawal && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-900 font-medium">Last Withdrawal</p>
                <p className="text-blue-700">₦{lastWithdrawal.amount.toLocaleString()} on {new Date(lastWithdrawal.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-blue-600">Status: {lastWithdrawal.status.toUpperCase()}</p>
              </div>
              <Badge className={getWithdrawalStatusColor(lastWithdrawal.status)}>
                {lastWithdrawal.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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

        {/* Earnings Wallet - UPDATED TO SHOW ACCURATE BALANCE */}
        <Card className="gradient-secondary text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Earnings Wallet</span>
              <TrendingUp size={24} />
            </CardTitle>
            <CardTitle className="text-sm text-white/80">
              After Withdrawals Balance
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
                    disabled={isFreeUser || !canWithdraw || (walletData.wallet_earnings || 0) < 30000}
                  >
                    <ArrowDownToLine size={16} className="mr-2" />
                    {isFreeUser ? 'Locked' : 'Withdraw'}
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
                      <Select 
                        value={bankDetails.bank_name} 
                        onValueChange={(value) => setBankDetails({...bankDetails, bank_name: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {NIGERIAN_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleWithdrawal} className="w-full">
                      Submit Withdrawal Request
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="text-xs text-white/70">
                Minimum withdrawal: ₦30,000 • Fee: ₦500 (₦3,000 for amounts ₦100,000 and above)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Withdrawal History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <ArrowDownToLine className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          ₦{withdrawal.amount.toLocaleString()} to {withdrawal.bank_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                          {withdrawal.status === 'pending' && (
                            <span className="ml-2 text-blue-600">
                              • Expected: {new Date(new Date(withdrawal.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getWithdrawalStatusColor(withdrawal.status)}>
                      {withdrawal.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <li>• Withdrawal fee: ₦500 (₦3,000 for amounts ₦100,000 and above)</li>
            <li>• Frequency: Maximum 1 withdrawal per 7 days</li>
            <li>• Processing time: 1-3 business days after approval</li>
            <li>• Free Trial users cannot withdraw earnings</li>
          </ul>
        </CardContent>
      </Card>

      {/* WhatsApp Support */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 mb-2">Contact our 24/7 WhatsApp Support:</p>
          <a 
            href="https://wa.me/2349136139429" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 font-medium underline"
          >
            👉 https://wa.me/2349136139429
          </a>
          <p className="text-green-700 text-sm mt-1">💬 Chat with Support – Available 24/7</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;

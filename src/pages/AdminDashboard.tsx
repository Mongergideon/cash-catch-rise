
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Wallet, TrendingUp, AlertCircle, Check, X, LogOut, Edit, Ban, UserPlus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalUsers: number;
  totalEarnings: number;
  totalFunding: number;
  pendingWithdrawals: number;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  wallet_earnings: number;
  wallet_funding: number;
  current_plan: string;
  plan_expires_at: string;
  is_banned: boolean;
  created_at: string;
  referral_code: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEarnings: 0,
    totalFunding: 0,
    pendingWithdrawals: 0
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'funding' | 'earnings'>('funding');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    } else {
      navigate('/admin');
    }
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/admin');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin access",
        });
        navigate('/admin');
        return;
      }

      setIsAdmin(true);
      fetchDashboardData();
      fetchUsers();
      fetchWithdrawals();
      fetchTransactions();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/admin');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const fetchDashboardData = async () => {
    try {
      // Get total users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (usersError) throw usersError;

      // Get total wallet balances
      const { data: walletsData, error: walletsError } = await supabase
        .from('profiles')
        .select('wallet_earnings, wallet_funding');

      if (walletsError) throw walletsError;

      // Get pending withdrawals count
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (withdrawalsError) throw withdrawalsError;

      const totalEarnings = walletsData?.reduce((sum, profile) => sum + (profile.wallet_earnings || 0), 0) || 0;
      const totalFunding = walletsData?.reduce((sum, profile) => sum + (profile.wallet_funding || 0), 0) || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalEarnings,
        totalFunding,
        pendingWithdrawals: withdrawalsData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedData = data as unknown as Withdrawal[];
      setWithdrawals(typedData || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const typedData = data as unknown as Transaction[];
      setTransactions(typedData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const processWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject', notes?: string) => {
    if (!user) return;

    setProcessing(withdrawalId);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Withdrawal ${action}d successfully`,
      });

      fetchWithdrawals();
      fetchDashboardData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process withdrawal",
      });
    } finally {
      setProcessing(null);
    }
  };

  const updateUserWallet = async () => {
    if (!selectedUser || !walletAmount) return;

    const amount = parseFloat(walletAmount);
    if (isNaN(amount)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid number",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_wallet_balance', {
        user_uuid: selectedUser.id,
        wallet_type: walletType,
        amount: amount,
        transaction_description: `Admin ${amount > 0 ? 'credit' : 'debit'} - ${walletType} wallet`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User wallet updated successfully`,
      });

      setWalletAmount('');
      setSelectedUser(null);
      fetchUsers();
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update wallet",
      });
    }
  };

  const banUser = async (userId: string, banned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: banned })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      });
    }
  };

  if (checkingAuth) {
    return (
      <div className="p-8 text-center">
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p>Access denied. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Cash Catch Rise Administration</p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-gray-600">Total Users</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-gray-600">Total Earnings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Wallet className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">₦{stats.totalFunding.toLocaleString()}</p>
              <p className="text-gray-600">Total Funding</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
              <p className="text-gray-600">Pending Withdrawals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">ID: {user.referral_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.current_plan}</Badge>
                      </TableCell>
                      <TableCell>₦{user.wallet_earnings?.toLocaleString() || 0}</TableCell>
                      <TableCell>₦{user.wallet_funding?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_banned ? 'destructive' : 'default'}>
                          {user.is_banned ? 'Banned' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update User Wallet</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Wallet Type</Label>
                                  <select
                                    value={walletType}
                                    onChange={(e) => setWalletType(e.target.value as 'funding' | 'earnings')}
                                    className="w-full p-2 border rounded"
                                  >
                                    <option value="funding">Funding</option>
                                    <option value="earnings">Earnings</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Amount (use negative for debit)</Label>
                                  <Input
                                    type="number"
                                    value={walletAmount}
                                    onChange={(e) => setWalletAmount(e.target.value)}
                                    placeholder="Enter amount"
                                  />
                                </div>
                                <Button onClick={updateUserWallet} className="w-full">
                                  Update Wallet
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant={user.is_banned ? "default" : "destructive"}
                            onClick={() => banUser(user.id, !user.is_banned)}
                          >
                            {user.is_banned ? <UserPlus className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {withdrawal.profiles?.first_name} {withdrawal.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{withdrawal.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">₦{withdrawal.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Fee: ₦{withdrawal.fee}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{withdrawal.bank_name}</p>
                          <p className="text-sm">{withdrawal.account_number}</p>
                          <p className="text-sm text-gray-600">{withdrawal.account_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            withdrawal.status === 'pending' ? 'secondary' :
                            withdrawal.status === 'approved' ? 'default' :
                            'destructive'
                          }
                        >
                          {withdrawal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => processWithdrawal(withdrawal.id, 'approve')}
                              disabled={processing === withdrawal.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => processWithdrawal(withdrawal.id, 'reject')}
                              disabled={processing === withdrawal.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.profiles?.first_name} {transaction.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{transaction.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.type}</Badge>
                      </TableCell>
                      <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

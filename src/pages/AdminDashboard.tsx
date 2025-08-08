import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Wallet, TrendingUp, AlertCircle, Check, X, LogOut, Edit, Ban, UserPlus, Clock, MessageSquare, Settings, Bell } from 'lucide-react';
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
  phone: string;
  wallet_earnings: number;
  wallet_funding: number;
  current_plan: string;
  plan_expires_at: string;
  is_banned: boolean;
  created_at: string;
  referral_code: string;
  renewal_deadline?: string | null;
  renewal_price?: number | null;
  plan_before_expiry?: string | null;
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
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  processed_at: string | null;
  processed_by: string | null;
  admin_notes: string | null;
}

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
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
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'funding' | 'earnings'>('funding');
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedUserForPromo, setSelectedUserForPromo] = useState<UserProfile | null>(null);
  const [promoPrice, setPromoPrice] = useState('3800');
  const [promoPlan, setPromoPlan] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('bronze');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedUsersForNotification, setSelectedUsersForNotification] = useState<string[]>([]);
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
      fetchDeposits();
      fetchTransactions();
      fetchMaintenanceMode();
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
      // Get user count using RPC function
      const { data: userCountData, error: userCountError } = await supabase
        .rpc('admin_get_user_count');

      if (userCountError) {
        console.error('Error fetching user count:', userCountError);
      }

      // Get total wallet balances using RPC
      const { data: walletsData, error: walletsError } = await supabase
        .rpc('admin_get_wallet_totals');

      if (walletsError) {
        console.error('Error fetching wallet totals:', walletsError);
      }

      // Get pending withdrawals count - FIXED QUERY
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (withdrawalsError) {
        console.error('Error fetching withdrawals count:', withdrawalsError);
      }

      setStats({
        totalUsers: userCountData || 0,
        totalEarnings: walletsData?.[0]?.total_earnings || 0,
        totalFunding: walletsData?.[0]?.total_funding || 0,
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
      // Use RPC function to get all users with admin privileges
      const { data, error } = await supabase
        .rpc('admin_get_all_users');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users data",
        });
        return;
      }

      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      console.log('Fetching withdrawals for admin dashboard...');
      
      // Use the new admin function to get all withdrawals with user data
      const { data, error } = await supabase
        .rpc('admin_get_all_withdrawals');

      if (error) {
        console.error('Error fetching withdrawals:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch withdrawal requests",
        });
        return;
      }
      
      console.log('Successfully fetched withdrawals:', data);
      setWithdrawals(data || []);

      // Log some statistics
      const pendingCount = (data || []).filter(w => w.status === 'pending').length;
      const totalCount = (data || []).length;
      console.log(`Admin dashboard loaded ${totalCount} withdrawals (${pendingCount} pending)`);

    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch withdrawal requests. Check console for details.",
      });
    }
  };

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_deposits');
      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deposits",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles!transactions_user_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }
      
      const typedData = data as unknown as Transaction[];
      setTransactions(typedData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const processWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject' | 'processing', withdrawal: Withdrawal) => {
    if (!user) return;

    setProcessing(withdrawalId);
    try {
      if (action === 'approve') {
        // Use the new admin function to update withdrawal status
        const { error } = await supabase.rpc('admin_update_withdrawal_status', {
          withdrawal_id: withdrawalId,
          new_status: 'approved',
          admin_id: user.id,
          notes: 'Approved by admin'
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Withdrawal approved successfully`,
        });
      } else if (action === 'processing') {
        // Set withdrawal to processing status
        const { error } = await supabase.rpc('admin_update_withdrawal_status', {
          withdrawal_id: withdrawalId,
          new_status: 'processing',
          admin_id: user.id,
          notes: 'Set to processing by admin'
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Withdrawal set to processing`,
        });
      } else {
        // On rejection, refund both earnings and fee
        const { error: refundEarningsError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: withdrawal.user_id,
          wallet_type: 'earnings',
          amount: withdrawal.amount,
          transaction_description: `Withdrawal refund - ₦${withdrawal.amount.toLocaleString()}`
        });

        if (refundEarningsError) throw refundEarningsError;

        // Refund the fee to funding wallet
        const { error: refundFeeError } = await supabase.rpc('update_wallet_balance', {
          user_uuid: withdrawal.user_id,
          wallet_type: 'funding',
          amount: withdrawal.fee,
          transaction_description: 'Withdrawal fee refund'
        });

        if (refundFeeError) throw refundFeeError;

        // Use the new admin function to update withdrawal status
        const { error } = await supabase.rpc('admin_update_withdrawal_status', {
          withdrawal_id: withdrawalId,
          new_status: 'rejected',
          admin_id: user.id,
          notes: 'Rejected by admin'
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Withdrawal rejected and funds refunded`,
        });
      }

      fetchWithdrawals();
      fetchDashboardData();
      fetchUsers();
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
      const { error } = await supabase.rpc('admin_ban_user', {
        user_uuid: userId,
        banned: banned
      });

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

  const updateUserPlan = async (userId: string, planType: string, isActive: boolean) => {
    try {
      const expiry = isActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
      
      const { error } = await supabase.rpc('admin_set_user_plan_status', {
        target_user_id: userId,
        new_plan: planType as any,
        new_expiry: expiry?.toISOString() || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User plan updated successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user plan:', error);
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to update user plan",
      });
    }
  };

  const setupUserPromo = async () => {
    if (!selectedUserForPromo) return;

    try {
      const renewalDeadline = new Date();
      renewalDeadline.setDate(renewalDeadline.getDate() + 3); // 3 days from now

      const { error } = await supabase
        .from('profiles')
        .update({
          renewal_deadline: renewalDeadline.toISOString(),
          renewal_price: parseFloat(promoPrice),
          plan_before_expiry: promoPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserForPromo.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo set up for ${selectedUserForPromo.first_name} ${selectedUserForPromo.last_name}`,
      });

      setPromoDialogOpen(false);
      setSelectedUserForPromo(null);
      setPromoPrice('3800');
      setPromoPlan('bronze');
      fetchUsers();
    } catch (error) {
      console.error('Error setting up promo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set up promo",
      });
    }
  };

  const sendNotificationToUsers = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in both title and message",
      });
      return;
    }

    if (selectedUsersForNotification.length === 0) {
      toast({
        variant: "destructive",
        title: "No Users Selected",
        description: "Please select at least one user to send notification to",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_send_notification', {
        user_ids: selectedUsersForNotification,
        notification_title: notificationTitle,
        notification_message: notificationMessage,
        notification_type: 'info'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification sent to ${selectedUsersForNotification.length} user(s)`,
      });

      setNotificationTitle('');
      setNotificationMessage('');
      setSelectedUsersForNotification([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send notification",
      });
    }
  };

  const fetchMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase.rpc('get_maintenance_mode');
      if (error) throw error;
      
      const maintenanceData = data as { enabled?: boolean; message?: string };
      setIsMaintenanceMode(maintenanceData?.enabled || false);
      setMaintenanceMessage(maintenanceData?.message || '');
    } catch (error) {
      console.error('Error fetching maintenance mode:', error);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const { error } = await supabase.rpc('admin_set_maintenance_mode', {
        enabled: !isMaintenanceMode,
        custom_message: maintenanceMessage || null
      });

      if (error) throw error;

      setIsMaintenanceMode(!isMaintenanceMode);
      
      toast({
        title: "Success",
        description: `Maintenance mode ${!isMaintenanceMode ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to toggle maintenance mode",
      });
    }
  };

  // Helper function to get expected payout date
  const getExpectedPayoutDate = (requestDate: string) => {
    const date = new Date(requestDate);
    date.setDate(date.getDate() + 7); // Changed to 7 days
    return date.toLocaleDateString();
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
      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="promos">Promo Management</TabsTrigger>
          <TabsTrigger value="notifications">Send Notifications</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Mode</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>
                Withdrawal Requests ({withdrawals.filter(w => w.status === 'pending').length} pending)
                <Button 
                  onClick={fetchWithdrawals} 
                  className="ml-4" 
                  size="sm"
                  variant="outline"
                >
                  Refresh Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No withdrawal requests found.</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Debug info: Check browser console for detailed logs
                  </p>
                  <Button onClick={fetchWithdrawals} className="mt-4">
                    Refresh Requests
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Found {withdrawals.length} total withdrawal requests
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Expected Payout</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {withdrawal.first_name || 'Unknown'} {withdrawal.last_name || 'User'}
                              </p>
                              <p className="text-sm text-gray-600">{withdrawal.email || 'No email'}</p>
                              <p className="text-sm text-gray-600">{withdrawal.phone || 'No phone'}</p>
                              <p className="text-xs text-gray-500">ID: {withdrawal.user_id.substring(0, 8)}...</p>
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
                              {withdrawal.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-blue-600">
                              {new Date(new Date(withdrawal.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                             {withdrawal.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => processWithdrawal(withdrawal.id, 'approve', withdrawal)}
                                  disabled={processing === withdrawal.id}
                                  className="bg-green-600 hover:bg-green-700"
                                  title="Approve withdrawal"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => processWithdrawal(withdrawal.id, 'processing', withdrawal)}
                                  disabled={processing === withdrawal.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  title="Set to processing"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => processWithdrawal(withdrawal.id, 'reject', withdrawal)}
                                  disabled={processing === withdrawal.id}
                                  title="Reject withdrawal"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {withdrawal.status !== 'pending' && (
                              <span className="text-sm text-gray-500 capitalize">
                                {withdrawal.status}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management ({users.length} users)</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found. This could indicate an issue with data fetching.</p>
                  <Button onClick={fetchUsers} className="mt-4">
                    Refresh Users
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
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
                            <p className="text-sm text-gray-600">{user.phone || 'No phone'}</p>
                            <p className="text-xs text-gray-500">Ref: {user.referral_code}</p>
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
                            <select 
                              value={user.current_plan || 'free_trial'}
                              onChange={(e) => updateUserPlan(user.id, e.target.value, true)}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              <option value="free_trial">Free Trial</option>
                              <option value="bronze">Bronze</option>
                              <option value="silver">Silver</option>
                              <option value="gold">Gold</option>
                            </select>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <Card>
            <CardHeader>
              <CardTitle>Promo Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Set up promotional offers for users with expired plans</p>
                  <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Setup User Promo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Setup User Promo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select User</Label>
                          <select
                            value={selectedUserForPromo?.id || ''}
                            onChange={(e) => {
                              const user = users.find(u => u.id === e.target.value);
                              setSelectedUserForPromo(user || null);
                            }}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">Select a user...</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.first_name} {user.last_name} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Promo Price (₦)</Label>
                          <Input
                            type="number"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(e.target.value)}
                            placeholder="3800"
                          />
                        </div>
                        <div>
                          <Label>Plan to Activate</Label>
                          <select
                            value={promoPlan}
                            onChange={(e) => setPromoPlan(e.target.value as any)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                        <Button 
                          onClick={setupUserPromo} 
                          className="w-full"
                          disabled={!selectedUserForPromo}
                        >
                          Setup Promo (3 days countdown)
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">How Promos Work:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Select a user and set a promotional price for plan renewal</li>
                    <li>• Users will see a "Special Promo" banner instead of regular renewal</li>
                    <li>• Promo expires after 3 days from setup</li>
                    <li>• Once payment is made, their selected plan becomes active for 30 days</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Users with Active Promos:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Promo Price</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(user => {
                        // Show users with renewal_deadline set (active promos)
                        return user.renewal_deadline;
                      }).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>₦{user.renewal_price?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.plan_before_expiry}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.renewal_deadline ? new Date(user.renewal_deadline).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {users.filter(user => user.renewal_deadline).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No active promos found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>All Deposits ({deposits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deposit.first_name} {deposit.last_name}</p>
                          <p className="text-sm text-gray-600">{deposit.email}</p>
                          <p className="text-sm text-gray-600">{deposit.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>₦{deposit.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{deposit.payment_method}</TableCell>
                      <TableCell className="text-xs">{deposit.transaction_reference || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          deposit.status === 'completed' ? 'default' : 
                          deposit.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {deposit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 h-5 mr-2" />
                Send Notifications to Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notificationTitle">Notification Title</Label>
                      <Input
                        id="notificationTitle"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Enter notification title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="notificationMessage">Message</Label>
                      <textarea
                        id="notificationMessage"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        placeholder="Enter your message..."
                        className="w-full p-3 border rounded-md h-24 resize-none"
                      />
                    </div>
                    <Button 
                      onClick={sendNotificationToUsers}
                      className="w-full"
                      disabled={!notificationTitle || !notificationMessage || selectedUsersForNotification.length === 0}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Send Notification ({selectedUsersForNotification.length} users)
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Label>Select Users to Notify</Label>
                    <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedUsersForNotification.length === users.length) {
                              setSelectedUsersForNotification([]);
                            } else {
                              setSelectedUsersForNotification(users.map(u => u.id));
                            }
                          }}
                        >
                          {selectedUsersForNotification.length === users.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {selectedUsersForNotification.length} of {users.length} selected
                        </span>
                      </div>
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedUsersForNotification.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsersForNotification([...selectedUsersForNotification, user.id]);
                                } else {
                                  setSelectedUsersForNotification(selectedUsersForNotification.filter(id => id !== user.id));
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 h-5 mr-2" />
                Maintenance Mode Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">Maintenance Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      When enabled, users will see a maintenance page instead of the app
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={isMaintenanceMode ? 'destructive' : 'default'}>
                      {isMaintenanceMode ? 'ON' : 'OFF'}
                    </Badge>
                    <Button
                      onClick={toggleMaintenanceMode}
                      variant={isMaintenanceMode ? 'destructive' : 'default'}
                    >
                      {isMaintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maintenanceMessage">Custom Maintenance Message</Label>
                    <textarea
                      id="maintenanceMessage"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Enter custom message for maintenance page..."
                      className="w-full p-3 border rounded-md h-24 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use default message
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Maintenance mode will immediately affect all users</li>
                      <li>• Users won't be able to access any app features</li>
                      <li>• Only disable when maintenance is complete</li>
                      <li>• Admin dashboard will remain accessible</li>
                    </ul>
                  </div>
                </div>
              </div>
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

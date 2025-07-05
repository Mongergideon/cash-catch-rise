
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Wallet, TrendingUp, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalEarnings: number;
  totalFunding: number;
  pendingWithdrawals: number;
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

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalEarnings: 0,
    totalFunding: 0,
    pendingWithdrawals: 0
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
      fetchDashboardData();
      fetchWithdrawals();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

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
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
    }
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
      
      // Type assertion to handle the query result properly
      const typedData = data as unknown as Withdrawal[];
      setWithdrawals(typedData || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Cash Catch Rise Administration</p>
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
        <TabsList>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                User management features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Transaction history features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

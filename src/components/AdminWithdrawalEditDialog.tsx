import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  account_name: string;
  account_number: string;
  bank_name: string;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface AdminWithdrawalEditDialogProps {
  withdrawal: Withdrawal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const AdminWithdrawalEditDialog: React.FC<AdminWithdrawalEditDialogProps> = ({
  withdrawal,
  open,
  onOpenChange,
  onUpdate
}) => {
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (withdrawal) {
      setAccountName(withdrawal.account_name);
      setAccountNumber(withdrawal.account_number);
      setBankName(withdrawal.bank_name);
    }
  }, [withdrawal]);

  const handleSave = async () => {
    if (!withdrawal) return;

    if (!accountName || !accountNumber || !bankName) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All fields are required",
      });
      return;
    }

    setLoading(true);
    try {
      // Update withdrawal details using RPC function
      const { error } = await supabase.rpc('admin_update_withdrawal_details', {
        withdrawal_id: withdrawal.id,
        new_account_name: accountName,
        new_account_number: accountNumber,
        new_bank_name: bankName
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal details updated successfully",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update withdrawal details",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!withdrawal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Withdrawal Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">User: {withdrawal.first_name} {withdrawal.last_name}</p>
            <p className="text-sm text-gray-600">Amount: ₦{withdrawal.amount.toLocaleString()}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminWithdrawalEditDialog;
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';

interface EditWithdrawalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: {
    id: string;
    amount: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    status: string;
  };
  onSuccess: () => void;
}

const EditWithdrawalDialog: React.FC<EditWithdrawalDialogProps> = ({
  isOpen,
  onClose,
  withdrawal,
  onSuccess,
}) => {
  const [newBankDetails, setNewBankDetails] = useState({
    account_name: withdrawal.account_name,
    account_number: withdrawal.account_number,
    bank_name: withdrawal.bank_name,
  });
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const EDIT_FEE = 1000; // ₦1,000 edit fee

  const handleFlutterwavePayment = async () => {
    try {
      // Initialize Flutterwave payment for edit fee
      const flutterwaveConfig = {
        public_key: "FLWPUBK-b816426ded5868e3496fc1e7cba02c85-X",
        tx_ref: `edit_${withdrawal.id}_${Date.now()}`,
        amount: EDIT_FEE,
        currency: "NGN",
        country: "NG",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: user?.email || "",
          phone_number: "",
          name: `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim(),
        },
        customizations: {
          title: "Edit Withdrawal Details",
          description: "Payment for editing withdrawal bank details",
          logo: "",
        },
        callback: async (response: any) => {
          if (response.status === "successful") {
            setPaymentReference(response.tx_ref);
            await submitEditRequest(response.tx_ref);
          }
        },
        onclose: () => {
          console.log("Payment modal closed");
        },
      };

      // Check if FlutterwaveCheckout is available
      if (typeof (window as any).FlutterwaveCheckout !== 'undefined') {
        (window as any).FlutterwaveCheckout(flutterwaveConfig);
      } else {
        // Fallback: Load Flutterwave script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.flutterwave.com/v3.js';
        script.onload = () => {
          if ((window as any).FlutterwaveCheckout) {
            (window as any).FlutterwaveCheckout(flutterwaveConfig);
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

  const submitEditRequest = async (txRef: string) => {
    setIsSubmitting(true);

    try {
      // Create edit request
      const { error } = await supabase
        .from('withdrawal_edit_requests')
        .insert({
          withdrawal_id: withdrawal.id,
          user_id: user?.id,
          new_account_name: newBankDetails.account_name,
          new_account_number: newBankDetails.account_number,
          new_bank_name: newBankDetails.bank_name,
          edit_fee_paid: true,
          payment_reference: txRef,
          status: 'pending'
        });

      if (error) throw error;

      // Note: The withdrawal status will be updated by admin when processing the edit request

      toast({
        title: "Edit Request Submitted",
        description: "Your withdrawal edit request has been submitted for admin review.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting edit request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit edit request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!newBankDetails.account_name || !newBankDetails.account_number || !newBankDetails.bank_name) {
      toast({
        variant: "destructive",
        title: "Incomplete Details",
        description: "Please fill in all bank details",
      });
      return;
    }

    handleFlutterwavePayment();
  };

  const hasChanges = 
    newBankDetails.account_name !== withdrawal.account_name ||
    newBankDetails.account_number !== withdrawal.account_number ||
    newBankDetails.bank_name !== withdrawal.bank_name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Edit Withdrawal Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="font-medium">Edit Fee: ₦{EDIT_FEE.toLocaleString()}</p>
              <p className="text-sm">This fee will be charged to process your edit request.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-account-name">Account Name</Label>
              <Input
                id="edit-account-name"
                placeholder="Enter account name"
                value={newBankDetails.account_name}
                onChange={(e) => setNewBankDetails({...newBankDetails, account_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-account-number">Account Number</Label>
              <Input
                id="edit-account-number"
                placeholder="Enter account number"
                value={newBankDetails.account_number}
                onChange={(e) => setNewBankDetails({...newBankDetails, account_number: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="edit-bank-name">Bank Name</Label>
              <Select 
                value={newBankDetails.bank_name} 
                onValueChange={(value) => setNewBankDetails({...newBankDetails, bank_name: value})}
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
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : `Pay ₦${EDIT_FEE.toLocaleString()} & Submit Changes`}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditWithdrawalDialog;
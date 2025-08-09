
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, User } from 'lucide-react';

interface WithdrawalCardProps {
  withdrawal: {
    id: string;
    amount: number;
    fee: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    status: string;
    created_at: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  };
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
  isAdmin?: boolean;
}

const WithdrawalCard: React.FC<WithdrawalCardProps> = ({
  withdrawal,
  onStatusUpdate,
  isAdmin = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-600" />
            <div>
              <CardTitle className="text-lg">
                {withdrawal.profiles 
                  ? `${withdrawal.profiles.first_name || ''} ${withdrawal.profiles.last_name || ''}`.trim() || 'Unknown User'
                  : 'Unknown User'
                }
              </CardTitle>
              <p className="text-sm text-gray-600">
                {withdrawal.profiles?.email || 'No email'}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(withdrawal.status)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(withdrawal.status)}
              <span>{withdrawal.status.toUpperCase()}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Amount</p>
            <p className="text-lg font-bold text-green-600">
              ₦{withdrawal.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Fee</p>
            <p className="text-lg font-bold text-red-600">
              ₦{withdrawal.fee.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Bank Details</p>
          <div className="bg-gray-50 p-3 rounded-lg space-y-1">
            <p className="text-sm"><strong>Name:</strong> {withdrawal.account_name}</p>
            <p className="text-sm"><strong>Number:</strong> {withdrawal.account_number}</p>
            <p className="text-sm"><strong>Bank:</strong> {withdrawal.bank_name}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600">Date Requested</p>
          <p className="text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
        </div>
        
        {isAdmin && (withdrawal.status === 'pending' || withdrawal.status === 'processing') && (
          <div className="flex flex-wrap gap-2 pt-2">
            {withdrawal.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onStatusUpdate(withdrawal.id, 'processing')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Set Processing
              </Button>
            )}
            {withdrawal.status === 'processing' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate(withdrawal.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onStatusUpdate(withdrawal.id, 'rejected', 'Rejected by admin')}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(withdrawal.id, 'editing')}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Edit Request
                </Button>
              </>
            )}
          </div>
        )}
        
        {!isAdmin && withdrawal.status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-blue-800 text-sm font-medium">
              💳 Withdrawal is being processed. You can edit your bank details below for ₦1,000.
            </p>
            <Button
              size="sm"
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                // This would open an edit dialog - implement based on your needs
                console.log('Edit withdrawal details');
              }}
            >
              Edit Bank Details (₦1,000)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalCard;

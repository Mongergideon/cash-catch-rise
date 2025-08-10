import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react';
import WithdrawalCard from './WithdrawalCard';

interface Withdrawal {
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
}

interface WithdrawalSectionsProps {
  withdrawals: Withdrawal[];
  onStatusUpdate: (id: string, status: string, notes?: string) => void;
  isAdmin: boolean;
}

const WithdrawalSections: React.FC<WithdrawalSectionsProps> = ({
  withdrawals,
  onStatusUpdate,
  isAdmin,
}) => {
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processingWithdrawals = withdrawals.filter(w => w.status === 'processing');
  const editingWithdrawals = withdrawals.filter(w => w.status === 'editing');
  const completedWithdrawals = withdrawals.filter(w => ['approved', 'completed', 'rejected'].includes(w.status));

  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'editing':
        return <Edit className="h-5 w-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getSectionColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'editing':
        return 'border-orange-200 bg-orange-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card className={`${getSectionColor('pending')} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-700">
              {getSectionIcon('pending')}
              <span>Pending Withdrawals ({pendingWithdrawals.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingWithdrawals.map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal.id}
                withdrawal={withdrawal}
                onStatusUpdate={onStatusUpdate}
                isAdmin={isAdmin}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processing Withdrawals */}
      {processingWithdrawals.length > 0 && (
        <Card className={`${getSectionColor('processing')} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              {getSectionIcon('processing')}
              <span>Processing Withdrawals ({processingWithdrawals.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingWithdrawals.map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal.id}
                withdrawal={withdrawal}
                onStatusUpdate={onStatusUpdate}
                isAdmin={isAdmin}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Editing Withdrawals */}
      {editingWithdrawals.length > 0 && (
        <Card className={`${getSectionColor('editing')} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              {getSectionIcon('editing')}
              <span>Withdrawals Being Edited ({editingWithdrawals.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingWithdrawals.map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal.id}
                withdrawal={withdrawal}
                onStatusUpdate={onStatusUpdate}
                isAdmin={isAdmin}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Withdrawals */}
      {completedWithdrawals.length > 0 && (
        <Card className={`${getSectionColor('completed')} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              {getSectionIcon('completed')}
              <span>Completed Withdrawals ({completedWithdrawals.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedWithdrawals.slice(0, 5).map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal.id}
                withdrawal={withdrawal}
                onStatusUpdate={onStatusUpdate}
                isAdmin={isAdmin}
              />
            ))}
            {completedWithdrawals.length > 5 && (
              <div className="text-center text-gray-500 text-sm pt-2">
                And {completedWithdrawals.length - 5} more completed withdrawals...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Withdrawals */}
      {withdrawals.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No withdrawal requests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WithdrawalSections;
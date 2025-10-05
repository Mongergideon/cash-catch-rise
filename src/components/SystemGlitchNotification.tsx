import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const SystemGlitchNotification = () => {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const AFFECTED_USER_ID = '9ab6f4c2-119f-4503-bec0-69a8fbb4d46c';

  useEffect(() => {
    // Only show for the affected user and if they haven't dismissed it yet
    if (user?.id === AFFECTED_USER_ID) {
      const dismissed = localStorage.getItem('system_glitch_notification_dismissed');
      if (!dismissed) {
        setShowNotification(true);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem('system_glitch_notification_dismissed', 'true');
    setShowNotification(false);
  };

  const handleContactSupport = () => {
    window.open('https://wa.me/2347016209000', '_blank');
    handleDismiss();
  };

  if (!showNotification || user?.id !== AFFECTED_USER_ID) {
    return null;
  }

  return (
    <AlertDialog open={showNotification} onOpenChange={setShowNotification}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Important Notice About Your Withdrawals
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base">
              We detected a system glitch that affected your recent withdrawal requests. 
              As a result, all pending withdrawals have been rejected, including your valid withdrawal request.
            </p>
            <p className="text-base font-medium text-orange-700">
              Your account balance has been fully restored to its correct amount.
            </p>
            <p className="text-base">
              Before making a new withdrawal request, please contact our support team on WhatsApp 
              so we can guide you through the process and ensure everything works smoothly.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-sm font-medium text-blue-900">
                📱 WhatsApp Support: 07016209000
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleContactSupport}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Contact Support on WhatsApp
          </Button>
          <Button 
            onClick={handleDismiss}
            variant="outline"
            className="w-full"
          >
            I Understand, Close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SystemGlitchNotification;

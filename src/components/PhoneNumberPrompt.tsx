import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';

const PhoneNumberPrompt = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      checkPhoneNumber();
    }
  }, [user]);

  const checkPhoneNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Show prompt if phone is null or empty
      if (!data?.phone || data.phone.trim() === '') {
        setShowPrompt(true);
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.trim() === '') {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Basic phone validation (Nigerian format)
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error('Please enter a valid Nigerian phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Phone number saved successfully!');
      setShowPrompt(false);
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      toast.error(error.message || 'Failed to save phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={showPrompt} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Phone Number Required</DialogTitle>
          <DialogDescription className="text-center">
            Please provide your phone number to continue using the app. This is required for account security and withdrawals.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              className="text-base"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter your Nigerian phone number (11 digits starting with 070, 080, 081, 090, or 091)
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberPrompt;

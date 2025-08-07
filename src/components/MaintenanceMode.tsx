import React from 'react';
import { Wrench, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MaintenanceModeProps {
  message?: string;
  schedule?: Date;
  onBack?: () => void;
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({
  message = "We're currently performing scheduled maintenance to improve your experience.",
  schedule,
  onBack
}) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <Wrench className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-primary">Under Maintenance</h2>
          
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
          
          {schedule && (
            <div className="flex items-center justify-center space-x-2 mb-6 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Expected completion: {schedule.toLocaleString()}</span>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We apologize for any inconvenience and appreciate your patience.
            </p>
            
            {onBack && (
              <Button 
                onClick={onBack}
                variant="outline"
                className="hover-gold-glow"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceMode;
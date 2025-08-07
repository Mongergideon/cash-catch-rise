import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Tasks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-gold-glow"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
        </div>

        {/* Coming Soon Card */}
        <Card className="text-center">
          <CardContent className="p-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-primary">Upcoming Tasks</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Daily tasks and challenges are coming soon! Complete tasks to earn extra rewards 
              and boost your earnings.
            </p>
            
            {/* Preview Features */}
            <div className="grid md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
              <div className="p-4 bg-card border rounded-lg">
                <Clock className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-medium mb-2">Daily Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Complete simple daily challenges
                </p>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <Star className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <h3 className="font-medium mb-2">Bonus Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Earn extra coins and bonuses
                </p>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <CheckSquare className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-medium mb-2">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track your completion progress
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="hover-gold-glow"
              >
                Back to Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
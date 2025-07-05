
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  useEffect(() => {
    // Log 404 errors for debugging
    const currentPath = window.location.pathname;
    console.error(`404 Error: User attempted to access non-existent route: ${currentPath}`);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-4xl font-bold">₦</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full gradient-primary text-white">
                <Home className="mr-2" size={16} />
                Go Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2" size={16} />
              Go Back
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Need help? Contact us on{' '}
              <a 
                href="https://wa.me/2349136139429" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                WhatsApp
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;

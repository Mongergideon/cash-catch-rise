
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Wallet, TrendingUp, MessageCircle, Gift } from 'lucide-react';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup = ({ isOpen, onClose }: WelcomePopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center gradient-text">
            🎉 Welcome to Cash Catch Rise!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-center text-gray-600 mb-6">
            Here's how the app works:
          </p>

          <div className="grid gap-4">
            {/* Step 1 */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="flex items-start space-x-4 p-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">1. Select an Investment Plan</h3>
                  <p className="text-gray-600 text-sm">Choose a plan to unlock daily earnings and game access</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="flex items-start space-x-4 p-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">2. Play Games to Earn Real Money</h3>
                  <p className="text-gray-600 text-sm">Higher plans unlock more games and higher earnings</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="flex items-start space-x-4 p-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">3. Fund Your Wallet</h3>
                  <p className="text-gray-600 text-sm">Use Flutterwave to add money for plan purchases and fees</p>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="flex items-start space-x-4 p-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">4. Withdraw to Your Bank Account</h3>
                  <p className="text-gray-600 text-sm">
                    <span className="text-red-600 font-medium">Free users can't withdraw</span> - 
                    Withdrawals are limited based on your plan
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Support */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">💬 Need help? Contact our 24/7 WhatsApp Support:</h3>
                  <a 
                    href="https://wa.me/2349136139429" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 font-medium underline"
                  >
                    👉 https://wa.me/2349136139429
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={onClose} className="w-full gradient-primary text-white py-3">
            ✔ Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;

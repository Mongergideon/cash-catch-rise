
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MaintenanceMode from '@/components/MaintenanceMode';
import FloatingMenu from '@/components/FloatingMenu';
import PhoneNumberPrompt from '@/components/PhoneNumberPrompt';

const Layout = () => {
  const [maintenanceMode, setMaintenanceMode] = useState<{enabled: boolean, message: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase.rpc('get_maintenance_status');
      if (error) throw error;
      
      // Parse the JSON data from the database function
      const maintenanceData = data as { enabled: boolean; message: string };
      setMaintenanceMode(maintenanceData);
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      setMaintenanceMode({ enabled: false, message: '' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (maintenanceMode?.enabled) {
    return <MaintenanceMode message={maintenanceMode.message} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Phone Number Prompt */}
      <PhoneNumberPrompt />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">₦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Cash Catch Rise
                </h1>
                <p className="text-xs text-gray-500">Blue Ridge Investment</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Welcome Back!</p>
              <p className="text-xs text-gray-500">Ready to earn?</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* Floating Circular Menu */}
      <FloatingMenu />
    </div>
  );
};

export default Layout;

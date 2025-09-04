
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, CreditCard, Wallet, Bell, CheckSquare, Settings, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MaintenanceMode from '@/components/MaintenanceMode';

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
        <p>Loading...</p>
      </div>
    );
  }

  if (maintenanceMode?.enabled) {
    return <MaintenanceMode message={maintenanceMode.message} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center hover-gold-glow">
                <span className="text-background font-bold text-lg">₦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Cash Catch Rise</h1>
                <p className="text-xs text-muted-foreground">Blue Ridge Investment</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Welcome Back!</p>
              <p className="text-xs text-muted-foreground">Ready to earn?</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-6 h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <Home size={20} />
            <span className="text-xs">Home</span>
          </NavLink>
          
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <CreditCard size={20} />
            <span className="text-xs">Plans</span>
          </NavLink>
          
          <NavLink
            to="/wallet"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <Wallet size={20} />
            <span className="text-xs">Wallet</span>
          </NavLink>
          
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <Bell size={20} />
            <span className="text-xs">Alerts</span>
          </NavLink>
          
          <NavLink
            to="/successful-withdrawals"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <CheckCircle size={20} />
            <span className="text-xs">Success</span>
          </NavLink>
          
          <NavLink
            to="/payment-verification"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <CheckSquare size={20} />
            <span className="text-xs">Verify</span>
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-all hover:scale-105 ${
                isActive ? 'text-primary bg-primary/10 pink-pulse' : 'text-muted-foreground hover:text-primary'
              }`
            }
          >
            <Settings size={20} />
            <span className="text-xs">Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/2349136139429"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all hover:scale-110 hover-gold-glow">
          <MessageCircle className="text-white" size={24} />
        </div>
      </a>
    </div>
  );
};

export default Layout;

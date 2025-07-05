
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, CreditCard, Wallet, Store, Users, Settings, MessageCircle } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">₦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cash Catch Rise</h1>
                <p className="text-xs text-gray-500">Blue Ridge Investment</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Welcome Back!</p>
              <p className="text-xs text-gray-500">Ready to earn?</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-6 h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
              }`
            }
          >
            <Home size={20} />
            <span className="text-xs">Home</span>
          </NavLink>
          
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
              }`
            }
          >
            <CreditCard size={20} />
            <span className="text-xs">Plans</span>
          </NavLink>
          
          <NavLink
            to="/wallet"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
              }`
            }
          >
            <Wallet size={20} />
            <span className="text-xs">Wallet</span>
          </NavLink>
          
          <NavLink
            to="/store"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
              }`
            }
          >
            <Store size={20} />
            <span className="text-xs">Store</span>
          </NavLink>
          
          <NavLink
            to="/referral"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
              }`
            }
          >
            <Users size={20} />
            <span className="text-xs">Referral</span>
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-primary bg-primary/5' : 'text-gray-600'
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
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
          <MessageCircle className="text-white" size={24} />
        </div>
      </a>
    </div>
  );
};

export default Layout;

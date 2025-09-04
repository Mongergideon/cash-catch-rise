import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Wallet, 
  Bell, 
  CheckSquare, 
  Settings, 
  CheckCircle,
  Plus,
  X
} from 'lucide-react';

const menuItems = [
  { icon: CreditCard, path: '/plans', label: 'Plans' },
  { icon: Wallet, path: '/wallet', label: 'Wallet' },
  { icon: Bell, path: '/notifications', label: 'Alerts' },
  { icon: CheckCircle, path: '/successful-withdrawals', label: 'Success' },
  { icon: CheckSquare, path: '/payment-verification', label: 'Verify' },
  { icon: Settings, path: '/settings', label: 'Settings' },
];

const FloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const getItemPosition = (index: number, total: number) => {
    const angle = (index * (360 / total)) * (Math.PI / 180);
    const radius = 80;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Menu Container */}
      <div className="fixed bottom-8 right-8 z-50">
        {/* Menu Items */}
        {isOpen && menuItems.map((item, index) => {
          const { x, y } = getItemPosition(index, menuItems.length);
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                absolute transition-all duration-300 ease-out
                ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/50' : 'bg-white text-gray-700 hover:bg-primary hover:text-white shadow-lg'}
                w-12 h-12 rounded-full flex items-center justify-center
                hover:scale-110 transform-gpu
                animate-in fade-in zoom-in
              `}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                animationDelay: `${index * 50}ms`,
              }}
            >
              <Icon size={20} />
            </NavLink>
          );
        })}

        {/* Main Home Button */}
        <div className="relative">
          <NavLink
            to="/"
            className={({ isActive }) => `
              relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 transform-gpu shadow-2xl
              ${isActive && !isOpen 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/50' 
                : 'bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-blue-500 hover:to-purple-600'
              }
              hover:scale-110 hover:shadow-2xl
              ${isOpen ? 'scale-110 rotate-45' : 'scale-100 rotate-0'}
            `}
          >
            <Home size={24} className={`transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
          </NavLink>

          {/* Toggle Button Overlay */}
          <button
            onClick={toggleMenu}
            className={`
              absolute inset-0 w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 transform-gpu
              ${isOpen 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/50' 
                : 'bg-transparent'
              }
              hover:scale-110 hover:shadow-2xl
            `}
          >
            {isOpen ? (
              <X size={24} className="transition-all duration-300" />
            ) : (
              <Plus size={20} className="absolute opacity-0 hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        </div>

        {/* Ripple Effect */}
        {isOpen && (
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-primary/20 animate-ping" />
        )}
      </div>
    </>
  );
};

export default FloatingMenu;
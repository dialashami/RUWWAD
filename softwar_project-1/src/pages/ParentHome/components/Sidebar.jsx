import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  MessageCircle, 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../../slices/authSlice';

// استيراد الصفحات
import Dashboard from '../components/Dashboard';
// import Messages from '../components/ChatCenter';
import { ChatCenter } from '../components/ChatCenter';
import Notifications from '../components/Notifications';
import SettingsPage from '../components/Settings';

const menuItems = [
  { 
    id: 'dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard',
    component: Dashboard 
  },
  { 
    id: 'chat', 
    icon: MessageCircle, 
    label: 'Messages',
    component: ChatCenter 
  },
  { 
    id: 'notifications', 
    icon: Bell, 
    label: 'Notifications',
    component: Notifications 
  },
  { 
    id: 'settings', 
    icon: Settings, 
    label: 'Settings',
    component: SettingsPage 
  },
];

export function Sidebar({ activeItem, onItemChange, unreadMessages = 0, unreadNotifications = 0, onMessagesRead, onNotificationsRead }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };
  // دالة للتعامل مع الضغط على اللوجو
  const handleLogoClick = () => {
    console.log('Logo clicked - changing to dashboard');
    if (onItemChange) {
      onItemChange('dashboard');
    } else {
      console.error('onItemChange function is not defined');
    }
  };

  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-header">
        <motion.div 
          className="logo-container cursor-pointer"
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img 
            src="/logoRUWWAD1.png" 
            alt="Ruwwad Logo" 
            className="logo-image"
          />
        </motion.div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                console.log('Clicked:', item.id);
                onItemChange(item.id);
                if (item.id === 'chat' && onMessagesRead) {
                  onMessagesRead();
                }
                if (item.id === 'notifications' && onNotificationsRead) {
                  onNotificationsRead();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              
              {item.id === 'chat' && unreadMessages > 0 && (
                <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{unreadMessages}</span>
                </div>
              )}
              {item.id === 'notifications' && unreadNotifications > 0 && (
                <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{unreadNotifications}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 space-y-3">
         

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
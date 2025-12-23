import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  TrendingUp,
  Bell,
  Bot,
  Settings,
  LogOut,
  MessageCircle, 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../../slices/authSlice';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';

export function Sidebar({ activeSection, onSectionChange, notificationCount = 0 }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('navigation.dashboard') },
    { id: 'users', icon: BookOpen, label: t('navigation.userManagement') },
    { id: 'communication', icon: MessageCircle, label: t('navigation.communication') },
    { id: 'notifications', icon: Bell, label: t('navigation.notifications') },
    { id: 'settings', icon: Settings, label: t('navigation.settings') },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleLogoClick = () => {
    console.log('Logo clicked - changing to dashboard');
    if (onSectionChange) {
      onSectionChange('dashboard');
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
          const isActive = activeSection === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                console.log('Clicked:', item.id);
                onSectionChange && onSectionChange(item.id);
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

              {item.id === 'notifications' && notificationCount > 0 && (
                <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 space-y-3">
        <LanguageSwitcher />

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">{t('auth.logout')}</span>
        </button>
      </div>
    </div>
  );
}

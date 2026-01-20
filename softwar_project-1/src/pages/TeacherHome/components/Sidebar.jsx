 import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
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
import { API_CONFIG } from '../../../config/api.config';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'lessons', icon: BookOpen, label: 'My Lessons' },
  { id: 'assignments', icon: CheckSquare, label: 'Assignments' },

  // ✅ زر الشات الجديد (Teacher ↔ Students & Parents)
  { id: 'chat', icon: MessageCircle, label: 'Messages' },

  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'ai-tutor', icon: Bot, label: 'AI Tutor' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ activeItem, onItemChange }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // State for dynamic data
  const [notificationCount, setNotificationCount] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    role: 'Teacher'
  });

  // Load user data and fetch notification count
  useEffect(() => {
    // Load user from localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          role: parsed.role || 'Teacher'
        });
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }

    // Fetch notification count from API
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/notifications/unread-count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };

    fetchNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get user initials
  const getInitials = () => {
    const first = userData.firstName.charAt(0) || '';
    const last = userData.lastName.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  // Get full name
  const getFullName = () => {
    return `${userData.firstName} ${userData.lastName}`.trim() || 'User';
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

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
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">{getInitials()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold">{getFullName()}</span>
            <span className="text-gray-500 text-sm capitalize">{userData.role}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-300 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

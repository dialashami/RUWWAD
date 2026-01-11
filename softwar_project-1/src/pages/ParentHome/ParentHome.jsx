 import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
 
import  Dashboard from './components/Dashboard';
import  Notifications from './components/Notifications';
 
 import Settings from './components/Settings';

import { ChatCenter } from './components/ChatCenter';
import FeedbackStar from './components/FeedbackStar';
import { API_CONFIG } from '../../config/api.config';
import './ParentHome.css';

export default function StudentHome() {
  const [activePage, setActivePage] = useState('dashboard');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const userId = user._id;

  // Fetch unread message count
  const fetchUnreadMessageCount = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      // Sum up unread counts from teacher conversations
      const totalUnread = data
        .filter((conv) => conv.partnerRole === 'teacher')
        .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadMessages(totalUnread);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(API_CONFIG.NOTIFICATIONS.UNREAD_COUNT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadNotifications(data.count || 0);
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadMessageCount();
    fetchUnreadNotificationCount();
  }, [userId, token]);

  // Refresh counts when switching pages
  useEffect(() => {
    if (activePage !== 'chat') {
      fetchUnreadMessageCount();
    }
    if (activePage !== 'notifications') {
      fetchUnreadNotificationCount();
    }
  }, [activePage]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
  
     
      case 'chat':
        return <ChatCenter currentRole="student" />;
       
          case 'notifications':
        return <Notifications />;
 
     case 'settings':
        return<Settings/>
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="parent-home">
      <Sidebar 
        activeItem={activePage} 
        onItemChange={setActivePage} 
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        onMessagesRead={() => setUnreadMessages(0)}
        onNotificationsRead={() => setUnreadNotifications(0)}
      />
      <div className="main-content">
        {renderPage()}
      </div>

      <FeedbackStar />
    </div>
  );
}
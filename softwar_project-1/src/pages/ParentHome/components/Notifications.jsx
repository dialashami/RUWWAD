import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

// Icon components
const Award = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileText = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MessageSquare = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircle2 = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Bell = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-3.79 1.17 5.97 5.97 0 01-3.79-1.17M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);


const iconComponents = {
  Award,
  FileText,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Bell,
  Clock,
  X,
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const userId = user._id;

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      console.log('[ParentNotifications] userId:', userId, 'token:', token ? 'present' : 'missing');
      
      if (!userId || !token) {
        console.log('[ParentNotifications] Missing userId or token');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.log('[ParentNotifications] Fetching from:', `${API_BASE}/notifications/user/${userId}`);
        
        const res = await fetch(`${API_BASE}/notifications/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('[ParentNotifications] Response status:', res.status);
        
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        
        console.log('[ParentNotifications] Received data:', data);
        console.log('[ParentNotifications] Data length:', data.length);
        
        // Transform backend data to match component format
        const transformed = data.map((n) => ({
          id: n._id,
          type: n.type || 'other',
          icon: getIconForType(n.type),
          title: n.title,
          message: n.message || n.body || '',
          time: formatTime(n.createdAt),
          read: n.isRead,
          color: getColorForType(n.type),
          student: n.childName || 'Student',
        }));
        
        console.log('[ParentNotifications] Transformed notifications:', transformed.length);
        setNotifications(transformed);
      } catch (err) {
        console.error('[ParentNotifications] Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userId, token]);

  const getIconForType = (type) => {
    const iconMap = {
      grade: 'Award',
      assignment: 'FileText',
      message: 'MessageSquare',
      system: 'AlertCircle',
      lesson: 'FileText',
      quiz: 'Award',
      schedule: 'Calendar',
      achievement: 'TrendingUp',
      deadline: 'Clock',
      other: 'Bell',
    };
    return iconMap[type] || 'Bell';
  };

  const getColorForType = (type) => {
    const colorMap = {
      grade: 'blue',
      assignment: 'purple',
      message: 'indigo',
      system: 'gray',
      lesson: 'green',
      quiz: 'blue',
      schedule: 'violet',
      achievement: 'green',
      deadline: 'red',
      other: 'gray',
    };
    return colorMap[type] || 'gray';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const getIconComponent = (iconName) => {
    return iconComponents[iconName] || Award;
  };

  return (
    <div className="parent-dashboard">
      {/* بانر علوي بنفس scale وشكل الداشبورد */}
      <div className="parent-banner">
        <h1>Notifications</h1>
        <p>Stay updated with your children's academic activities</p>
      </div>

      {/* الكارد الرئيسي للنوتيفيكيشن – نفس parent-main-card تبع الداشبورد */}
      <div className="parent-main-card">
        {/* Header داخل الكارد */}
        

        {/* Filters + List داخل نفس الكارد */}
        <div className="tabs-container">
          <div className="tabs-list">
            {['all', 'unread', 'grade', 'assignment', 'message'].map((tab) => (
              <button
                key={tab}
                className={`tab-trigger ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="notifications-card">
            <div className="notifications-content">
              <div className="scroll-area">
                <div className="notifications-list">
                  {loading ? (
                    <div className="empty-state">
                      <p className="empty-text">Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                      <Bell className="empty-icon" />
                      <p className="empty-text">No notifications found</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => {
                      const IconComponent = getIconComponent(notification.icon);
                      const status = notification.read ? 'read' : 'unread';

                      return (
                        <div
                          key={notification.id}
                          className={`notification-item ${status}`}
                        >
                          <div className="notification-content">
                            <div
                              className={`notification-icon ${status} ${notification.color}`}
                            >
                              <IconComponent
                                className={`icon ${status} ${notification.color}`}
                              />
                            </div>

                            <div className="notification-details">
                              <div className="notification-header">
                                <div>
                                  <h3
                                    className={`notification-title ${status}`}
                                  >
                                    {notification.title}
                                  </h3>
                                  <p
                                    className={`notification-message ${status}`}
                                  >
                                    {notification.message}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="unread-dot" />
                                )}
                              </div>

                              <div className="notification-footer">
                                <div className="student-info">
                                  <span className="student-badge">
                                    {notification.student}
                                  </span>
                                  <span className="notification-time">
                                    <Clock className="time-icon" />
                                    {notification.time}
                                  </span>
                                </div>

                                <div className="notification-actions">
                                  {!notification.read && (
                                    <button
                                      className="action-button mark-read-button"
                                      onClick={() =>
                                        handleMarkAsRead(notification.id)
                                      }
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Mark Read
                                    </button>
                                  )}
                                  <button
                                    className="action-button delete-button"
                                    onClick={() =>
                                      handleDeleteNotification(notification.id)
                                    }
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}

export default Notifications;

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Award,
  MessageCircle,
  Calendar,
  Trash2,
  X,
} from "lucide-react";
import { useStudent } from "../context/StudentContext";

// Fallback notifications if backend returns empty
const fallbackNotifications = [
  {
    id: "fallback-1",
    type: "lesson",
    icon: Info,
    title: "Welcome to the Platform",
    message: "Start exploring your courses and assignments!",
    time: "Just now",
    read: false,
    actionable: false,
  },
];

// Map notification type to icon
const getIconForType = (type) => {
  switch (type) {
    case "assignment": return AlertCircle;
    case "grade": return Award;
    case "message": return MessageCircle;
    case "lesson": return Info;
    case "quiz": return CheckCircle2;
    case "schedule": return Calendar;
    case "achievement": return Award;
    case "deadline": return AlertCircle;
    default: return Bell;
  }
};

// Format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("all");
  const [notificationList, setNotificationList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get context functions to update sidebar notification count
  const { updateUnreadNotifications, decrementUnreadNotifications } = useStudent();

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let userId = null;
      
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed?._id || parsed?.id || null;
          console.log('Parsed user from localStorage:', parsed);
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }

      console.log('Token exists:', !!token, 'UserId:', userId);

      if (!token || !userId) {
        console.log('No token or userId, using fallback notifications');
        setNotificationList(fallbackNotifications);
        setLoading(false);
        return;
      }

      console.log('Fetching notifications for user:', userId);
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/user/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Notifications response status:', res.status);

      if (!res.ok) {
        console.error('Failed to fetch notifications:', res.status);
        setNotificationList(fallbackNotifications);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('Notifications data from backend:', data);
      
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No notifications found, using fallback');
        setNotificationList(fallbackNotifications);
        setLoading(false);
        return;
      }

      // Map backend data to component format
      const mapped = data.map(n => ({
        id: n._id,
        type: n.type || 'lesson',
        icon: getIconForType(n.type),
        title: n.title,
        message: n.message || n.body || '',
        time: formatTimeAgo(n.createdAt),
        read: n.isRead || false,
        actionable: true,
      }));

      setNotificationList(mapped);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotificationList(fallbackNotifications);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const filteredNotifications = notificationList.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    if (activeTab === "read") return n.read;
    return true;
  });

  const handleMarkAsRead = async (id) => {
    // Check if notification was unread before marking
    const notification = notificationList.find(n => n.id === id);
    const wasUnread = notification && !notification.read;
    
    // Update local state immediately
    setNotificationList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    
    // Update sidebar count
    if (wasUnread) {
      decrementUnreadNotifications(1);
    }

    // Update backend
    try {
      const token = localStorage.getItem('token');
      if (token && id && !id.toString().startsWith('fallback')) {
        await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDelete = async (id) => {
    // Update local state immediately
    setNotificationList((prev) => prev.filter((n) => n.id !== id));
    
    // Close modal if deleting selected notification
    if (selectedNotification && selectedNotification.id === id) {
      setIsDetailsOpen(false);
      setSelectedNotification(null);
    }

    // Delete from backend
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting notification:', id, 'isFallback:', id.toString().startsWith('fallback'));
      if (token && id && !id.toString().startsWith('fallback')) {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Delete response:', res.status);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Update local state immediately
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })));
    
    // Update sidebar count to 0
    updateUnreadNotifications(0);

    // Update backend
    try {
      const token = localStorage.getItem('token');
      let userId = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed?._id || parsed?.id || null;
        }
      } catch {
        // ignore
      }

      if (token && userId) {
        console.log('Marking all as read for user:', userId);
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/user/${userId}/read-all`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Mark all as read response:', res.status);
        const data = await res.json();
        console.log('Mark all as read result:', data);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notificationList.filter((n) => !n.read).length;

  // اختيار ستايل البادج تبع الأيقونة حسب النوع
  const getIconClasses = (type) => {
    switch (type) {
      case "assignment":
        return "icon-orange-bg icon-orange-fg";
      case "grade":
        return "icon-yellow-bg icon-yellow-fg";
      case "message":
        return "icon-blue-bg icon-blue-fg";
      case "lesson":
        return "icon-purple-bg icon-purple-fg";
      case "quiz":
        return "icon-green-bg icon-green-fg";
      case "schedule":
        return "icon-pink-bg icon-pink-fg";
      case "achievement":
        return "icon-yellow-bg icon-yellow-fg";
      case "deadline":
        return "icon-red-bg icon-red-fg";
      default:
        return "";
    }
  };

  // لما أضغط View
  const openDetails = (notification) => {
    // علمها مقروءة
    setNotificationList((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    // خزّنها وافتح المودال
    setSelectedNotification(notification);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedNotification(null);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!selectedNotification || !replyText.trim()) {
      return;
    }

    try {
      setSendingReply(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to send a reply');
        setSendingReply(false);
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          originalNotificationId: selectedNotification.id,
          replyBody: replyText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Failed to send reply:', res.status, data);
        alert(data.message || 'Failed to send reply');
        return;
      }

      alert('Reply sent successfully');
      setReplyText('');
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Error sending reply: ' + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="notifications-page">
      {/* HEADER */}
      <div className="notifications-header-row">
        <div className="notifications-header-left">
          <h1>
            Notifications  
          </h1>
          <p>Stay updated with your learning activities</p>
        </div>

        <div className="notifications-header-right">
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} Unread</span>
          )}

          <button
            className="mark-all-btn"
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-wrapper">
        <div className="tabs-list">
          <button
            className="tabs-trigger"
            data-active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>

          <button
            className="tabs-trigger"
            data-active={activeTab === "unread"}
            onClick={() => setActiveTab("unread")}
          >
            Unread
          </button>

          <button
            className="tabs-trigger"
            data-active={activeTab === "read"}
            onClick={() => setActiveTab("read")}
          >
            Read
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n, index) => {
            const IconEl = n.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div
                  className={`notification-card ${!n.read ? "unread" : ""}`}
                >
                  <div className="notification-inner">
                    {/* Icon bubble */}
                    <div
                      className={`notification-icon ${getIconClasses(
                        n.type
                      )}`}
                    >
                      <IconEl size={24} />
                    </div>

                    {/* Content */}
                    <div className="notification-content">
                      <div className="notification-header-row">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-time">
                          <span>{n.time}</span>
                          {!n.read && <span className="unread-dot" />}
                        </div>
                      </div>

                      <div className="notification-message">{n.message}</div>

                      <div className="notification-actions-row">
                        {n.actionable && (
                          <button
                            className="view-btn"
                            onClick={() => openDetails(n)}
                          >
                            View
                          </button>
                        )}

                        {!n.read && (
                          <button
                            className="mark-read-btn"
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            Mark as Read
                          </button>
                        )}

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(n.id)}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="empty-state-wrapper">
              <div className="empty-state-icon-ring">
                <Bell size={48} />
              </div>
              <div className="empty-state-title">No notifications</div>
              <div className="empty-state-desc">
                You're all caught up! 🎉
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {isDetailsOpen && selectedNotification && (
        <div className="notif-modal-overlay" onClick={closeDetails}>
          <motion.div
            className="notif-modal-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()} // ما تسكري لو كبست جوه
          >
            <div className="notif-modal-header">
              <div className="notif-modal-icon-and-title">
                <div
                  className={`notification-icon ${getIconClasses(
                    selectedNotification.type
                  )}`}
                >
                  <selectedNotification.icon size={24} />
                </div>
                <div className="notif-modal-texts">
                  <div className="notif-modal-title">
                    {selectedNotification.title}
                  </div>
                  <div className="notif-modal-time">
                    {selectedNotification.time}
                  </div>
                </div>
              </div>

              <button className="notif-modal-close" onClick={closeDetails}>
                <X size={20} />
              </button>
            </div>

            <div className="notif-modal-body">
              <div className="notif-modal-message">
                {selectedNotification.message}
              </div>
              {selectedNotification.type === 'message' && (
                <div className="notif-modal-reply-section">
                  <h4>Reply to this message</h4>
                  <textarea
                    className="notif-modal-reply-textarea"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply here..."
                  />
                  <button
                    className="view-btn"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              )}
            </div>

            <div className="notif-modal-footer">
              <button
                className="delete-btn"
                onClick={() => {
                  handleDelete(selectedNotification.id);
                }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>

              {!selectedNotification.read && (
                <button
                  className="mark-read-btn"
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    // locally update selectedNotification.read too so the dot disappears if you reopen
                    setSelectedNotification((prev) =>
                      prev ? { ...prev, read: true } : prev
                    );
                  }}
                >
                  Mark as Read
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

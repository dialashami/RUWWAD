import React, { useState, useEffect } from 'react';
import '../styles/Notifications.css';

function Notifications({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch sent notifications from backend
  const fetchSentNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/sent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Transform backend data to match frontend format
        const formattedNotifications = data.map(n => ({
          id: n._id,
          title: n.title,
          content: n.body,
          type: n.type,
          date: new Date(n.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: n.status,
          recipientCount: n.recipientCount
        }));
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Error fetching sent notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchSentNotifications();
  }, []);

  // قوالب سريعة
  const quickTemplates = [
    {
      id: 1,
      title: 'Assignment Reminder',
      content: 'This is a reminder that your assignment is due soon. Please submit it on time.',
      type: 'reminder'
    },
    {
      id: 2,
      title: 'Class Cancellation',
      content: 'Your class has been cancelled. You will be notified of the rescheduled time.',
      type: 'cancellation'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setMessage(template.content);
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      alert('Please enter a message or select a template');
      return;
    }

    // If Assignment Reminder template is selected, send to students with assignments due tomorrow
    if (selectedTemplate && selectedTemplate.type === 'reminder') {
      setSending(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in to send notifications');
          setSending(false);
          return;
        }

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/assignment-reminder`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ customMessage: message }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to send reminders');
        }

        const newNotification = {
          id: Date.now(),
          title: 'Assignment Reminder',
          content: message,
          type: 'reminder',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'sent',
          studentsNotified: data.studentsNotified,
          assignments: data.assignmentsDueTomorrow
        };

        setNotifications([newNotification, ...notifications]);
        setMessage('');
        setSelectedTemplate(null);

        if (data.notificationsSent === 0) {
          alert('No assignments due tomorrow. No students were notified.');
        } else {
          alert(`Assignment reminder sent successfully!\n\nStudents notified: ${data.studentsNotified}\nAssignments due tomorrow: ${data.assignmentsDueTomorrow?.map(a => a.title).join(', ') || 'None'}`);
        }
      } catch (err) {
        console.error('Error sending assignment reminder:', err);
        alert('Failed to send assignment reminder: ' + err.message);
      } finally {
        setSending(false);
      }
      return;
    }

    // For other templates or custom messages, save to backend
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to send notifications');
        setSending(false);
        return;
      }

      const notificationData = {
        title: selectedTemplate ? selectedTemplate.title : 'Custom Message',
        body: message,
        type: selectedTemplate ? selectedTemplate.type : 'custom',
        status: 'sent'
      };

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/sent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!res.ok) {
        throw new Error('Failed to save notification');
      }

      const savedNotification = await res.json();

      const newNotification = {
        id: savedNotification._id,
        title: savedNotification.title,
        content: savedNotification.body,
        type: savedNotification.type,
        date: new Date(savedNotification.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: savedNotification.status
      };

      setNotifications([newNotification, ...notifications]);
      setMessage('');
      setSelectedTemplate(null);
      alert('Notification sent successfully!');
    } catch (err) {
      console.error('Error saving notification:', err);
      alert('Failed to save notification: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleScheduleNotification = () => {
    if (!message.trim()) {
      alert('Please enter a message or select a template');
      return;
    }

    const newNotification = {
      id: Date.now(),
      title: selectedTemplate ? selectedTemplate.title : 'Custom Message',
      content: message,
      type: selectedTemplate ? selectedTemplate.type : 'custom',
      date: 'Scheduled for tomorrow',
      status: 'scheduled'
    };

    setNotifications([newNotification, ...notifications]);
    setMessage('');
    setSelectedTemplate(null);
    alert('Notification scheduled successfully!');
  };

  return (
    <div className="notifications-container">
      <div className="notifications-main-content">
        <div className="content-container">
          {/* الرأس */}
          <div className="notifications-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Notifications & Messages</h1>
                <p>Send reminders, announcements, and feedback to students</p>
              </div>
            </div>
          </div>

          {/* التبويبات */}
          <div className="notifications-tabs">
            <button 
              className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              Quick Templates
            </button>
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Notifications
            </button>
          </div>

          {/* محتوى التبويبات */}
          <div className="tab-content">
            {activeTab === 'templates' ? (
              <div className="templates-section">
                <h3>Quick Templates</h3>
                <div className="templates-grid">
                  {quickTemplates.map(template => (
                    <div 
                      key={template.id}
                      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-icon">
                        <i className={`fas ${
                          template.type === 'reminder' ? 'fa-bell' : 'fa-calendar-times'
                        }`}></i>
                      </div>
                      <div className="template-content">
                        <h4>{template.title}</h4>
                        <p>{template.content}</p>
                      </div>
                      <div className="template-check">
                        <i className="fas fa-check"></i>
                      </div>
                    </div>
                  ))}
                </div>

                {/* محرر الرسالة */}
                <div className="message-editor">
                  <h4>Compose Message</h4>
                  <textarea
                    className="message-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here or select a template above..."
                    rows="6"
                  ></textarea>
                  
                  <div className="message-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setMessage('');
                        setSelectedTemplate(null);
                      }}
                    >
                      Clear
                    </button>
                    <button 
                      className="btn btn-schedule"
                      onClick={handleScheduleNotification}
                    >
                      <i className="fas fa-clock"></i>
                      Schedule
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSendNotification}
                      disabled={sending}
                    >
                      <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                      {sending ? 'Sending...' : 'Send Now'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="notifications-list-section">
                <div className="notifications-tabs-secondary">
                  <button className="tab-secondary active">Sent</button>
                  <button className="tab-secondary">Scheduled</button>
                </div>

                <div className="notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-icon">
                          <i className={`fas ${
                            notification.type === 'reminder' ? 'fa-bell' : 
                            notification.type === 'cancellation' ? 'fa-calendar-times' : 
                            'fa-envelope'
                          }`}></i>
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.content}</p>
                          <span className="notification-date">{notification.date}</span>
                        </div>
                        <div className={`notification-status ${notification.status}`}>
                          {notification.status === 'sent' ? (
                            <i className="fas fa-check-circle"></i>
                          ) : (
                            <i className="fas fa-clock"></i>
                          )}
                          {notification.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-bell-slash"></i>
                      <h3>No notifications yet</h3>
                      <p>Send your first notification using the quick templates</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
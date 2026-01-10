import { useState, useEffect } from 'react';
import {
  Search,
  Send,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Users,
  X,
  Save,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { API_CONFIG } from '../../../config/api.config';

const API_BASE = API_CONFIG.BASE_URL + '/api';

// NOTE: This modal is currently unused for creation/editing, but kept for potential future use.
export function NotificationModal({ notification, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    status: 'draft',
    scheduledFor: '',
    recipients: 0,
  });

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title || '',
        message: notification.message || '',
        type: notification.type || 'info',
        target: notification.target || 'all',
        status: notification.status || 'draft',
        scheduledFor: notification.scheduledFor || '',
        recipients: notification.recipients || 0,
      });
    }
  }, [notification]);

  const calculateRecipients = (target) => {
    const counts = {
      all: 3500,
      students: 1250,
      teachers: 156,
      parents: 890,
      custom: 0,
    };
    return counts[target] || 0;
  };

  const handleTargetChange = (target) => {
    setFormData((prev) => ({
      ...prev,
      target,
      recipients: calculateRecipients(target),
    }));
  };

  const handleSubmit = (status) => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (status === 'scheduled' && !formData.scheduledFor) {
      alert('Please select a date and time for scheduled notifications');
      return;
    }

    const data = {
      ...formData,
      status,
      recipients: formData.recipients || calculateRecipients(formData.target),
    };

    if (status === 'sent') {
      data.sentAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-gray-900">
            {notification ? 'Notification Details' : 'Notification'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Title</p>
            <p className="text-gray-900 mt-1">{formData.title}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Message</p>
            <p className="text-gray-800 mt-1 whitespace-pre-wrap">
              {formData.message || 'No message provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="text-gray-800 mt-1 capitalize">{formData.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Target</p>
              <p className="text-gray-800 mt-1 capitalize">{formData.target}</p>
            </div>
          </div>

          {formData.scheduledFor && (
            <div>
              <p className="text-sm font-medium text-gray-500">Scheduled For</p>
              <p className="text-gray-800 mt-1">{formData.scheduledFor}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Recipients (estimated)</p>
            <p className="text-gray-800 mt-1">
              {formData.recipients?.toLocaleString?.() || 0}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationPanel({ notifications, onClose, onRemove }) {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mt-16 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 text-gray-300 mx-auto mb-3 flex items-center justify-center">
                <Info className="w-8 h-8" />
              </div>
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.unread
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColor(
                          notification.type
                        )}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-gray-900">{notification.title}</h4>
                          <button
                            onClick={() => onRemove(notification.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationManagement({ onUnreadCountChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTarget, setFilterTarget] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminNotifications = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        setError('No authentication token found. Please log in as admin.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/notifications/admin`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.message || `Failed to fetch admin notifications (${res.status})`
          );
        }

        const data = await res.json();
        console.log('[NotificationManagement] Received data from API:', data);
        console.log('[NotificationManagement] Data is array?', Array.isArray(data), 'Length:', data?.length);

        const mapped = Array.isArray(data)
          ? data.map((n) => ({
              id: n._id,
              title: n.title,
              message: n.message || n.body || '',
              type: n.type || 'other',
              isRead: n.isRead || false,
              createdAt: n.createdAt,
            }))
          : [];

        console.log('[NotificationManagement] Mapped notifications:', mapped.length, 'items');
        console.log('[NotificationManagement] Sample notifications:', mapped.slice(0, 3));
        setNotifications(mapped);
      } catch (err) {
        console.error('Error fetching admin notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as admin to update notifications.');
      return;
    }

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Failed to mark notification as read (${res.status})`
        );
      }

      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert('Failed to mark notification as read.');
    }
  };

  const handleViewDetails = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as admin to delete notifications.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || `Failed to delete notification (${res.status})`
        );
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));

      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification.');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as admin to update notifications.');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Delete ${selectedIds.length} selected notifications?`)) {
        return;
      }

      try {
        for (const id of selectedIds) {
          const res = await fetch(`${API_BASE}/notifications/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            console.error('Failed to delete notification', id, res.status);
          }
        }

        setNotifications((prev) =>
          prev.filter((n) => !selectedIds.includes(n.id))
        );
        setSelectedIds([]);

        if (onUnreadCountChange) {
          onUnreadCountChange();
        }
      } catch (err) {
        console.error('Error deleting notifications:', err);
        alert('Failed to delete some notifications.');
      }
    } else if (action === 'markRead') {
      if (!window.confirm(`Mark ${selectedIds.length} selected notifications as read?`)) {
        return;
      }

      try {
        for (const id of selectedIds) {
          const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            console.error('Failed to mark notification as read', id, res.status);
          }
        }

        setNotifications((prev) =>
          prev.map((n) =>
            selectedIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
        setSelectedIds([]);

        if (onUnreadCountChange) {
          onUnreadCountChange();
        }
      } catch (err) {
        console.error('Error marking notifications as read:', err);
        alert('Failed to mark some notifications as read.');
      }
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (notification.title || '').toLowerCase().includes(q) ||
      (notification.message || '').toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !notification.isRead) ||
      (filterStatus === 'read' && notification.isRead);

    const matchesTarget =
      filterTarget === 'all' || notification.type === filterTarget;

    return matchesSearch && matchesStatus && matchesTarget;
  });

  console.log('[NotificationManagement] Total notifications:', notifications.length);
  console.log('[NotificationManagement] After filtering:', filteredNotifications.length);
  console.log('[NotificationManagement] Current filters - Status:', filterStatus, 'Type:', filterTarget, 'Search:', searchQuery);

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredNotifications.length &&
      filteredNotifications.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getStatusColor = (isRead) => {
    if (isRead) {
      return 'text-gray-700 bg-gray-50';
    }
    return 'text-blue-700 bg-blue-50';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Notification Management</h1>
          <p className="text-gray-600">
            View and manage admin notifications and system alerts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="message">Messages</option>
              <option value="assignment">Assignments</option>
              <option value="course">Courses</option>
              <option value="enrollment">Enrollments</option>
              <option value="relationship">Relationships</option>
              <option value="system">System</option>
              <option value="grade">Grades</option>
              <option value="other">Other</option>
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-900">{selectedIds.length} selected</p>
              <button
                onClick={() => handleBulkAction('markRead')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Mark as Read
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600">
            {loading
              ? 'Loading notifications...'
              : `Showing ${filteredNotifications.length} of ${notifications.length} notifications`}
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={
                        filteredNotifications.length > 0 &&
                        selectedIds.length === filteredNotifications.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700">
                        <Users className="w-3 h-3" />
                        {notification.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                          notification.isRead
                        )}`}
                      >
                        {notification.isRead ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(notification)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Info className="w-4 h-4 text-gray-600" />
                        </button>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredNotifications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-gray-500 text-sm"
                    >
                      {loading
                        ? 'Loading notifications...'
                        : 'No notifications match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onSave={() => {}}
        />
      )}
    </div>
  );
}

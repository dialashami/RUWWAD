import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parentDashboardAPI, notificationAPI, messageAPI } from '../services/api';

// Create context
const ParentContext = createContext(null);

// Custom hook to use parent context
export const useParent = () => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};

// Provider component
export const ParentProvider = ({ children: providerChildren }) => {
  // Parent profile state
  const [parent, setParent] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: 'parent',
    profilePicture: null,
  });

  // Stats state
  const [stats, setStats] = useState({
    totalChildren: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  });

  // Children state (linked students)
  const [children, setChildren] = useState([]);

  // Children data (dashboard data for each child)
  const [childrenData, setChildrenData] = useState({});

  // Selected child
  const [selectedChild, setSelectedChild] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function - Get initials
  const getInitials = useCallback(() => {
    const first = parent.firstName?.charAt(0) || '';
    const last = parent.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'P';
  }, [parent.firstName, parent.lastName]);

  // Helper function - Get full name
  const getFullName = useCallback(() => {
    const name = `${parent.firstName || ''} ${parent.lastName || ''}`.trim();
    return name || 'Parent';
  }, [parent.firstName, parent.lastName]);

  // Helper function - Get children names
  const getChildrenNames = useCallback(() => {
    if (children.length === 0) return 'No children linked';
    return children.map(c => `${c.firstName} ${c.lastName}`).join(', ');
  }, [children]);

  // Load parent data from storage and API
  const loadParentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from AsyncStorage first
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setParent(prev => ({
          ...prev,
          id: userData._id || userData.id || prev.id,
          firstName: userData.firstName || prev.firstName,
          lastName: userData.lastName || prev.lastName,
          email: userData.email || prev.email,
          role: userData.role || 'parent',
          profilePicture: userData.profilePicture || null,
        }));
      }

      // Fetch linked children
      try {
        const childrenRes = await parentDashboardAPI.getChildren();
        const childrenList = Array.isArray(childrenRes.data) ? childrenRes.data : [];
        setChildren(childrenList);
        setStats(prev => ({ ...prev, totalChildren: childrenList.length }));

        // Fetch dashboard data for each child
        const dashboardData = {};
        if (childrenList.length > 0) {
          for (let i = 0; i < childrenList.length; i++) {
            const child = childrenList[i];
            try {
              const dashRes = await parentDashboardAPI.getChildProgress(child._id);
              dashboardData[child._id] = dashRes.data;
            } catch (err) {
              console.log(`Error fetching dashboard for child ${child._id}:`, err);
            }
          }
        }
        setChildrenData(dashboardData);

        // Select first child by default
        if (childrenList.length > 0 && !selectedChild) {
          setSelectedChild(childrenList[0]._id);
        }
      } catch (err) {
        console.log('Children API error:', err);
      }

      // Fetch unread message count
      try {
        const msgRes = await messageAPI.getConversations();
        const conversations = msgRes.data || [];
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setStats(prev => ({ ...prev, unreadMessages: totalUnread }));
      } catch (err) {
        console.log('Messages count error:', err);
      }

      // Fetch unread notification count
      try {
        const notifRes = await notificationAPI.getUnreadCount();
        const count = notifRes.data?.count || 0;
        setStats(prev => ({ ...prev, unreadNotifications: count }));
      } catch (err) {
        // Fallback to counting from notifications list
        try {
          const notifListRes = await notificationAPI.getNotifications();
          const notifications = notifListRes.data?.notifications || notifListRes.data || [];
          const unreadCount = notifications.filter(n => !n.isRead).length;
          setStats(prev => ({ ...prev, unreadNotifications: unreadCount }));
        } catch (e) {
          console.log('Notification count error:', e);
        }
      }

    } catch (err) {
      console.error('Error loading parent data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedChild]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadParentData();
  }, [loadParentData]);

  // Select a child
  const selectChild = useCallback((childId) => {
    setSelectedChild(childId);
  }, []);

  // Get current child data
  const getCurrentChildData = useCallback(() => {
    if (!selectedChild) return null;
    return childrenData[selectedChild] || null;
  }, [selectedChild, childrenData]);

  // Get current child
  const getCurrentChild = useCallback(() => {
    if (!selectedChild) return null;
    return children.find(c => c._id === selectedChild) || null;
  }, [selectedChild, children]);

  // Update unread messages count
  const updateUnreadMessages = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadMessages: count }));
  }, []);

  // Decrement unread messages
  const decrementUnreadMessages = useCallback((count = 1) => {
    setStats(prev => ({
      ...prev,
      unreadMessages: Math.max(0, prev.unreadMessages - count),
    }));
  }, []);

  // Update unread notifications count
  const updateUnreadNotifications = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadNotifications: count }));
  }, []);

  // Decrement unread notifications
  const decrementUnreadNotifications = useCallback((count = 1) => {
    setStats(prev => ({
      ...prev,
      unreadNotifications: Math.max(0, prev.unreadNotifications - count),
    }));
  }, []);

  // Load data on mount
  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  // Context value
  const value = {
    // State
    parent,
    stats,
    children,
    childrenData,
    selectedChild,
    loading,
    error,

    // Helper functions
    getInitials,
    getFullName,
    getChildrenNames,
    getCurrentChild,
    getCurrentChildData,

    // Actions
    refreshData,
    selectChild,
    updateUnreadMessages,
    decrementUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadNotifications,
  };

  return (
    <ParentContext.Provider value={value}>
      {providerChildren}
    </ParentContext.Provider>
  );
};

export default ParentContext;

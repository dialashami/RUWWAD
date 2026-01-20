import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { teacherDashboardAPI, notificationAPI, messageAPI, courseAPI, assignmentAPI } from '../services/api';

// Create context
const TeacherContext = createContext(null);

// Custom hook to use teacher context
export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
};

// Provider component
export const TeacherProvider = ({ children }) => {
  // Teacher profile state
  const [teacher, setTeacher] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher',
    profilePicture: null,
    specialization: '',
  });

  // Stats state
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    activityRate: 0,
  });

  // Courses state
  const [courses, setCourses] = useState([]);

  // Assignments state
  const [assignments, setAssignments] = useState([]);

  // Recent activities
  const [recentActivities, setRecentActivities] = useState([]);

  // Upcoming lessons
  const [upcomingLessons, setUpcomingLessons] = useState([]);

  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function - Get initials
  const getInitials = useCallback(() => {
    const first = teacher.firstName?.charAt(0) || '';
    const last = teacher.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'T';
  }, [teacher.firstName, teacher.lastName]);

  // Helper function - Get full name
  const getFullName = useCallback(() => {
    const name = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    return name || 'Teacher';
  }, [teacher.firstName, teacher.lastName]);

  // Helper function - Get specialization display
  const getSpecializationDisplay = useCallback(() => {
    return teacher.specialization || 'Educator';
  }, [teacher.specialization]);

  // Load teacher data from storage and API
  const loadTeacherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from AsyncStorage first
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setTeacher(prev => ({
          ...prev,
          id: userData._id || userData.id || prev.id,
          firstName: userData.firstName || prev.firstName,
          lastName: userData.lastName || prev.lastName,
          email: userData.email || prev.email,
          role: userData.role || 'teacher',
          profilePicture: userData.profilePicture || null,
          specialization: userData.specialization || userData.subject || '',
        }));
      }

      // Fetch dashboard data from API
      try {
        const dashboardRes = await teacherDashboardAPI.getDashboard();
        const data = dashboardRes.data;

        if (data) {
          // Update stats
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              totalStudents: data.stats.totalStudents || 0,
              activeCourses: data.stats.activeCourses || 0,
              totalAssignments: data.stats.totalAssignments || 0,
              pendingSubmissions: data.stats.pendingSubmissions || 0,
              activityRate: data.stats.activityRate || 0,
              unreadMessages: data.stats.unreadMessages || prev.unreadMessages,
            }));
          }

          // Update courses
          if (data.courses && data.courses.length > 0) {
            setCourses(data.courses.map(c => ({
              _id: c._id,
              id: c._id,
              title: c.title || 'Untitled Course',
              subject: c.subject || 'Course',
              grade: c.grade || 'All Grades',
              students: Array.isArray(c.students) ? c.students.length : 0,
              description: c.description || '',
              isActive: c.isActive !== false,
            })));
          }

          // Update recent activities
          if (data.recentActivities && data.recentActivities.length > 0) {
            setRecentActivities(data.recentActivities.map((a, i) => ({
              id: a.id || i,
              type: a.type || 'activity',
              title: a.title || 'Activity',
              createdAt: a.createdAt,
            })));
          }

          // Update upcoming lessons
          if (data.upcomingLessons && data.upcomingLessons.length > 0) {
            setUpcomingLessons(data.upcomingLessons.map((l, i) => ({
              id: l.id || i,
              title: l.title || 'Lesson',
              time: l.time || 'Scheduled',
              grade: l.grade || 'All Grades',
              room: l.room || 'TBD',
            })));
          }

          // Update weekly stats
          if (data.weeklyStats && data.weeklyStats.length > 0) {
            setWeeklyStats(data.weeklyStats);
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to fetch dashboard';
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        if (isTimeout) {
          console.log('Dashboard API timeout - using cached data:', err.message);
        } else {
          console.log('Dashboard API error:', errorMsg);
        }
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

      // Fetch assignments
      try {
        const assignRes = await assignmentAPI.getTeacherAssignments();
        const assignData = assignRes.data || [];
        setAssignments(assignData.map(a => ({
          _id: a._id,
          id: a._id,
          title: a.title || 'Untitled Assignment',
          subject: a.subject || a.course?.title || 'Course',
          dueDate: a.dueDate,
          status: a.status || 'active',
          submissions: a.submissions?.length || 0,
        })));
      } catch (err) {
        const errorMsg = err.message || 'Failed to fetch assignments';
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        if (isTimeout) {
          console.log('Assignments API timeout - using cached data:', err.message);
        } else {
          console.log('Assignments error:', errorMsg);
        }
      }

    } catch (err) {
      console.error('Error loading teacher data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadTeacherData();
  }, [loadTeacherData]);

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
    loadTeacherData();
  }, [loadTeacherData]);

  // Context value
  const value = {
    // State
    teacher,
    stats,
    courses,
    assignments,
    recentActivities,
    upcomingLessons,
    weeklyStats,
    loading,
    error,

    // Helper functions
    getInitials,
    getFullName,
    getSpecializationDisplay,

    // Actions
    refreshData,
    updateUnreadMessages,
    decrementUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadNotifications,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export default TeacherContext;

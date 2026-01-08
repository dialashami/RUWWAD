import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { studentDashboardAPI, notificationAPI, messageAPI, courseAPI, assignmentAPI } from '../services/api';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Student profile info
  const [student, setStudent] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    grade: '',
    universityMajor: '',
    studentType: 'school',
    profilePicture: null,
    bio: '',
  });

  // Dashboard stats
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    overdueAssignments: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  });

  // Progress data
  const [progress, setProgress] = useState({
    overallProgress: 0,
    subjectProgress: [],
    weeklyActivity: [],
    achievements: [],
    lessonsCompleted: 0,
    quizzesPassed: 0,
    totalAchievements: 0,
  });

  // Courses and assignments
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get initials for avatar
  const getInitials = useCallback(() => {
    const first = student.firstName?.[0] || '';
    const last = student.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'ST';
  }, [student.firstName, student.lastName]);

  // Get full name
  const getFullName = useCallback(() => {
    return `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  }, [student.firstName, student.lastName]);

  // Get grade display text
  const getGradeDisplay = useCallback(() => {
    if (student.studentType === 'university') {
      return student.universityMajor || 'University Student';
    }
    const gradeNum = student.grade?.replace(/\D/g, '');
    return gradeNum ? `Grade ${gradeNum}` : 'Student';
  }, [student.grade, student.studentType, student.universityMajor]);

  // Load student data from AsyncStorage and backend
  const loadStudentData = useCallback(async () => {
    // Check if token exists before making API calls
    const token = await AsyncStorage.getItem('token');
    if (!token || !isMountedRef.current) {
      return; // User logged out or component unmounted
    }

    setLoading(true);
    setError(null);

    try {
      // First, load from AsyncStorage
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        let gradeValue = '';
        if (parsed.studentType === 'university') {
          gradeValue = 'University';
        } else if (parsed.schoolGrade) {
          gradeValue = parsed.schoolGrade.replace(/\D/g, '');
        }
        
        setStudent({
          id: parsed._id || parsed.id || null,
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          grade: gradeValue,
          universityMajor: parsed.universityMajor || '',
          studentType: parsed.studentType || 'school',
          profilePicture: parsed.profilePicture || null,
          bio: parsed.bio || '',
        });
      }

      // Verify token still exists (user might have logged out)
      const currentToken = await AsyncStorage.getItem('token');
      if (!currentToken || !isMountedRef.current) {
        setLoading(false);
        return;
      }

      // Fetch dashboard data
      try {
        const dashboardRes = await studentDashboardAPI.getDashboard();
        const data = dashboardRes.data;

        if (data.stats) {
          setStats(prev => ({ ...prev, ...data.stats }));
        }
        if (data.courses) {
          setCourses(data.courses);
        }
        if (data.assignments) {
          setAssignments(data.assignments);
        }
        if (data.todaySchedule) {
          setTodaySchedule(data.todaySchedule);
        }
        if (data.recentActivities) {
          setRecentActivities(data.recentActivities);
        }
      } catch (dashErr) {
        console.log('Dashboard fetch error:', dashErr);
      }

      // Fetch unread notification count
      try {
        const notifRes = await notificationAPI.getNotifications();
        const notifications = notifRes.data?.notifications || notifRes.data || [];
        const unreadNotifs = notifications.filter(n => !n.isRead).length;
        setStats(prev => ({ ...prev, unreadNotifications: unreadNotifs }));
      } catch (notifErr) {
        console.log('Notification count error:', notifErr);
      }

      // Fetch unread message count
      try {
        const msgRes = await messageAPI.getConversations();
        const conversations = msgRes.data || [];
        const unreadMsgs = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setStats(prev => ({ ...prev, unreadMessages: unreadMsgs }));
      } catch (msgErr) {
        console.log('Message count error:', msgErr);
      }

    } catch (err) {
      console.error('Error loading student data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load progress data
  const loadProgressData = useCallback(async () => {
    // Check if token exists before making API calls
    const token = await AsyncStorage.getItem('token');
    if (!token || !isMountedRef.current) {
      return; // User logged out or component unmounted
    }

    try {
      const progressRes = await studentDashboardAPI.getProgress();
      if (!isMountedRef.current) return; // Check again after async call
      
      const data = progressRes.data;
      if (data) {
        setProgress(data);
      }
    } catch (err) {
      // Only log errors if still mounted and not a 401 (logout)
      if (isMountedRef.current && err.response?.status !== 401) {
        console.log('Progress data error:', err);
        // Fallback to calculated progress
        calculateProgressFromData();
      }
    }
  }, []);

  // Calculate progress from available data
  const calculateProgressFromData = useCallback(() => {
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.isCompleted || a.status === 'completed').length;

    const overallProgress = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100) 
      : 0;

    // Group by subject/course
    const subjectMap = {};
    courses.forEach(course => {
      const subject = course.subject || course.title || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          name: subject,
          progress: 0,
          lessons: 0,
          quizzes: 0,
          grade: '-',
          colorClass: getSubjectColorClass(subject),
        };
      }
      subjectMap[subject].lessons += course.lessons?.length || 1;
    });

    const subjectProgress = Object.values(subjectMap);

    setProgress(prev => ({
      ...prev,
      overallProgress,
      subjectProgress,
      lessonsCompleted: completedAssignments,
    }));
  }, [assignments, courses]);

  // Helper to get color for subject
  const getSubjectColorClass = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return '#3b82f6';
    if (subjectLower.includes('phys')) return '#8b5cf6';
    if (subjectLower.includes('chem')) return '#10b981';
    if (subjectLower.includes('bio')) return '#22c55e';
    if (subjectLower.includes('eng')) return '#f59e0b';
    return '#6b7280';
  };

  // Update unread counts
  const updateUnreadMessages = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadMessages: count }));
  }, []);

  const updateUnreadNotifications = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadNotifications: count }));
  }, []);

  const decrementUnreadMessages = useCallback((count = 1) => {
    setStats(prev => ({ ...prev, unreadMessages: Math.max(0, prev.unreadMessages - count) }));
  }, []);

  const decrementUnreadNotifications = useCallback((count = 1) => {
    setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - count) }));
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([loadStudentData(), loadProgressData()]);
  }, [loadStudentData, loadProgressData]);

  // Load data on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    loadStudentData();
    loadProgressData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const contextValue = {
    // Student data
    student,
    setStudent,
    getInitials,
    getFullName,
    getGradeDisplay,
    
    // Stats
    stats,
    setStats,
    updateUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadMessages,
    decrementUnreadNotifications,
    
    // Progress
    progress,
    setProgress,
    
    // Data
    courses,
    setCourses,
    assignments,
    setAssignments,
    todaySchedule,
    setTodaySchedule,
    recentActivities,
    setRecentActivities,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshData,
    loadStudentData,
    loadProgressData,
  };

  return (
    <StudentContext.Provider value={contextValue}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

export default StudentContext;

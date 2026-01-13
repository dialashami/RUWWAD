import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
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
      return student.grade || 'University Student';
    }
    const gradeNum = student.grade?.replace(/\D/g, '');
    return gradeNum ? `Grade ${gradeNum}` : 'Student';
  }, [student.grade, student.studentType]);

  // Load student data from localStorage and backend
  const loadStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, load from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Determine grade display value
        let gradeValue = '';
        if (parsed.studentType === 'university') {
          gradeValue = 'University';
        } else if (parsed.schoolGrade) {
          // Convert "grade10" to "10" for display
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

      // Then fetch from backend for latest data
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/student/dashboard`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch student data');
      }

      const data = await res.json();

      // Update stats
      if (data.stats) {
        setStats(data.stats);
      }

      // Fetch unread notification count from backend
      try {
        const notifRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/notifications/unread-count`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setStats(prev => ({ ...prev, unreadNotifications: notifData.count || 0 }));
        }
      } catch (notifErr) {
        console.error('Error fetching notification count:', notifErr);
      }

      // Update courses
      if (data.courses) {
        setCourses(data.courses);
      }

      // Update assignments
      if (data.assignments) {
        setAssignments(data.assignments);
      }

      // Update today's schedule
      if (data.todaySchedule) {
        setTodaySchedule(data.todaySchedule);
      }

      // Update recent activities
      if (data.recentActivities) {
        setRecentActivities(data.recentActivities);
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
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/student/progress`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // If endpoint doesn't exist, use calculated progress from assignments
        calculateProgressFromData();
        return;
      }

      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error('Error loading progress data:', err);
      // Fallback to calculated progress
      calculateProgressFromData();
    }
  }, []);

  // Calculate progress from available data
  const calculateProgressFromData = useCallback(() => {
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return false;
      const userId = JSON.parse(storedUser)._id || JSON.parse(storedUser).id;
      return a.submissions?.some(s => s.student?.toString() === userId);
    }).length;

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
          trend: '+0%',
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
      quizzesPassed: Math.floor(completedAssignments * 0.8),
    }));
  }, [assignments, courses]);

  // Helper to get color class for subject
  const getSubjectColorClass = (subject) => {
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return 'subj-math';
    if (subjectLower.includes('phys')) return 'subj-phys';
    if (subjectLower.includes('chem')) return 'subj-chem';
    if (subjectLower.includes('bio')) return 'subj-bio';
    if (subjectLower.includes('eng')) return 'subj-eng';
    return 'subj-default';
  };

  // Update student profile (local state + localStorage only)
  const updateStudent = useCallback((updates) => {
    setStudent(prev => ({ ...prev, ...updates }));
    
    // Also update localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const updated = { ...parsed, ...updates };
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save student profile to backend (persists changes)
  const saveStudentProfile = useCallback(async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save profile');
      }

      const savedData = await res.json();
      
      // Update local state with saved data
      const gradeValue = savedData.studentType === 'university' 
        ? 'University' 
        : (savedData.schoolGrade?.replace(/\D/g, '') || '');
      
      const updatedStudent = {
        id: savedData._id || savedData.id,
        firstName: savedData.firstName || '',
        lastName: savedData.lastName || '',
        email: savedData.email || '',
        grade: gradeValue,
        universityMajor: savedData.universityMajor || '',
        studentType: savedData.studentType || 'school',
        profilePicture: savedData.profilePicture || null,
        bio: savedData.bio || '',
        phone: savedData.phone || '',
      };
      
      setStudent(updatedStudent);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(savedData));
      
      return { success: true, data: savedData };
    } catch (err) {
      console.error('Error saving student profile:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update unread messages count
  const updateUnreadMessages = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadMessages: count }));
  }, []);

  // Decrement unread messages count
  const decrementUnreadMessages = useCallback((amount = 1) => {
    setStats(prev => ({ 
      ...prev, 
      unreadMessages: Math.max(0, prev.unreadMessages - amount) 
    }));
  }, []);

  // Update unread notifications count
  const updateUnreadNotifications = useCallback((count) => {
    setStats(prev => ({ ...prev, unreadNotifications: count }));
  }, []);

  // Decrement unread notifications count
  const decrementUnreadNotifications = useCallback((amount = 1) => {
    setStats(prev => ({ 
      ...prev, 
      unreadNotifications: Math.max(0, prev.unreadNotifications - amount) 
    }));
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadStudentData();
    await loadProgressData();
  }, [loadStudentData, loadProgressData]);

  // Load data on mount
  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Load progress after initial data
  useEffect(() => {
    if (!loading && courses.length > 0) {
      loadProgressData();
    }
  }, [loading, courses.length, loadProgressData]);

  const value = {
    // Student info
    student,
    updateStudent,
    getInitials,
    getFullName,
    getGradeDisplay,

    // Stats
    stats,

    // Progress
    progress,

    // Data
    courses,
    assignments,
    todaySchedule,
    recentActivities,

    // State
    loading,
    error,

    // Actions
    refreshData,
    loadStudentData,
    loadProgressData,
    saveStudentProfile,
    updateUnreadMessages,
    decrementUnreadMessages,
    updateUnreadNotifications,
    decrementUnreadNotifications,
  };

  return (
    <StudentContext.Provider value={value}>
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

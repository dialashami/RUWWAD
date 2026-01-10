import React, { useEffect, useState } from 'react';
import '../styles/dashboard.css';
import { 
  FaUsers, 
  FaBook, 
  FaClipboardList, 
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaBell,
  FaCalendarAlt
} from 'react-icons/fa';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('Teacher');
  
  // Stats - will be updated with real data
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    totalAssignments: 0,
    activityRate: 0,
    pendingSubmissions: 0,
    unreadMessages: 0,
  });
  
  // Courses - will be updated with real data
  const [courses, setCourses] = useState([]);
  
  // Recent activities - will be updated with real data
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Upcoming lessons - will be updated with real data
  const [upcomingLessons, setUpcomingLessons] = useState([]);

  // Weekly stats - will be updated with real data
  const [weeklyStats, setWeeklyStats] = useState([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]);

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Get teacher name from localStorage
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.firstName || parsed?.lastName) {
            setTeacherName(`${parsed.firstName || ''} ${parsed.lastName || ''}`.trim());
          }
        }
      } catch {
        // keep default
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch teacher dashboard data
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/teacher/dashboard`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          
          // Update stats with real data
          if (data.stats) {
            setStats({
              totalStudents: data.stats.totalStudents || 0,
              activeCourses: data.stats.activeCourses || 0,
              totalAssignments: data.stats.totalAssignments || 0,
              activityRate: data.stats.activityRate || 0,
              pendingSubmissions: data.stats.pendingSubmissions || 0,
              unreadMessages: data.stats.unreadMessages || 0,
            });
          }

          // Update courses with real data
          if (data.courses && data.courses.length > 0) {
            setCourses(data.courses.map(c => ({
              _id: c._id,
              title: c.title || 'Untitled Course',
              subject: c.subject || 'Course',
              grade: c.grade || 'All Grades',
              students: Array.isArray(c.students) ? c.students.length : 0,
            })));
          }

          // Update recent activities with real data
          if (data.recentActivities && data.recentActivities.length > 0) {
            setRecentActivities(data.recentActivities.map((a, i) => ({
              id: a.id || i,
              type: a.type || 'activity',
              title: a.title || 'Activity',
              time: formatTimeAgo(a.createdAt),
              icon: a.type === 'submission' ? 'check' : a.type === 'message' ? 'message' : 'bell',
            })));
          }

          // Update upcoming lessons with real data
          if (data.upcomingLessons && data.upcomingLessons.length > 0) {
            setUpcomingLessons(data.upcomingLessons.map((l, i) => ({
              id: l.id || i,
              title: l.title || 'Lesson',
              time: l.time || 'Scheduled',
              grade: l.grade || 'All Grades',
              room: l.room || 'TBD',
            })));
          }

          // Update weekly stats with real data
          if (data.weeklyStats && data.weeklyStats.length > 0) {
            setWeeklyStats(data.weeklyStats.map((stat, i) => ({
              day: stat.day || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
              value: stat.value || 0,
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-main">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {teacherName}!</h1>
          <p>Here's an overview of your classes and students</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-change positive">+12% from last month</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <FaBook />
          </div>
          <div className="stat-content">
            <h3>Active Courses</h3>
            <div className="stat-number">{stats.activeCourses}</div>
            <div className="stat-change positive">+3 new this week</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>Assignments</h3>
            <div className="stat-number">{stats.totalAssignments}</div>
            <div className="stat-change">{stats.pendingSubmissions} pending review</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>Activity Rate</h3>
            <div className="stat-number">{stats.activityRate}%</div>
            <div className="stat-change positive">+5% this week</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Upcoming Lessons */}
        <div className="dashboard-card upcoming-lessons">
          <div className="card-header">
            <h3><FaCalendarAlt /> Upcoming Lessons</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="lessons-list">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="lesson-item">
                <div className="lesson-time-badge">
                  <FaClock />
                  <span>{lesson.time}</span>
                </div>
                <div className="lesson-details">
                  <h4>{lesson.title}</h4>
                  <p>{lesson.grade} • {lesson.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card recent-activity">
          <div className="card-header">
            <h3><FaBell /> Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.icon === 'check' ? <FaCheckCircle /> : <FaBell />}
                </div>
                <div className="activity-details">
                  <p className="activity-title">{activity.title}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Courses */}
        <div className="dashboard-card my-courses">
          <div className="card-header">
            <h3><FaBook /> My Courses</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="courses-grid">
            {courses.slice(0, 4).map((course) => (
              <div key={course._id} className="course-mini-card">
                <div className="course-color-bar" style={{ 
                  background: course.subject === 'Mathematics' ? '#667eea' :
                             course.subject === 'Physics' ? '#11998e' :
                             course.subject === 'Chemistry' ? '#eb3349' : '#4facfe'
                }}></div>
                <h4>{course.title}</h4>
                <p className="course-grade">{course.grade}</p>
                <div className="course-students">
                  <FaUsers /> {course.students || 0} students
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="dashboard-card weekly-overview">
          <div className="card-header">
            <h3><FaChartLine /> Weekly Overview</h3>
          </div>
          <div className="weekly-stats">
            {weeklyStats.map((stat, index) => (
              <div key={index} className="weekly-stat">
                <div className="weekly-bar" style={{ height: `${stat.value}%` }}></div>
                <span>{stat.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
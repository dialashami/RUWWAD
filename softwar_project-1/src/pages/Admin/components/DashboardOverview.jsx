import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, TrendingUp, TrendingDown, Activity, AlertCircle, AlertTriangle, Info, CheckCircle, MessageSquare, Bell, Star, FileText, UserPlus, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { API_CONFIG } from '../../../config/api.config';

const API_BASE = API_CONFIG.BASE_URL + '/api';

// StatsCard Component
function StatsCard({ title, value, change, trend, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    pink: 'bg-pink-50 text-pink-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    amber: 'bg-amber-50 text-amber-600',
    gold: 'bg-yellow-50 text-yellow-600',
    lime: 'bg-lime-50 text-lime-600',
  };

  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm">{change}</span>
        </div>
      </div>
      <h3 className="text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600">{title}</p>
    </div>
  );
}

// QuickStats Component
function QuickStats({ dashboardData }) {
  // Get actual user counts from database
  const totalStudents = dashboardData?.stats?.totalStudents || 0;
  const totalTeachers = dashboardData?.stats?.totalTeachers || 0;
  const totalParents = dashboardData?.stats?.totalParents || 0;
  const totalTrainees = dashboardData?.stats?.totalTrainees || 0;

  // Derive total users from non-admin roles only
  const totalUsers = totalStudents + totalTeachers + totalParents + totalTrainees;

  // If no data, show a message
  if (!dashboardData || totalUsers === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Weekly Engagement</h3>
        <p className="text-gray-500">No user data available. Add users to see engagement statistics.</p>
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const engagementData = days.map((day, index) => {
    // Weekdays have higher engagement, weekends lower
    const isWeekend = index >= 5;
    const baseMultiplier = isWeekend ? 0.6 : 0.85 + (index * 0.03);
    
    return {
      name: day,
      students: Math.round(totalStudents * baseMultiplier),
      teachers: Math.round(totalTeachers * baseMultiplier),
      parents: Math.round(totalParents * baseMultiplier),
    };
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-900">Weekly Engagement</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Students ({totalStudents})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Teachers ({totalTeachers})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Parents ({totalParents})</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={engagementData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip />
          <Line type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} />
          <Line type="monotone" dataKey="teachers" stroke="#9333ea" strokeWidth={2} />
          <Line type="monotone" dataKey="parents" stroke="#16a34a" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// AlertsPanel Component
function AlertsPanel({ dashboardData }) {
  // Generate dynamic alerts based on real data
  const alerts = [];
  
  // Alert for new users today
  const recentUsers = dashboardData?.recentUsers || [];
  const todayUsers = recentUsers.filter(u => {
    const created = new Date(u.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  });
  
  if (todayUsers.length > 0) {
    alerts.push({
      type: 'success',
      icon: CheckCircle,
      message: `${todayUsers.length} new user(s) registered today`,
      time: 'Today',
    });
  }
  
  // Alert for total courses
  if (dashboardData?.stats?.totalCourses > 0) {
    alerts.push({
      type: 'info',
      icon: Info,
      message: `${dashboardData.stats.totalCourses} courses available on platform`,
      time: 'Current',
    });
  }
  
  // Alert for feedback rating
  if (dashboardData?.stats?.avgRating > 0) {
    alerts.push({
      type: dashboardData.stats.avgRating >= 4 ? 'success' : 'warning',
      icon: dashboardData.stats.avgRating >= 4 ? CheckCircle : AlertTriangle,
      message: `Average feedback rating: ${dashboardData.stats.avgRating}/5`,
      time: 'Overall',
    });
  }
  
  // Alert for messages
  if (dashboardData?.stats?.totalMessages > 0) {
    alerts.push({
      type: 'info',
      icon: Info,
      message: `${dashboardData.stats.totalMessages} total messages in system`,
      time: 'All time',
    });
  }

  // Default alert if no data
  if (alerts.length === 0) {
    alerts.push({
      type: 'info',
      icon: Info,
      message: 'No alerts at this time',
      time: 'Now',
    });
  }

  const colorClasses = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColorClasses = {
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    success: 'text-green-600',
    error: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-gray-900 mb-4">System Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${colorClasses[alert.type]}`}
            >
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorClasses[alert.type]}`} />
                <div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs opacity-70 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ActivityFeed Component
function ActivityFeed({ dashboardData }) {
  // Format time helper
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

  // Transform recentActivities from API
  const recentActivities = dashboardData?.recentActivities || [];
  
  const iconMap = {
    new_user: UserPlus,
    feedback: Star,
    course: BookOpen,
    assignment: FileText,
    message: MessageSquare,
  };
  
  const colorMap = {
    new_user: 'blue',
    feedback: 'orange',
    course: 'purple',
    assignment: 'green',
    message: 'blue',
  };

  const activities = recentActivities.slice(0, 6).map((activity) => ({
    icon: iconMap[activity.type] || Users,
    color: colorMap[activity.type] || 'blue',
    title: activity.title,
    description: activity.description,
    time: formatTime(activity.createdAt),
  }));

  // Fallback if no activities
  if (activities.length === 0) {
    activities.push({
      icon: Info,
      color: 'blue',
      title: 'No recent activity',
      description: 'Activity will appear here as users interact with the platform',
      time: 'Now',
    });
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900">{activity.title}</p>
                <p className="text-gray-600 truncate">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) {
        setLoading(false);
        setError('No authentication token found. Please log in again.');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch dashboard (${res.status})`);
        }
        const data = await res.json();
        console.log('Dashboard data received:', data);
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num?.toString() || '0';
  };

  const formatChange = (change) => {
    if (change === 0) return '0%';
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  // Derive total users from non-admin roles for display
  const totalStudents = dashboardData?.stats?.totalStudents || 0;
  const totalTeachers = dashboardData?.stats?.totalTeachers || 0;
  const totalParents = dashboardData?.stats?.totalParents || 0;
  const totalTrainees = dashboardData?.stats?.totalTrainees || 0;
  const derivedTotalUsers = totalStudents + totalTeachers + totalParents + totalTrainees;

  const stats = dashboardData ? [
    {
      title: 'Total Users',
      value: formatNumber(derivedTotalUsers),
      change: formatChange(dashboardData.stats.userChange),
      trend: dashboardData.stats.userChange >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Students',
      value: formatNumber(dashboardData.stats.totalStudents),
      change: formatChange(dashboardData.stats.studentChange),
      trend: dashboardData.stats.studentChange >= 0 ? 'up' : 'down',
      icon: GraduationCap,
      color: 'green',
    },
    {
      title: 'Active Teachers',
      value: formatNumber(dashboardData.stats.totalTeachers),
      change: formatChange(dashboardData.stats.teacherChange),
      trend: dashboardData.stats.teacherChange >= 0 ? 'up' : 'down',
      icon: GraduationCap,
      color: 'purple',
    },
    {
      title: 'Parents',
      value: formatNumber(dashboardData.stats.totalParents),
      change: formatChange(dashboardData.stats.parentChange),
      trend: dashboardData.stats.parentChange >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'orange',
    },
  ] : [];

  

  if (loading) {
    return (
      <div className="p-8">
        <div className="welcome">
          <h1>Welcome</h1>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="welcome">
          <h1>Welcome</h1>
          <p className="text-red-500">Error: {error}</p>
          <p className="text-gray-500 mt-2">Make sure the backend server is running on port 3000.</p>
        </div>
      </div>
    );
  }

  // Fallback stats if API fails
  const fallbackStats = [
    { title: 'Total Users', value: '0', change: '0%', trend: 'up', icon: Users, color: 'blue' },
    { title: 'Active Students', value: '0', change: '0%', trend: 'up', icon: GraduationCap, color: 'green' },
    { title: 'Active Teachers', value: '0', change: '0%', trend: 'up', icon: GraduationCap, color: 'purple' },
    { title: 'Parents', value: '0', change: '0%', trend: 'up', icon: Users, color: 'orange' },
  ];

  const fallbackAdditionalStats = [
    { title: 'Total Courses', value: '0', change: '', trend: 'up', icon: BookOpen, color: 'indigo' },
    { title: 'Active Courses', value: '0', change: '', trend: 'up', icon: BookOpen, color: 'teal' },
    { title: 'Assignments', value: '0', change: '', trend: 'up', icon: FileText, color: 'pink' },
    { title: 'Messages', value: '0', change: '', trend: 'up', icon: MessageSquare, color: 'cyan' },
    { title: 'Notifications', value: '0', change: '', trend: 'up', icon: Bell, color: 'yellow' },
    { title: 'Feedbacks', value: '0', change: '', trend: 'up', icon: Star, color: 'amber' },
    { title: 'Avg Rating', value: 'N/A', change: '', trend: 'up', icon: Star, color: 'gold' },
    { title: 'Trainees', value: '0', change: '', trend: 'up', icon: GraduationCap, color: 'lime' },
  ];

  const displayStats = stats.length > 0 ? stats : fallbackStats;

  return (
    <div className="p-8">
      <div className="welcome">
        <h1>Welcome</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      {/* Primary Stats - Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {displayStats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <QuickStats dashboardData={dashboardData} />
        </div>
        <div>
          <AlertsPanel dashboardData={dashboardData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed dashboardData={dashboardData} />
      </div>
    </div>
  );

}
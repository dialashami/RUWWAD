import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { adminDashboardAPI } from '../../services/api';

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalTrainees: 0,
    totalCourses: 0,
    totalMessages: 0,
    avgRating: 0,
    activeUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminDashboardAPI.getDashboard();
      const data = response.data;

      if (data.stats) {
        setStats(data.stats);
      }
      if (data.recentUsers) {
        setRecentUsers(data.recentUsers);
      }

      // Generate alerts
      const generatedAlerts = [];
      if (data.recentUsers?.length > 0) {
        const todayUsers = data.recentUsers.filter(u => {
          const created = new Date(u.createdAt);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        });
        if (todayUsers.length > 0) {
          generatedAlerts.push({
            type: 'success',
            message: `${todayUsers.length} new user(s) registered today`,
          });
        }
      }
      if (data.stats?.totalCourses > 0) {
        generatedAlerts.push({
          type: 'info',
          message: `${data.stats.totalCourses} courses available`,
        });
      }
      if (data.stats?.avgRating > 0) {
        generatedAlerts.push({
          type: data.stats.avgRating >= 4 ? 'success' : 'warning',
          message: `Average rating: ${data.stats.avgRating.toFixed(1)}/5`,
        });
      }
      setAlerts(generatedAlerts);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const totalUsers = stats.totalStudents + stats.totalTeachers + stats.totalParents + stats.totalTrainees;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBanner}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorSquare} />
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.welcomeText}>Dashboard Overview 👋</Text>
            <Text style={styles.welcomeSubtext}>Welcome to RUWWAD Admin Panel</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
          <Text style={styles.statIcon}>🎓</Text>
          <Text style={styles.statValue}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statIcon}>👨‍🏫</Text>
          <Text style={styles.statValue}>{stats.totalTeachers}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statIcon}>👨‍👩‍👧</Text>
          <Text style={styles.statValue}>{stats.totalParents}</Text>
          <Text style={styles.statLabel}>Parents</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#ec4899' }]}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{stats.totalCourses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#14b8a6' }]}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statValue}>{stats.totalMessages}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      {/* System Alerts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔔 System Alerts</Text>
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <View
              key={index}
              style={[
                styles.alertItem,
                alert.type === 'success' && styles.alertSuccess,
                alert.type === 'warning' && styles.alertWarning,
                alert.type === 'info' && styles.alertInfo,
              ]}
            >
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No alerts at this time</Text>
        )}
      </View>

      {/* Recent Users */}
      <View style={[styles.card, { marginBottom: 30 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>👤 Recent Users</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentUsers.length > 0 ? (
          recentUsers.slice(0, 5).map((user, index) => (
            <View key={user._id || index} style={styles.userItem}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userRole}>{user.role}</Text>
              </View>
              <View style={[styles.roleBadge, getRoleBadgeStyle(user.role)]}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent users</Text>
        )}
      </View>
    </ScrollView>
  );
}

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case 'student':
      return { backgroundColor: '#dbeafe' };
    case 'teacher':
      return { backgroundColor: '#f3e8ff' };
    case 'parent':
      return { backgroundColor: '#dcfce7' };
    default:
      return { backgroundColor: '#f3f4f6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBanner: {
    margin: 15,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#3498db',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2c3e50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  decorSquare: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  viewAllBtn: {
    color: '#4f46e5',
    fontSize: 14,
  },
  alertItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertSuccess: {
    backgroundColor: '#dcfce7',
  },
  alertWarning: {
    backgroundColor: '#fef9c3',
  },
  alertInfo: {
    backgroundColor: '#dbeafe',
  },
  alertText: {
    fontSize: 14,
    color: '#1f2937',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  userRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 20,
  },
});

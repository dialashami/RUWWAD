import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { userAPI } from '../../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      const data = response.data?.users || response.data || [];
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.deleteUser(userId);
              setUsers(users.filter(u => u._id !== userId));
              Alert.alert('Success', 'User deleted successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await userAPI.updateUser(userId, { isActive: !isActive });
      setUsers(users.map(u =>
        u._id === userId ? { ...u, isActive: !isActive } : u
      ));
    } catch (err) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'student': return '#3b82f6';
      case 'teacher': return '#8b5cf6';
      case 'parent': return '#10b981';
      case 'admin': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>Manage all platform users</Text>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={[styles.statPill, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.statPillText, { color: '#3b82f6' }]}>
            👥 Total: {users.length}
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#f3e8ff' }]}>
          <Text style={[styles.statPillText, { color: '#8b5cf6' }]}>
            🎓 Students: {users.filter(u => u.role === 'student').length}
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statPillText, { color: '#10b981' }]}>
            👨‍🏫 Teachers: {users.filter(u => u.role === 'teacher').length}
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.statPillText, { color: '#f59e0b' }]}>
            👨‍👩‍👧 Parents: {users.filter(u => u.role === 'parent').length}
          </Text>
        </View>
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'student', 'teacher', 'parent', 'admin'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterTab, filterRole === role && styles.filterTabActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.filterTabText, filterRole === role && styles.filterTabTextActive]}>
              {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={styles.userCard}
              onPress={() => {
                setSelectedUser(user);
                setModalVisible(true);
              }}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                <Text style={[styles.roleBadgeText, { color: getRoleColor(user.role) }]}>
                  {user.role}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalInitials}>
                      {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.modalName}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(selectedUser.role) + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleColor(selectedUser.role) }]}>
                      {selectedUser.role}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[
                      styles.infoValue,
                      { color: selectedUser.isActive !== false ? '#10b981' : '#ef4444' }
                    ]}>
                      {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Joined</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => {
                      handleToggleStatus(selectedUser._id, selectedUser.isActive !== false);
                      setSelectedUser({ ...selectedUser, isActive: selectedUser.isActive === false });
                    }}
                  >
                    <Text style={styles.toggleButtonText}>
                      {selectedUser.isActive !== false ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => {
                      setModalVisible(false);
                      handleDeleteUser(selectedUser._id);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Delete User</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsScroll: {
    marginBottom: 16,
  },
  statPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  statPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
  },
  filterTabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4b5563',
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#f3f4f6',
  },
  toggleButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

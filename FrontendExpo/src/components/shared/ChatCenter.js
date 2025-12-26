import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { messageAPI, userAPI, adminDashboardAPI } from '../../services/api';

const defaultConversations = [];

const defaultMessages = [
  { id: 1, text: 'Hello! How can I help you today?', sender: 'other', time: '10:00 AM' },
  { id: 2, text: 'I have a question about the homework', sender: 'me', time: '10:05 AM' },
  { id: 3, text: 'Sure, go ahead and ask!', sender: 'other', time: '10:06 AM' },
];

export default function ChatCenter({ currentRole, onMessagesRead, decrementUnreadMessages }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const flatListRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get tabs based on role
  const getTabs = () => {
    switch (currentRole) {
      case 'teacher':
        return [
          { key: 'all', label: 'All' },
          { key: 'student', label: 'Students' },
          { key: 'parent', label: 'Parents' },
        ];
      case 'admin':
        return [
          { key: 'all', label: 'All' },
          { key: 'teacher', label: 'Teachers' },
          { key: 'student', label: 'Students' },
          { key: 'parent', label: 'Parents' },
        ];
      case 'parent':
        return [
          { key: 'all', label: 'All' },
          { key: 'teacher', label: 'Teachers' },
        ];
      case 'student':
      default:
        return [
          { key: 'all', label: 'All' },
          { key: 'teacher', label: 'Teachers' },
        ];
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      
      // Fetch all users (use admin API for admin role, regular API for others)
      let users = [];
      try {
        if (currentRole === 'admin') {
          const adminResponse = await adminDashboardAPI.getUsers();
          users = adminResponse.data?.users || adminResponse.data || [];
        } else {
          const usersResponse = await userAPI.getUsers();
          users = usersResponse.data || [];
        }
      } catch (userErr) {
        console.log('Error fetching users:', userErr.message);
      }
      
      // Fetch conversations for unread counts
      let conversationsData = [];
      try {
        const convResponse = await messageAPI.getConversations();
        conversationsData = convResponse.data || [];
      } catch (convErr) {
        console.log('No conversations yet:', convErr.message);
      }
      
      // Create a map of unread counts by recipient ID
      const unreadMap = {};
      conversationsData.forEach(conv => {
        const recipientId = conv._id || conv.id || conv.recipientId;
        unreadMap[recipientId] = conv.unreadCount || 0;
      });
      
      // Filter out current user and map users to conversation format
      const filteredUsers = users.filter(user => {
        const id = user._id || user.id;
        return id !== userId && id !== currentUserId;
      });
      
      const mappedUsers = filteredUsers.map((user, index) => ({
        id: user._id || user.id || `user-${index}`,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        role: user.role || 'user',
        lastMessage: conversationsData.find(c => c._id === user._id || c.recipientId === user._id)?.lastMessage || '',
        time: conversationsData.find(c => c._id === user._id || c.recipientId === user._id)?.lastMessageTime || '',
        unread: unreadMap[user._id || user.id] || 0,
        avatar: getAvatarByRole(user.role),
      }));
      
      setAllUsers(mappedUsers);
      setConversations(mappedUsers);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setConversations(defaultConversations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId, currentRole]);

  // Filter conversations based on search and active tab
  const getFilteredConversations = useCallback(() => {
    let filtered = allUsers;
    
    // Filter by tab (role)
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }
    
    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) ||
        (user.email && user.email.toLowerCase().includes(search))
      );
    }
    
    return filtered;
  }, [allUsers, activeTab, searchText]);

  const fetchMessages = async (recipientId) => {
    try {
      const response = await messageAPI.getMessages(recipientId);
      const data = response.data || [];
      if (data.length > 0) {
        setMessages(data.map((m, index) => ({
          id: m._id || m.id || `msg-${index}`,
          text: m.content || m.message,
          sender: m.isFromMe || m.sender === currentUserId || m.senderId === currentUserId ? 'me' : 'other',
          time: formatTime(m.createdAt),
        })));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  };

  const getAvatarByRole = (role) => {
    switch (role) {
      case 'teacher': return '👨‍🏫';
      case 'student': return '👨‍🎓';
      case 'parent': return '👪';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      
      // Mark conversation as read and update unread count
      const conversation = allUsers.find(c => c.id === selectedChat);
      if (conversation && conversation.unread > 0) {
        // Decrement parent count
        if (decrementUnreadMessages) {
          decrementUnreadMessages(conversation.unread);
        }
        
        // Update local state
        setAllUsers(prev => 
          prev.map(c => c.id === selectedChat ? { ...c, unread: 0 } : c)
        );
        
        // Call API to mark as read
        messageAPI.markConversationAsRead(selectedChat).catch(err => {
          console.error('Error marking conversation as read:', err);
        });
      }
    }
  }, [selectedChat]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const sendMessage = async () => {
    if (messageText.trim() && selectedChat) {
      const newMessage = {
        id: Date.now(),
        text: messageText,
        sender: 'me',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessageText('');

      try {
        setSending(true);
        await messageAPI.sendMessage(selectedChat, messageText);
      } catch (err) {
        console.error('Error sending message:', err);
      } finally {
        setSending(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (selectedChat) {
    const currentConversation = allUsers.find(c => c.id === selectedChat) || { name: 'Chat', avatar: '👤' };
    
    return (
      <View style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.chatAvatar}>{currentConversation.avatar}</Text>
          <Text style={styles.chatName}>{currentConversation.name}</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.sender === 'me' ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                item.sender === 'me' && styles.myMessageText,
              ]}>
                {item.text}
              </Text>
              <Text style={[
                styles.messageTime,
                item.sender === 'me' && styles.myMessageTime,
              ]}>
                {item.time}
              </Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={sending}
          >
            <Text style={styles.sendIcon}>{sending ? '⏳' : '📤'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          {currentRole === 'admin' ? 'Communicate with all users' :
           currentRole === 'teacher' ? 'Chat with students and parents' : 
           currentRole === 'parent' ? 'Chat with teachers' :
           'Chat with your teachers'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Role Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {getTabs().map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Conversations List */}
      <ScrollView 
        style={styles.conversationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      >
        {getFilteredConversations().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>
              {searchText ? 'No users found matching your search' : 'No users available'}
            </Text>
          </View>
        ) : (
          getFilteredConversations().map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationItem}
              onPress={() => setSelectedChat(conversation.id)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{conversation.avatar}</Text>
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{conversation.name}</Text>
                  {conversation.time ? (
                    <Text style={styles.conversationTime}>{formatTime(conversation.time)}</Text>
                  ) : null}
                </View>
                <View style={styles.conversationFooter}>
                  <Text style={styles.roleTag}>{conversation.role}</Text>
                  {conversation.lastMessage ? (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {conversation.lastMessage}
                    </Text>
                  ) : (
                    <Text style={styles.lastMessageEmpty}>Start a conversation</Text>
                  )}
                </View>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  conversationsList: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  roleTag: {
    fontSize: 12,
    color: '#007bff',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  lastMessageEmpty: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007bff',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Chat view styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  chatAvatar: {
    fontSize: 24,
    marginRight: 10,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  messagesList: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#1f2937',
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  sendBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
  },
});

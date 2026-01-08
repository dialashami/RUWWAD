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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      
      // Create a map of unread counts by partner ID
      const unreadMap = {};
      conversationsData.forEach(conv => {
        const recipientId = conv.partnerId || conv._id || conv.id || conv.recipientId;
        unreadMap[recipientId] = conv.unreadCount || 0;
      });
      
      // Filter out current user and map users to conversation format
      const filteredUsers = users.filter(user => {
        const id = user._id || user.id;
        return id !== userId && id !== currentUserId;
      });
      
      const mappedUsers = filteredUsers.map((user, index) => {
        const usrId = user._id || user.id;
        const convData = conversationsData.find(c => 
          c.partnerId === usrId || c._id === usrId || c.recipientId === usrId
        );
        return {
          id: usrId || `user-${index}`,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          email: user.email,
          role: user.role || 'user',
          lastMessage: convData?.lastMessage || '',
          time: convData?.lastMessageTime || '',
          unread: unreadMap[usrId] || 0,
          avatar: getAvatarByRole(user.role),
        };
      });
      
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
      const userId = await AsyncStorage.getItem('userId');
      const response = await messageAPI.getMessages(recipientId);
      const data = response.data || [];
      if (data.length > 0) {
        setMessages(data.map((m, index) => {
          // Get the sender ID from the message - handle both populated and non-populated formats
          const messageSenderId = m.sender?._id || m.sender || m.senderId;
          const isFromMe = messageSenderId === userId || m.isFromMe === true;
          
          return {
            id: m._id || m.id || `msg-${index}-${Date.now()}`,
            text: m.content || m.message || m.text || '',
            sender: isFromMe ? 'me' : 'other',
            time: formatTime(m.createdAt),
          };
        }));
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
      const textToSend = messageText.trim();
      setMessageText('');
      
      // Add optimistic message with temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        text: textToSend,
        sender: 'me',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        pending: true,
      };
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        setSending(true);
        await messageAPI.sendMessage(selectedChat, textToSend);
        
        // Refetch messages to get proper IDs and ensure consistency
        await fetchMessages(selectedChat);
      } catch (err) {
        console.error('Error sending message:', err);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessageText(textToSend); // Restore the message text
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
    
    const handleBackPress = () => {
      setMessages([]); // Clear messages when leaving chat
      setSelectedChat(null);
    };
    
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatAvatarText}>{currentConversation.avatar}</Text>
          </View>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatName}>{currentConversation.name}</Text>
            <Text style={styles.chatStatus}>Online</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item, index }) => {
            const isMe = item.sender === 'me';
            const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender === 'me');
            
            return (
              <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                {/* Other person's avatar */}
                {!isMe && (
                  <View style={styles.messageAvatarContainer}>
                    {showAvatar ? (
                      <View style={styles.messageAvatar}>
                        <Text style={styles.messageAvatarText}>{currentConversation.avatar}</Text>
                      </View>
                    ) : (
                      <View style={styles.messageAvatarSpacer} />
                    )}
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                ]}>
                  <Text style={[
                    styles.messageText,
                    isMe && styles.myMessageText,
                  ]}>
                    {item.text}
                  </Text>
                  <View style={styles.messageFooter}>
                    <Text style={[
                      styles.messageTime,
                      isMe && styles.myMessageTime,
                    ]}>
                      {item.time}
                    </Text>
                    {isMe && (
                      <Text style={styles.messageStatus}>✓✓</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!messageText.trim() || sending) && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Text style={styles.sendIcon}>{sending ? '⏳' : '📤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <LinearGradient
        colors={['#3498db', '#2c3e50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorSquare} />
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Messages</Text>
            <Text style={styles.bannerSubtitle}>
              {currentRole === 'admin' ? 'Communicate with all users' :
               currentRole === 'teacher' ? 'Chat with students and parents' : 
               currentRole === 'parent' ? 'Chat with teachers' :
               'Chat with your teachers'}
            </Text>
          </View>
        </View>
      </LinearGradient>

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
  headerBanner: {
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
  bannerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
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
    padding: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 20,
    color: '#1f2937',
  },
  chatHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 22,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatStatus: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatarContainer: {
    marginRight: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    fontSize: 16,
  },
  messageAvatarSpacer: {
    width: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 2,
  },
  myMessage: {
    backgroundColor: '#0084ff',
    borderBottomRightRadius: 4,
    marginLeft: 40,
  },
  theirMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
    color: '#1f2937',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
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

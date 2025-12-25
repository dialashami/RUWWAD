import React, { useState, useEffect, useRef } from 'react';
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
import { messageAPI } from '../../services/api';

const defaultConversations = [
  {
    id: 1,
    name: 'Mr. Ahmed (Math Teacher)',
    lastMessage: 'Great progress on your assignment!',
    time: '10:30 AM',
    unread: 2,
    avatar: '👨‍🏫',
  },
  {
    id: 2,
    name: 'Ms. Sara (English Teacher)',
    lastMessage: 'Don\'t forget to submit your essay',
    time: 'Yesterday',
    unread: 0,
    avatar: '👩‍🏫',
  },
  {
    id: 3,
    name: 'Dr. Mohammed (Physics)',
    lastMessage: 'Lab session is rescheduled',
    time: 'Dec 23',
    unread: 1,
    avatar: '👨‍🔬',
  },
];

const defaultMessages = [
  { id: 1, text: 'Hello! How can I help you today?', sender: 'teacher', time: '10:00 AM' },
  { id: 2, text: 'I have a question about the homework', sender: 'me', time: '10:05 AM' },
  { id: 3, text: 'Sure, go ahead and ask!', sender: 'teacher', time: '10:06 AM' },
  { id: 4, text: 'I\'m confused about problem 3', sender: 'me', time: '10:10 AM' },
  { id: 5, text: 'Great progress on your assignment!', sender: 'teacher', time: '10:30 AM' },
];

export default function ChatCenter({ currentRole }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      const data = response.data || [];
      if (data.length > 0) {
        setConversations(data.map(c => ({
          id: c._id || c.id,
          name: c.name || `${c.firstName} ${c.lastName}`,
          lastMessage: c.lastMessage || '',
          time: formatTime(c.lastMessageTime),
          unread: c.unreadCount || 0,
          avatar: getAvatarByRole(c.role),
        })));
      } else {
        setConversations(defaultConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations(defaultConversations);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async (recipientId) => {
    try {
      const response = await messageAPI.getMessages(recipientId);
      const data = response.data || [];
      if (data.length > 0) {
        setMessages(data.map(m => ({
          id: m._id || m.id,
          text: m.content || m.message,
          sender: m.isFromMe ? 'me' : 'teacher',
          time: formatTime(m.createdAt),
        })));
      } else {
        setMessages(defaultMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages(defaultMessages);
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
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
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
    const currentConversation = conversations.find(c => c.id === selectedChat) || defaultConversations[0];
    
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
          {currentRole === 'teacher' ? 'Chat with your students' : 'Chat with your teachers'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Conversations List */}
      <ScrollView 
        style={styles.conversationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      >
        {conversations.map((conversation) => (
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
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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

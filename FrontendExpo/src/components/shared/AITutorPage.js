import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiAPI } from '../../services/api';

const quickActions = [
  { icon: '🧮', label: 'Help with Math', prompt: 'Can you help me understand calculus derivatives?' },
  { icon: '⚗️', label: 'Chemistry Questions', prompt: 'Explain the periodic table structure' },
  { icon: '🔬', label: 'Biology Topics', prompt: 'What is cellular respiration?' },
  { icon: '🧠', label: 'Study Tips', prompt: 'Give me study tips for my upcoming exams' },
  { icon: '💡', label: 'General Knowledge', prompt: 'Tell me something interesting about space' },
  { icon: '📚', label: 'Any Question', prompt: 'What would you like to know?' },
];

const initialMessage = {
  id: 1,
  text: "Hello! I'm your AI assistant. I'm here to help you with any questions. Ask me anything! 🤖",
  sender: 'ai',
  time: 'Now',
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const generateTitleFromMessage = (text) => {
  const words = text.split(' ').slice(0, 4);
  return words.join(' ') + (text.split(' ').length > 4 ? '...' : '');
};

export default function AITutorPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const flatListRef = useRef(null);
  const isAddingNewMessage = useRef(false);

  // Fetch conversation history on mount
  useEffect(() => {
    fetchConversationHistory();
  }, []);

  const fetchConversationHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await aiAPI.getConversations();
      if (response.data) {
        setConversationHistory(response.data.map(conv => ({
          id: conv._id,
          title: conv.title,
          date: formatDate(conv.updatedAt),
          preview: conv.preview || '',
          messages: conv.messageCount || 0,
        })));
      }
    } catch (err) {
      console.error('Error fetching conversation history:', err);
    }
  };

  // Send message to AI via backend
  const sendToBackend = async (text) => {
    try {
      const response = await aiAPI.sendMessage(text, currentConversationId);
      
      // Update conversation ID if new conversation was created
      if (response.conversationId && !currentConversationId) {
        setCurrentConversationId(response.conversationId);
      }
      
      // Get AI response from the backend response
      const aiResponse = response.message?.text || response.answer || 'Sorry, I could not answer that.';
      return aiResponse;
    } catch (err) {
      console.error('AI Chat Error:', err);
      return 'Error: Could not reach AI server. Please check your connection.';
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    isAddingNewMessage.current = true;

    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      time: 'Now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiAnswer = await sendToBackend(text);

      const aiResponse = {
        id: Date.now() + 1,
        text: aiAnswer,
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, aiResponse]);
      
      // Refresh conversation history
      fetchConversationHistory();
    } catch (error) {
      console.error('AI Error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const handleNewConversation = () => {
    setMessages([initialMessage]);
    setCurrentConversationId(null);
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await aiAPI.getConversation(conversationId);
      if (response.data) {
        const data = response.data;
        setCurrentConversationId(data._id);

        if (data.messages && data.messages.length > 0) {
          const loadedMessages = [
            initialMessage,
            ...data.messages.map((msg, idx) => ({
              id: idx + 2,
              sender: msg.type,
              text: msg.text,
              time: 'Earlier',
            })),
          ];
          setMessages(loadedMessages);
        }
        setShowHistory(false);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await aiAPI.deleteConversation(convId);
      setConversationHistory(prev => prev.filter(c => c.id !== convId));
      
      // If deleted current conversation, start new one
      if (currentConversationId === convId) {
        handleNewConversation();
      }
      
      setConversationToDelete(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  const confirmDelete = (conv) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${conv.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteConversation(conv.id) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Ask me anything!</Text>
        </View>
        <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
          <Text style={styles.historyIcon}>📜</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewConversation}>
          <Text style={styles.newChatIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            {item.sender === 'ai' && <Text style={styles.aiAvatar}>🤖</Text>}
            <View style={[
              styles.messageContent,
              item.sender === 'user' && styles.userMessageContent,
            ]}>
              <Text style={[
                styles.messageText,
                item.sender === 'user' && styles.userMessageText,
              ]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.aiAvatar}>🤖</Text>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Quick Actions - shown only at start */}
      {messages.length <= 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.prompt)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          onSubmitEditing={() => sendMessage(inputText)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>📜 Chat History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {conversationHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyText}>No conversation history yet</Text>
                  <Text style={styles.emptySubtext}>Start chatting to save conversations</Text>
                </View>
              ) : (
                conversationHistory.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={styles.historyItem}
                    onPress={() => loadConversation(conv.id)}
                  >
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle}>{conv.title}</Text>
                      <Text style={styles.historyItemPreview} numberOfLines={1}>
                        {conv.preview}
                      </Text>
                      <Text style={styles.historyItemDate}>{conv.date}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(conv)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

      {/* Quick Actions - shown only at start */}
      {messages.length <= 1 && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionChip}
                onPress={() => handleQuickAction(action.prompt)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          onSubmitEditing={() => sendMessage(inputText)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  headerIcon: {
    fontSize: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyIcon: {
    fontSize: 20,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatIcon: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    fontSize: 24,
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    maxWidth: '80%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageContent: {
    backgroundColor: '#007bff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  typingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cce0ff',
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionText: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
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
    backgroundColor: '#9ca3af',
  },
  sendIcon: {
    fontSize: 20,
  },
  // History Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  historyModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 30,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6b7280',
  },
  historyList: {
    padding: 15,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  historyItemPreview: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteBtnText: {
    fontSize: 16,
  },
});

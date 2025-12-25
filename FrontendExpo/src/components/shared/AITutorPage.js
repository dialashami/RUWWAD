import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { aiAPI } from '../../services/api';

const suggestedQuestions = [
  'Explain photosynthesis',
  'How do I solve quadratic equations?',
  'What is Newton\'s first law?',
  'Help me understand fractions',
  'Explain the water cycle',
];

export default function AITutorPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your AI tutor. How can I help you with your studies today? 📚',
      sender: 'ai',
      time: 'Now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

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
      // Try to call the AI API
      const response = await aiAPI.sendMessage(text, conversationId);
      const aiText = response.data?.message || response.data?.response || getAIResponse(text);
      
      if (response.data?.conversationId) {
        setConversationId(response.data.conversationId);
      }

      const aiResponse = {
        id: Date.now() + 1,
        text: aiText,
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI API Error:', error);
      // Fall back to local responses
      const aiResponse = {
        id: Date.now() + 1,
        text: getAIResponse(text),
        sender: 'ai',
        time: 'Now',
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = (question) => {
    const responses = {
      'photosynthesis': 'Photosynthesis is the process by which plants convert light energy into chemical energy. The equation is:\n\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\nPlants absorb sunlight through chlorophyll and use it to convert carbon dioxide and water into glucose and oxygen. 🌱',
      'quadratic': 'To solve quadratic equations (ax² + bx + c = 0), you can use:\n\n1. **Factoring**: Find two numbers that multiply to c and add to b\n2. **Quadratic Formula**: x = (-b ± √(b²-4ac)) / 2a\n3. **Completing the Square**: Rewrite the equation in (x+p)² = q form\n\nWould you like me to walk through an example? 📐',
      'newton': 'Newton\'s First Law (Law of Inertia) states:\n\n"An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force."\n\nSimply put: things don\'t change what they\'re doing unless something makes them! 🍎',
      'default': 'That\'s a great question! Let me help you understand this concept better. Could you provide more details about what specific aspect you\'d like to explore? I\'m here to help you learn! 🎓',
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('photosynthesis')) return responses.photosynthesis;
    if (lowerQuestion.includes('quadratic') || lowerQuestion.includes('equation')) return responses.quadratic;
    if (lowerQuestion.includes('newton') || lowerQuestion.includes('law')) return responses.newton;
    return responses.default;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <View>
          <Text style={styles.title}>AI Tutor</Text>
          <Text style={styles.subtitle}>Your personal learning assistant</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
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

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendMessage(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  suggestionsContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  suggestionText: {
    color: '#0369a1',
    fontSize: 14,
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
});

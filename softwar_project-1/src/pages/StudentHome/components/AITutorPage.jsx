
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Calculator,
  Beaker,
  Microscope,
  Brain,
  Lightbulb,
  Trash2,
  X,
} from 'lucide-react';

import { Card } from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Badge } from './ui';

const API_BASE_URL = 'http://localhost:3000/api';

const quickActions = [
 { icon: Calculator, label: 'Help with Math', prompt: 'Can you help me understand calculus derivatives?' },
  { icon: Beaker, label: 'Chemistry Questions', prompt: 'Explain the periodic table structure' },
  { icon: Microscope, label: 'Biology Topics', prompt: 'What is cellular respiration?' },
  { icon: Brain, label: 'Study Tips', prompt: 'Give me study tips for my upcoming exams' },
  { icon: Lightbulb, label: 'Concept Clarification', prompt: 'I need help understanding quantum mechanics' },
  { icon: BookOpen, label: 'Practice Problems', prompt: 'Generate practice problems for algebra' },
];

const initialMessage = {
  id: 1,
  type: 'ai',
  text: "Hello! I'm your AI tutor. I'm here to help you with any subject. Ask me anything 🤖",
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
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  const isAddingNewMessage = useRef(false);

  // Fetch conversation history on mount
  useEffect(() => {
    fetchConversationHistory();
  }, []);

  const fetchConversationHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai-conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversationHistory(data.map(conv => ({
          id: conv._id,
          title: conv.title,
          date: formatDate(conv.updatedAt),
          preview: conv.preview || '',
          messages: conv.messageCount || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching conversation history:', err);
    }
  };

  // Save conversation to backend
  const saveConversation = async (title, preview, msgs) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/ai-conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          preview,
          messages: msgs.map(m => ({ type: m.type, text: m.text })),
          messageCount: msgs.filter(m => m.type === 'user').length
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data._id;
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
    }
    return null;
  };

  // Update existing conversation
  const updateConversation = async (convId, title, preview, msgs) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_BASE_URL}/ai-conversations/${convId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          preview,
          messages: msgs.map(m => ({ type: m.type, text: m.text })),
          messageCount: msgs.filter(m => m.type === 'user').length
        })
      });
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  };

  const sendToBackend = async (text) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      return data.answer || 'Sorry, I could not answer that.';
    } catch (err) {
      console.error(err);
      return 'Error: could not reach AI server.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textFromQuickAction) => {
    const messageText = textFromQuickAction || inputValue;
    if (!messageText.trim()) return;

    isAddingNewMessage.current = true;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: messageText,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');

    const aiAnswer = await sendToBackend(messageText);

    const aiMessage = {
      id: messages.length + 2,
      type: 'ai',
      text: aiAnswer,
    };
    const finalMessages = [...updatedMessages, aiMessage];
    setMessages(finalMessages);

    // Save or update conversation in backend
    const title = generateTitleFromMessage(messageText);
    const preview = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
    
    if (currentConversationId) {
      await updateConversation(currentConversationId, title, preview, finalMessages);
    } else {
      const newId = await saveConversation(title, preview, finalMessages);
      if (newId) {
        setCurrentConversationId(newId);
      }
    }
    
    fetchConversationHistory();
  };

  const handleQuickAction = (prompt) => {
    handleSend(prompt);
  };

  const handleNewConversation = () => {
    setMessages([initialMessage]);
    setCurrentConversationId(null);
  };

  const loadConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai-conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentConversationId(data._id);
        
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = [
            initialMessage,
            ...data.messages.map((msg, idx) => ({
              id: idx + 2,
              type: msg.type,
              text: msg.text
            }))
          ];
          setMessages(loadedMessages);
        } else {
          const conversation = conversationHistory.find(conv => conv.id === conversationId);
          setMessages([
            initialMessage,
            {
              id: 2,
              type: 'user',
              text: conversation?.preview?.replace('...', '') || 'Previous conversation',
            },
            {
              id: 3,
              type: 'ai',
              text: `This is a previous conversation about "${conversation?.title || 'this topic'}". You can follow up with questions.`,
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation(); 
    setConversationToDelete(conversationId);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && conversationToDelete) {
        await fetch(`${API_BASE_URL}/ai-conversations/${conversationToDelete}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setConversationHistory(prev => 
        prev.filter(conv => conv.id !== conversationToDelete)
      );
      
      if (currentConversationId === conversationToDelete) {
        setMessages([initialMessage]);
        setCurrentConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
    setConversationToDelete(null);
  };

  const cancelDelete = () => {
    setConversationToDelete(null);
  };

  return (
    <div className="AITutorPage">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[#0F172A] flex items-center gap-2"
            style={{ fontSize: '32px', fontWeight: '700' }}
          >
            AI Tutor 
          </h1>
          <p className="text-gray-600 mt-1" style={{ fontSize: '16px' }}>
            Your personal AI assistant for learning
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white border-0 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Powered
        </Badge>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 rounded-2xl border-0 shadow-lg bg-white">
            <h3
              className="text-[#0F172A] mb-4"
              style={{ fontSize: '16px', fontWeight: '600' }}
            >
              Recent Conversations
            </h3>
            <div className="space-y-2">
            {conversationHistory.map((conv) => (
  <div key={conv.id} className="relative group">
    <button
      onClick={() => loadConversation(conv.id)}
      className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gradient-to-r hover:from-[#4F46E5]/10 hover:to-[#9333EA]/10 transition-all text-left"
    >
      <div className="flex flex-col">
        <p
          className="text-[#0F172A] truncate mb-1"
          style={{ fontSize: '14px', fontWeight: '600' }}
        >
          {conv.title}
        </p>
        <p
          className="text-gray-600 text-sm truncate mb-2"
          style={{ fontSize: '12px' }}
        >
          {conv.preview}
        </p>

        {}
        <div className="flex items-center justify-between">
          <span className="text-gray-400" style={{ fontSize: '11px' }}>
            {conv.date}
          </span>
          <Badge variant="secondary" className="text-xs">
            {conv.messages} msgs
          </Badge>
        </div>
      </div>
    </button>

    {}
    <div className="flex justify-end mt-1 pr-1">
      <button
        onClick={(e) => handleDeleteConversation(conv.id, e)}
        className="p-1.5 rounded-md bg-gray-100 border border-gray-200 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all opacity-70 hover:opacity-100 text-gray-500 text-xs flex items-center gap-1"
        title="Delete conversation"
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </button>
    </div>
  </div>
))}

            </div>
            <Button 
              onClick={handleNewConversation}
              className="w-full mt-4 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90 text-white rounded-xl"
            >
              <Bot className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </Card>
        </div>

        {/* Right side */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-[#4F46E5] to-[#9333EA]">
            <h3
              className="text-white mb-4"
              style={{ fontSize: '18px', fontWeight: '600' }}
            >
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-left"
                  >
                    <Icon className="w-6 h-6 text-white mb-2" />
                    <p
                      className="text-white"
                      style={{ fontSize: '13px', fontWeight: '600' }}
                    >
                      {action.label}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* Chat box */}
          <Card className="rounded-2xl border-0 shadow-lg bg-white overflow-hidden">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message) => {
                const isUser = message.type === 'user';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    {/* avatar */}
                    {isUser ? (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span style={{ fontSize: '16px' }}>👤</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    )}

                    {/* bubble */}
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl shadow-md ${
                        isUser
                          ? 'bg-white text-[#0F172A] border border-gray-100'
                          : 'bg-white text-[#0F172A]'
                      }`}
                    >
                      <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
                        {message.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {isLoading && (
                <div className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                  AI is thinking...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Ask me anything about your studies..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 rounded-full border-gray-300 px-6"
                />
                <Button
                  onClick={() => handleSend()}
                  className="w-12 h-12 rounded-full p-0 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90"
                  disabled={isLoading}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p
                className="text-gray-500 text-center mt-3"
                style={{ fontSize: '12px' }}
              >
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-content"
          >
            {}
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Delete Conversation</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>
            </div>
            
            {}
            <button 
              onClick={cancelDelete} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={cancelDelete}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl transition-all duration-200 hover:translate-y-[-1px]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:translate-y-[-1px] shadow-lg shadow-red-500/25"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {}
      <style jsx>{`
        .fixed.inset-0.bg-black.bg-opacity-50 {
          backdrop-filter: blur(6px);
          background-color: rgba(15, 23, 42, 0.55);
          animation: fadeIn 0.25s ease-out;
        }

        .modal-content {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.92),
            rgba(249, 249, 255, 0.94)
          );
          border: 1px solid rgba(147, 51, 234, 0.08);
          box-shadow:
            0 6px 18px rgba(79, 70, 229, 0.1),
            0 3px 6px rgba(147, 51, 234, 0.06);
          border-radius: 0.9rem;
          animation: slideIn 0.25s ease-out;
          backdrop-filter: blur(8px);
          transform-origin: center;
          transition: all 0.25s ease-in-out;
          max-width: 400px;
          padding: 1.5rem 1.25rem;
          width: 90%;
          position: relative;
        }

        .modal-header {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.98));
          border-radius: 0.7rem;
          padding: 1.25rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(229, 231, 235, 0.8);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

     
        .bg-red-500 {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .bg-red-500:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(239, 68, 68, 0.35);
        }

        .bg-gray-200:hover {
          background-color: #e5e7eb !important;
          transform: translateY(-1px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modal-content {
            margin: 20px;
            max-width: calc(100% - 40px);
            padding: 1.25rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
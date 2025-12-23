 import { useState } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';

import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Card } from './ui';
import { Button } from './ui';
import { Input } from './ui';

export default function AITutorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hi! I'm your AI tutor. How can I help you study today? 📚",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendToBackend = async (text) => {
  try {
    setIsLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Backend  error:', res.status, detail);
      return `Server error (${res.status}).`;
    }
    const data = await res.json().catch(() => null);
    return data?.answer ?? 'Invalid JSON from server.';
  } catch (err) {
    console.error('Fetch error:', err);
    return 'Network error: cannot reach backend (check proxy).';
  } finally {
    setIsLoading(false);
  }
};

 

 


  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    const text = inputValue;
    setInputValue('');

    const aiAnswer = await sendToBackend(text);

    const aiMessage = {
      id: messages.length + 2,
      type: 'ai',
      text: aiAnswer,
    };
    setMessages((prev) => [...prev, aiMessage]);
  };

  const suggestions = ['Explain quantum mechanics', 'Help with calculus', 'Quiz me on biology'];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-50"
        style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-7 h-7 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Bot className="w-7 h-7 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && <span className="absolute inset-0 rounded-full bg-[#9333EA] animate-ping opacity-20" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-8 w-96 z-50"
          >
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 style={{ fontSize: '16px', fontWeight: '600' }}>AI Study Assistant</h4>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span style={{ fontSize: '12px' }} className="opacity-90">
                        Online
                      </span>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 opacity-80" />
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-[#4F46E5] to-[#9333EA] text-white'
                          : 'bg-white text-[#0F172A] shadow-sm'
                      }`}
                    >
                      <p style={{ fontSize: '14px' }}>{message.text}</p>
                    </div>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-gray-500 text-center" style={{ fontSize: '12px' }}>
                      Quick suggestions:
                    </p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInputValue(suggestion)}
                        className="w-full p-3 bg-white rounded-xl text-left hover:bg-gray-100 transition-colors"
                      >
                        <p className="text-[#0F172A]" style={{ fontSize: '13px' }}>
                          {suggestion}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                    AI is typing...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 rounded-full border-gray-300"
                  />
                  <Button
                    onClick={handleSend}
                    className="w-10 h-10 rounded-full p-0 bg-gradient-to-r from-[#4F46E5] to-[#9333EA] hover:opacity-90"
                    disabled={isLoading}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

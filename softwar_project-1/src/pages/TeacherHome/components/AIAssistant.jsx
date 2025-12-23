import React, { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, Lightbulb, Target, Send, Trash2 } from 'lucide-react';
import '../styles/AIAssistant.css';
import { generateAIResponse } from '../../../services/aiService';

const questionBank = [
  {
    id: 1,
    subject: 'Algebra',
    difficulty: 'Medium',
    question: 'Solve for x: 2x² + 5x - 3 = 0',
    answer: 'x = 1/2 or x = -3',
    type: 'Problem Solving'
  },
  {
    id: 2,
    subject: 'Geometry',
    difficulty: 'Easy',
    question: 'Find the area of a triangle with base 8cm and height 5cm',
    answer: 'Area = 20 cm²',
    type: 'Application'
  },
  {
    id: 3,
    subject: 'Statistics',
    difficulty: 'Hard',
    question: 'Calculate the standard deviation of the following dataset: 12, 15, 18, 12, 20, 15',
    answer: 'σ ≈ 2.94',
    type: 'Analysis'
  }
];

const lessonPlanTemplates = [
  {
    id: 1,
    topic: 'Introduction to Calculus',
    duration: '60 minutes',
    objectives: [
      'Understand the concept of limits',
      'Apply limit notation correctly',
      'Solve basic limit problems'
    ],
    activities: [
      'Warm-up: Review of functions (10 min)',
      'Introduction to limits with real-world examples (15 min)',
      'Guided practice problems (20 min)',
      'Group activity: Limit challenges (10 min)',
      'Wrap-up and homework assignment (5 min)'
    ]
  }
];

// Custom hooks for state management
const useStore = () => {
  const [chatHistory, setChatHistory] = useState([]);

  return {
    getChatHistory: () => chatHistory,
    addChatMessage: (message) => setChatHistory(prev => [...prev, message]),
    clearChatHistory: () => setChatHistory([])
  };
};

// Reusable Components
const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`card-content ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', disabled = false }) => (
  <button 
    className={`btn btn-${variant} btn-${size} ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const Input = ({ value, onChange, placeholder, className = '', type = 'text', disabled = false, onKeyDown }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`input ${className}`}
    disabled={disabled}
    onKeyDown={onKeyDown}
  />
);

const Textarea = ({ value, onChange, placeholder, className = '', rows = 3, disabled = false }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`textarea ${className}`}
    rows={rows}
    disabled={disabled}
  />
);

const Select = ({ value, onValueChange, children, className = '' }) => (
  <div className={`select ${className}`}>
    {children}
  </div>
);

const SelectTrigger = ({ children, className = '' }) => (
  <div className={`select-trigger ${className}`}>
    {children}
  </div>
);

const SelectValue = ({ placeholder }) => (
  <span className="select-value">{placeholder}</span>
);

const SelectContent = ({ children, className = '' }) => (
  <div className={`select-content ${className}`}>
    {children}
  </div>
);

const SelectItem = ({ value, children, onSelect }) => (
  <div className="select-item" onClick={() => onSelect(value)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>
    {children}
  </span>
);

const Tabs = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={`tabs ${className}`}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab, className = '' }) => (
  <div className={`tabs-list ${className}`}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { activeTab, setActiveTab })
    )}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab, className = '' }) => (
  <button
    className={`tabs-trigger ${activeTab === value ? 'active' : ''} ${className}`}
    onClick={() => setActiveTab(value)}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab, className = '' }) => (
  activeTab === value ? (
    <div className={`tabs-content ${className}`}>
      {children}
    </div>
  ) : null
);

export function AIAssistant() {
  const store = useStore();
  const chatHistory = store.getChatHistory();
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Question generator state
  const [questionForm, setQuestionForm] = useState({
    subject: '',
    difficulty: '',
    count: '5',
    topics: '',
  });

  // Lesson plan state
  const [lessonForm, setLessonForm] = useState({
    topic: '',
    grade: '',
    duration: '',
    objectives: '',
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessageObj = {
      role: 'user',
      content: inputMessage,
    };
    
    store.addChatMessage(userMessageObj);
    
    const userMessage = inputMessage;
    setInputMessage('');
    setIsGenerating(true);
    
    try {
      // استخدام API حقيقي
      const aiResponse = await generateAIResponse(userMessage, chatHistory);
      
      store.addChatMessage({
        role: 'assistant',
        content: aiResponse,
      });
    } catch (error) {
      console.error('AI Response Error:', error);
      store.addChatMessage({
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    if(window.confirm('Are you sure you want to clear the chat history?')) {
      store.clearChatHistory();
      // toast.success('Chat history cleared');
    }
  };

  const handleGenerateQuestions = () => {
    if (!questionForm.subject || !questionForm.difficulty) {
      // toast.error('Please select subject and difficulty');
      alert('Please select subject and difficulty');
      return;
    }
    
    // toast.success(`Generated ${questionForm.count} ${questionForm.difficulty.toLowerCase()} questions for ${questionForm.subject}!`);
    alert(`Generated ${questionForm.count} ${questionForm.difficulty.toLowerCase()} questions for ${questionForm.subject}!`);
    setQuestionForm({ subject: '', difficulty: '', count: '5', topics: '' });
  };

  const handleGenerateLessonPlan = () => {
    if (!lessonForm.topic || !lessonForm.grade || !lessonForm.duration) {
      // toast.error('Please fill in all required fields');
      alert('Please fill in all required fields');
      return;
    }
    
    // toast.success(`Lesson plan for "${lessonForm.topic}" created successfully!`);
    alert(`Lesson plan for "${lessonForm.topic}" created successfully!`);
    setLessonForm({ topic: '', grade: '', duration: '', objectives: '' });
  };

  return (
    <div className="ai-assistant">
      <div className="assistant-header">
        <div className="flex items-center gap-2">
          <div className="ai-icon">
            <Sparkles className="icon" />
          </div>
          <h1 className="gradient-text">AI Teaching Assistant</h1>
        </div>
        <p className="subtitle">Get personalized teaching strategies and automated question generation</p>
      </div>

      <div className="layout-grid">
        {/* Chat Interface */}
        <Card className="chat-interface">
          <CardHeader className="chat-header">
            <div className="flex items-center justify-between">
              <CardTitle>AI Chat</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearChat}
                className="clear-btn"
              >
                <Trash2 className="icon-sm mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="chat-content">
            <div className="chat-space">
              <div className="chat-messages">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    <div className="message-bubble">
                      <p className="message-text">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="message ai-message">
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <div className="dot" style={{ animationDelay: '0ms' }} />
                        <div className="dot" style={{ animationDelay: '150ms' }} />
                        <div className="dot" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input-container">
                <Input
                  placeholder="Ask me anything about teaching..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="chat-input"
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSendMessage} 
                  className="send-btn"
                  disabled={isGenerating}
                >
                  <Send className="icon-sm" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="sidebar">
          <Card className="quick-actions">
            <CardHeader className="actions-header">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="actions-content">
              <Button 
                variant="outline" 
                className="action-btn"
                onClick={() => setInputMessage('Can you help me generate quiz questions?')}
              >
                <HelpCircle className="icon-sm mr-2" />
                Generate Quiz Questions
              </Button>
              <Button 
                variant="outline" 
                className="action-btn"
                onClick={() => setInputMessage('I need help creating a lesson plan')}
              >
                <BookOpen className="icon-sm mr-2" />
                Create Lesson Plan
              </Button>
              <Button 
                variant="outline" 
                className="action-btn"
                onClick={() => setInputMessage('What teaching strategies do you recommend?')}
              >
                <Lightbulb className="icon-sm mr-2" />
                Teaching Strategies
              </Button>
              <Button 
                variant="outline" 
                className="action-btn"
                onClick={() => setInputMessage('Can you analyze student performance?')}
              >
                <Target className="icon-sm mr-2" />
                Analyze Performance
              </Button>
            </CardContent>
          </Card>

          <Card className="insights">
            <CardHeader className="insights-header">
              <CardTitle>Recent Insights</CardTitle>
            </CardHeader>
            <CardContent className="insights-content">
              <div className="insight-item">
                <p>3 students may need extra help with Calculus</p>
              </div>
              <div className="insight-item">
                <p>Assignment completion rate increased by 15%</p>
              </div>
              <div className="insight-item">
                <p>Best engagement time: 10-11 AM</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Generated Content */}
      <Tabs defaultValue="questions" className="ai-content">
        <TabsList className="tabs-navigation">
          <TabsTrigger value="strategies">Teaching Strategies</TabsTrigger>
          <TabsTrigger value="questions">Generate Questions</TabsTrigger>
          <TabsTrigger value="lessons">Lesson Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="strategies-content">
          <Card className="strategies-card">
            <CardHeader>
              <CardTitle>Teaching Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Use the chat interface above to get personalized teaching strategies based on your specific needs and classroom context.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="questions-content">
          <Card className="question-generator">
            <CardHeader className="generator-header">
              <CardTitle>Generate New Questions</CardTitle>
            </CardHeader>
            <CardContent className="generator-content">
              <div className="form-grid">
                <div className="form-field">
                  <label>Subject</label>
                  <Select value={questionForm.subject} onValueChange={(value) => setQuestionForm({...questionForm, subject: value})}>
                    <SelectTrigger className="select-field">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="select-options">
                      <SelectItem value="Algebra">Algebra</SelectItem>
                      <SelectItem value="Geometry">Geometry</SelectItem>
                      <SelectItem value="Calculus">Calculus</SelectItem>
                      <SelectItem value="Statistics">Statistics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <label>Difficulty</label>
                  <Select value={questionForm.difficulty} onValueChange={(value) => setQuestionForm({...questionForm, difficulty: value})}>
                    <SelectTrigger className="select-field">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="select-options">
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="form-field">
                <label>Number of Questions</label>
                <Input 
                  type="number" 
                  placeholder="5" 
                  value={questionForm.count}
                  onChange={(e) => setQuestionForm({...questionForm, count: e.target.value})}
                  className="number-input"
                />
              </div>
              <div className="form-field">
                <label>Specific Topics (optional)</label>
                <Textarea 
                  placeholder="Enter specific topics to focus on..." 
                  rows={2}
                  value={questionForm.topics}
                  onChange={(e) => setQuestionForm({...questionForm, topics: e.target.value})}
                  className="topics-textarea"
                />
              </div>
              <Button onClick={handleGenerateQuestions} className="generate-btn">
                <Sparkles className="icon-sm mr-2" />
                Generate Questions
              </Button>
            </CardContent>
          </Card>

          {questionBank.map((question) => (
            <Card key={question.id} className="question-card">
              <CardHeader className="question-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>{question.subject}</CardTitle>
                    <Badge className="difficulty-badge">{question.difficulty}</Badge>
                    <Badge variant="outline" className="type-badge">{question.type}</Badge>
                  </div>
                  <Badge className="ai-badge">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="question-content">
                <div className="question-section">
                  <p className="section-label">Question:</p>
                  <p className="section-text">{question.question}</p>
                </div>
                <div className="question-section">
                  <p className="section-label">Answer:</p>
                  <p className="section-text">{question.answer}</p>
                </div>
                <div className="question-actions">
                  <Button size="sm" className="primary-btn">Use in Assignment</Button>
                  <Button size="sm" variant="outline" className="secondary-btn">Edit Question</Button>
                  <Button size="sm" variant="outline" className="secondary-btn">Generate Similar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="lessons" className="lessons-content">
          <Card className="lesson-generator">
            <CardHeader className="generator-header">
              <CardTitle>Generate New Lesson Plan</CardTitle>
            </CardHeader>
            <CardContent className="generator-content">
              <div className="form-field">
                <label>Lesson Topic</label>
                <Input 
                  placeholder="e.g., Introduction to Derivatives" 
                  value={lessonForm.topic}
                  onChange={(e) => setLessonForm({...lessonForm, topic: e.target.value})}
                  className="topic-input"
                />
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Grade Level</label>
                  <Select value={lessonForm.grade} onValueChange={(value) => setLessonForm({...lessonForm, grade: value})}>
                    <SelectTrigger className="select-field">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent className="select-options">
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="Grade 11">Grade 11</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <label>Duration (min)</label>
                  <Input 
                    type="number" 
                    placeholder="60" 
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                    className="duration-input"
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Key Learning Objectives</label>
                <Textarea 
                  placeholder="List the main objectives..." 
                  rows={3}
                  value={lessonForm.objectives}
                  onChange={(e) => setLessonForm({...lessonForm, objectives: e.target.value})}
                  className="objectives-textarea"
                />
              </div>
              <Button onClick={handleGenerateLessonPlan} className="generate-btn">
                <Sparkles className="icon-sm mr-2" />
                Generate Lesson Plan
              </Button>
            </CardContent>
          </Card>

          {lessonPlanTemplates.map((lesson) => (
            <Card key={lesson.id} className="lesson-card">
              <CardHeader className="lesson-header">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{lesson.topic}</CardTitle>
                    <p className="lesson-duration">Duration: {lesson.duration}</p>
                  </div>
                  <Badge className="ai-badge">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="lesson-content">
                <div className="lesson-section">
                  <h4 className="section-title">Learning Objectives:</h4>
                  <ul className="objectives-list">
                    {lesson.objectives.map((objective, index) => (
                      <li key={index} className="objective-item">
                        <Target className="objective-icon" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lesson-section">
                  <h4 className="section-title">Activities:</h4>
                  <ul className="activities-list">
                    {lesson.activities.map((activity, index) => (
                      <li key={index} className="activity-item">
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lesson-actions">
                  <Button size="sm" className="primary-btn">Use This Plan</Button>
                  <Button size="sm" variant="outline" className="secondary-btn">Customize</Button>
                  <Button size="sm" variant="outline" className="secondary-btn">Export</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
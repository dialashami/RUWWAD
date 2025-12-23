// Central data store with localStorage persistence

const STORAGE_KEYS = {
  LESSONS: 'ruwwad_lessons',
  ASSIGNMENTS: 'ruwwad_assignments',
  STUDENTS: 'ruwwad_students',
  SUBMISSIONS: 'ruwwad_submissions',
  NOTIFICATIONS: 'ruwwad_notifications',
  CHAT_HISTORY: 'ruwwad_chat_history',
};

// Helper functions for localStorage
function loadFromStorage(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Initial data
const initialStudents = [
  { id: 1, name: 'Ahmed Hassan', grade: 'Grade 10A', avgScore: 95, trend: 'up', assignments: 12, completion: 100, strengths: ['Algebra', 'Calculus'], weaknesses: ['Geometry'], email: 'ahmed.hassan@student.com' },
  { id: 2, name: 'Fatima Ali', grade: 'Grade 10A', avgScore: 88, trend: 'up', assignments: 12, completion: 100, strengths: ['Statistics', 'Algebra'], weaknesses: ['Trigonometry'], email: 'fatima.ali@student.com' },
  { id: 3, name: 'Omar Ibrahim', grade: 'Grade 10A', avgScore: 72, trend: 'down', assignments: 10, completion: 83, strengths: ['Geometry'], weaknesses: ['Algebra', 'Calculus'], email: 'omar.ibrahim@student.com' },
  { id: 4, name: 'Layla Mohammed', grade: 'Grade 9B', avgScore: 92, trend: 'up', assignments: 12, completion: 100, strengths: ['Calculus', 'Statistics'], weaknesses: ['Geometry'], email: 'layla.mohammed@student.com' },
  { id: 5, name: 'Yusuf Ahmad', grade: 'Grade 11A', avgScore: 65, trend: 'stable', assignments: 11, completion: 92, strengths: ['Statistics'], weaknesses: ['Algebra', 'Trigonometry'], email: 'yusuf.ahmad@student.com' },
];

const initialLessons = [
  { 
    id: 1, 
    title: 'Quadratic Equations', 
    subject: 'Mathematics', 
    grade: 'Grade 10', 
    status: 'published', 
    duration: '45 min', 
    students: 62, 
    lastEdited: '2 days ago',
    description: 'Introduction to quadratic equations and their solutions',
    objectives: ['Understand quadratic equations', 'Solve using factoring', 'Apply quadratic formula'],
    materials: ['Textbook Chapter 5', 'Practice worksheets', 'Calculator'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: 2, 
    title: 'Trigonometry Basics', 
    subject: 'Mathematics', 
    grade: 'Grade 11', 
    status: 'published', 
    duration: '60 min', 
    students: 58, 
    lastEdited: '3 days ago',
    description: 'Fundamental concepts of trigonometry',
    objectives: ['Learn sine, cosine, tangent', 'Understand unit circle', 'Solve basic trig problems'],
    materials: ['Trig tables', 'Unit circle diagram', 'Practice problems'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
];

const initialAssignments = [
  { 
    id: 1, 
    title: 'Quadratic Equations Problem Set', 
    subject: 'Mathematics', 
    grade: 'Grade 10', 
    dueDate: 'Oct 18, 2025', 
    totalStudents: 62, 
    submitted: 58, 
    graded: 45, 
    status: 'active',
    instructions: 'Solve all 20 problems showing your work.',
    totalPoints: 100,
    passingScore: 60,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
];

// Store class
class DataStore {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // Lessons
  getLessons() {
    return loadFromStorage(STORAGE_KEYS.LESSONS, initialLessons);
  }

  addLesson(lesson) {
    const lessons = this.getLessons();
    const newLesson = {
      ...lesson,
      id: Date.now(),
      lastEdited: 'Just now',
      students: 0,
      createdAt: new Date().toISOString(),
    };
    lessons.push(newLesson);
    saveToStorage(STORAGE_KEYS.LESSONS, lessons);
    this.notify();
    return newLesson;
  }

  updateLesson(id, updates) {
    const lessons = this.getLessons();
    const index = lessons.findIndex(l => l.id === id);
    if (index !== -1) {
      lessons[index] = { ...lessons[index], ...updates, lastEdited: 'Just now' };
      saveToStorage(STORAGE_KEYS.LESSONS, lessons);
      this.notify();
    }
  }

  deleteLesson(id) {
    const lessons = this.getLessons().filter(l => l.id !== id);
    saveToStorage(STORAGE_KEYS.LESSONS, lessons);
    this.notify();
  }

  // Assignments
  getAssignments() {
    return loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, initialAssignments);
  }

  addAssignment(assignment) {
    const assignments = this.getAssignments();
    const newAssignment = {
      ...assignment,
      id: Date.now(),
      submitted: 0,
      graded: 0,
      status: new Date(assignment.dueDate) > new Date() ? 'upcoming' : 'active',
      createdAt: new Date().toISOString(),
    };
    assignments.push(newAssignment);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
    this.notify();
    return newAssignment;
  }

  updateAssignment(id, updates) {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...updates };
      saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
      this.notify();
    }
  }

  deleteAssignment(id) {
    const assignments = this.getAssignments().filter(a => a.id !== id);
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
    this.notify();
  }

  // Students
  getStudents() {
    return loadFromStorage(STORAGE_KEYS.STUDENTS, initialStudents);
  }

  // Submissions
  getSubmissions() {
    return loadFromStorage(STORAGE_KEYS.SUBMISSIONS, []);
  }

  getSubmissionsByAssignment(assignmentId) {
    return this.getSubmissions().filter(s => s.assignmentId === assignmentId);
  }

  updateSubmission(id, updates) {
    const submissions = this.getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      submissions[index] = { ...submissions[index], ...updates };
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
      this.notify();
    }
  }

  // Notifications
  getNotifications() {
    return loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  addNotification(notification) {
    const notifications = this.getNotifications();
    const newNotification = {
      ...notification,
      id: Date.now(),
      sentAt: new Date().toISOString(),
      readCount: 0,
      status: 'sent',
    };
    notifications.unshift(newNotification);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    this.notify();
    return newNotification;
  }

  scheduleNotification(notification, scheduledTime) {
    const notifications = this.getNotifications();
    const newNotification = {
      ...notification,
      id: Date.now(),
      readCount: 0,
      status: 'scheduled',
    };
    notifications.unshift(newNotification);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    this.notify();
    return newNotification;
  }

  deleteNotification(id) {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    this.notify();
  }

  // Chat History
  getChatHistory() {
    return loadFromStorage(STORAGE_KEYS.CHAT_HISTORY, [
      { 
        role: 'assistant', 
        content: 'Hello! I\'m your AI teaching assistant. I can help you with teaching strategies, generate questions, create lesson plans, and provide insights on student performance. How can I assist you today?',
        timestamp: new Date().toISOString()
      }
    ]);
  }

  addChatMessage(message) {
    const history = this.getChatHistory();
    history.push({ ...message, timestamp: new Date().toISOString() });
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, history);
    this.notify();
  }

  clearChatHistory() {
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, []);
    this.notify();
  }
}

export const store = new DataStore();

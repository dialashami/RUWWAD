


import React, { useState, useEffect, useCallback } from "react";
import "../styles/ChatCenter.css";

// Fallback mock data (used if backend returns empty)
const FALLBACK_CONVERSATIONS = {
  students: [
    {
      id: "mock-student-1",
      name: "Lama Ahmad",
      grade: "Grade 1A",
      lastMessage: "Miss, I finished my homework.",
      lastTime: "10:20 AM",
      unread: 0,
      role: "student",
    },
  ],
  parents: [
    {
      id: "mock-parent-1",
      name: "Mrs. Sara (Lama's Mom)",
      grade: "Parent of Grade 1A",
      lastMessage: "When is the next meeting?",
      lastTime: "Yesterday",
      unread: 0,
      role: "parent",
    },
  ],
};

export const ChatCenter = ({ currentRole = "teacher" }) => {
  const [activeTab, setActiveTab] = useState("students"); // students | parents
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState({ students: [], parents: [] });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user ID from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUserId(parsed?._id || null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch users to chat with (students and parents for teachers, teachers for students)
  const fetchContacts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUserId) {
        setConversations(FALLBACK_CONVERSATIONS);
        setLoading(false);
        return;
      }

      // Fetch all users
      const res = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setConversations(FALLBACK_CONVERSATIONS);
        setLoading(false);
        return;
      }

      const users = await res.json();

      // Also fetch conversations to get unread counts
      let conversationsData = [];
      try {
        const convRes = await fetch(`http://localhost:3000/api/messages/conversations/${currentUserId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (convRes.ok) {
          conversationsData = await convRes.json();
        }
      } catch {
        // ignore
      }

      // Map users to conversation format
      const students = [];
      const parents = [];
      const teachers = [];

      const userIds = new Set();
      
      users.forEach(user => {
        if (user._id === currentUserId) return; // Skip self
        userIds.add(user._id);

        const convData = conversationsData.find(c => c.partnerId === user._id);
        
        const contact = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          grade: user.schoolGrade || user.universityMajor || user.role,
          lastMessage: convData?.lastMessage || 'No messages yet',
          lastTime: convData?.lastMessageTime 
            ? new Date(convData.lastMessageTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '',
          unread: convData?.unreadCount || 0,
          role: user.role,
          email: user.email,
        };

        if (user.role === 'student') students.push(contact);
        else if (user.role === 'parent') parents.push(contact);
        else if (user.role === 'teacher') teachers.push(contact);
      });

      // Add admin contacts from conversations (admin users who sent messages)
      const adminContacts = conversationsData
        .filter(conv => !userIds.has(conv.partnerId))
        .map(conv => ({
          id: conv.partnerId,
          name: conv.partnerName || 'Admin',
          grade: 'Administrator',
          lastMessage: conv.lastMessage || 'No messages yet',
          lastTime: conv.lastMessageTime 
            ? new Date(conv.lastMessageTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '',
          unread: conv.unreadCount || 0,
          role: 'admin',
          email: conv.partnerEmail || '',
        }));

      // For teachers: show students, parents, and admin contacts
      // For students: show teachers and admin contacts
      if (currentRole === 'teacher') {
        setConversations({
          students: students.length > 0 ? students : FALLBACK_CONVERSATIONS.students,
          parents: parents.length > 0 ? parents : FALLBACK_CONVERSATIONS.parents,
          admin: adminContacts,
        });
      } else {
        setConversations({
          students: [], // Students don't chat with other students
          parents: [],
          teachers: teachers.length > 0 ? teachers : [],
          admin: adminContacts,
        });
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setConversations(FALLBACK_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentRole]);

  useEffect(() => {
    if (currentUserId) {
      fetchContacts();
    }
  }, [currentUserId, fetchContacts]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation || !currentUserId) return;

    // Skip mock conversations
    if (selectedConversation.id.toString().startsWith('mock-')) {
      setMessages([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `http://localhost:3000/api/messages/conversation/${currentUserId}/${selectedConversation.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        setMessages([]);
        return;
      }

      const data = await res.json();
      
      // Map to display format
      const mapped = data.map(msg => ({
        id: msg._id,
        from: msg.sender._id === currentUserId ? currentRole : selectedConversation.role,
        text: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
      }));

      setMessages(mapped);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  }, [selectedConversation, currentUserId, currentRole]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Filter conversations by search
  const filteredConversations = (conversations[activeTab] || []).filter((conv) =>
    conv.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    
    // Mark conversation as read - reset unread count to 0
    if (conv.unread > 0) {
      setConversations(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(c => 
          c.id === conv.id ? { ...c, unread: 0 } : c
        )
      }));
      
      // Also mark as read on backend (if not a mock conversation)
      if (!conv.id.toString().startsWith('mock-')) {
        markMessagesAsRead(conv.id);
      }
    }
  };

  // Mark messages as read on backend
  const markMessagesAsRead = async (partnerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUserId) return;

      await fetch(`http://localhost:3000/api/messages/read/${currentUserId}/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Send message to backend
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    // Optimistically add message to UI
    const optimisticMsg = {
      id: Date.now(),
      from: currentRole,
      text: messageText,
      time: "Now",
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Skip backend for mock conversations
    if (selectedConversation.id.toString().startsWith('mock-')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: currentUserId,
          receiver: selectedConversation.id,
          content: messageText,
        }),
      });

      if (!res.ok) {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1>Messages</h1>
          <p>
          
            {" "}({currentRole === "teacher" ? "Teacher view" : "Student view"})
          </p>
        </div>
      </div>

      <div className="chat-layout">
        {}
        <div className="chat-sidebar">
          {currentRole === "teacher" && (
            <div className="chat-tabs">
              <button
                className={activeTab === "students" ? "active" : ""}
                onClick={() => setActiveTab("students")}
              >
                Students
              </button>
              <button
                className={activeTab === "parents" ? "active" : ""}
                onClick={() => setActiveTab("parents")}
              >
                Parents
              </button>
              {conversations.admin && conversations.admin.length > 0 && (
                <button
                  className={activeTab === "admin" ? "active" : ""}
                  onClick={() => setActiveTab("admin")}
                >
                  Admin {conversations.admin.reduce((sum, c) => sum + (c.unread || 0), 0) > 0 && (
                    <span className="tab-badge">{conversations.admin.reduce((sum, c) => sum + (c.unread || 0), 0)}</span>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="chat-search">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="chat-conversation-list">
            {loading ? (
              <div className="chat-empty">Loading contacts...</div>
            ) : filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-conversation-item ${
                  selectedConversation?.id === conv.id ? "selected" : ""
                }`}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className="avatar-circle">
                  {conv.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="chat-conversation-text">
                  <div className="chat-conversation-top">
                    <span className="name">{conv.name}</span>
                    <span className="time">{conv.lastTime}</span>
                  </div>
                  <div className="chat-conversation-bottom">
                    <span className="preview">{conv.lastMessage}</span>
                    {conv.unread > 0 && (
                      <span className="badge">{conv.unread}</span>
                    )}
                  </div>
                  <span className="role-tag">
                    {conv.role === "student" ? "Student" : conv.role === "admin" ? "Admin" : "Parent"}
                  </span>
                </div>
              </div>
            ))}

            {!loading && filteredConversations.length === 0 && (
              <div className="chat-empty">No conversations found</div>
            )}
          </div>
        </div>

        {}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-main-header">
                <div>
                  <h2>{selectedConversation.name}</h2>
                  <p>{selectedConversation.grade}</p>
                </div>
                <div className="chat-main-header-tag">
                  {selectedConversation.role === "student"
                    ? "Student"
                    : selectedConversation.role === "admin"
                    ? "Admin"
                    : "Parent"}
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">Start the conversation ✨</div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message-row ${
                      msg.from === currentRole
                        ? "from-teacher"
                        : "from-other"
                    }`}
                  >
                    <div className="chat-message-bubble">
                      <p>{msg.text}</p>
                      <span className="chat-message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="chat-main-empty">
              <h2>Select a conversation</h2>
              <p>Choose a student or parent from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

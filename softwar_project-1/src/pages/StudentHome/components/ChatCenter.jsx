

import React, { useState, useEffect, useCallback } from "react";
import "../../TeacherHome/styles/ChatCenter.css";
import { useStudent } from "../context/StudentContext";
import { API_CONFIG } from '../../../config/api.config';

// Fallback mock data for teachers (shown to students)
const FALLBACK_TEACHERS = [
  {
    id: "mock-teacher-1",
    name: "Ms. Sarah Johnson",
    grade: "Mathematics Teacher",
    lastMessage: "Great work on your assignment!",
    lastTime: "Yesterday",
    unread: 0,
    role: "teacher",
  },
];

export const ChatCenter = ({ currentRole = "student" }) => {
  const [activeTab, setActiveTab] = useState("teachers"); // teachers | admin
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [contacts, setContacts] = useState({ teachers: [], admin: [] });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Get context functions to update sidebar unread count
  const { decrementUnreadMessages, updateUnreadMessages } = useStudent();

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

  // Fetch teachers to chat with
  const fetchTeachers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUserId) {
  setContacts({ teachers: FALLBACK_TEACHERS, admin: [] });
        setLoading(false);
        return;
      }

      // Fetch all users
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
  setContacts({ teachers: FALLBACK_TEACHERS, admin: [] });
        setLoading(false);
        return;
      }

      const users = await res.json();

      // Also fetch conversations to get unread counts and find users who messaged this student
      let conversationsData = [];
      try {
        const convRes = await fetch(`${API_CONFIG.BASE_URL}/api/messages/conversations/${currentUserId}`, {
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

      // Filter to only teachers
      const teachersList = users
        .filter(user => user.role === 'teacher' && user._id !== currentUserId)
        .map(user => {
          const convData = conversationsData.find(c => c.partnerId === user._id);
          
          return {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            grade: 'Teacher',
            lastMessage: convData?.lastMessage || 'No messages yet',
            lastTime: convData?.lastMessageTime 
              ? new Date(convData.lastMessageTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : '',
            unread: convData?.unreadCount || 0,
            role: 'teacher',
            email: user.email,
          };
        });

      // Add admin contacts from conversations (admin users who sent messages)
      const teacherIds = new Set(teachersList.map(t => t.id));
      const adminContacts = conversationsData
        .filter(conv => !teacherIds.has(conv.partnerId) && conv.partnerRole === 'admin')
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

      // Set contacts with separate teachers and admin arrays
      setContacts({
        teachers: teachersList.length > 0 ? teachersList : FALLBACK_TEACHERS,
        admin: adminContacts,
      });
      
      // Update sidebar with total unread count from all contacts
      const totalUnread = [...teachersList, ...adminContacts].reduce((sum, t) => sum + (t.unread || 0), 0);
      updateUnreadMessages(totalUnread);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts({ teachers: FALLBACK_TEACHERS, admin: [] });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, updateUnreadMessages]);

  useEffect(() => {
    if (currentUserId) {
      fetchTeachers();
    }
  }, [currentUserId, fetchTeachers]);

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
        `${API_CONFIG.BASE_URL}/api/messages/conversation/${currentUserId}/${selectedConversation.id}`,
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
        from: msg.sender._id === currentUserId ? 'student' : 'teacher',
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
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Filter contacts by search based on active tab
  const filteredContacts = (contacts[activeTab] || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    
    // Mark messages as read when selecting a conversation
    if (conv.unread > 0 && currentUserId && !conv.id.toString().startsWith('mock-')) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_CONFIG.BASE_URL}/api/messages/read/${currentUserId}/${conv.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          
          // Update local state to reflect read status
          setContacts(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(t => 
              t.id === conv.id ? { ...t, unread: 0 } : t
            ),
          }));
          
          // Update sidebar unread count
          decrementUnreadMessages(conv.unread);
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
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
      from: 'student',
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

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/messages`, {
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
          <p>Chat with your teachers</p>
        </div>
      </div>

      <div className="chat-layout">
        {/* Sidebar - Contacts list */}
        <div className="chat-sidebar">
          {/* Tabs for Teachers and Admin */}
          <div className="chat-tabs">
            <button
              className={activeTab === "teachers" ? "active" : ""}
              onClick={() => setActiveTab("teachers")}
            >
              Teachers
            </button>
            {contacts.admin && contacts.admin.length > 0 && (
              <button
                className={activeTab === "admin" ? "active" : ""}
                onClick={() => setActiveTab("admin")}
              >
                Admin {contacts.admin.reduce((sum, c) => sum + (c.unread || 0), 0) > 0 && (
                  <span className="tab-badge">{contacts.admin.reduce((sum, c) => sum + (c.unread || 0), 0)}</span>
                )}
              </button>
            )}
          </div>

          <div className="chat-search">
            <input
              type="text"
              placeholder={activeTab === "admin" ? "Search admin..." : "Search teachers..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="chat-conversation-list">
            {loading ? (
              <div className="chat-empty">Loading contacts...</div>
            ) : (
              <>
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`chat-conversation-item ${
                      selectedConversation?.id === contact.id ? "selected" : ""
                    }`}
                    onClick={() => handleSelectConversation(contact)}
                  >
                    <div className="avatar-circle">
                      {contact.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="chat-conversation-text">
                      <div className="chat-conversation-top">
                        <span className="name">{contact.name}</span>
                        <span className="time">{contact.lastTime}</span>
                      </div>
                      <div className="chat-conversation-bottom">
                        <span className="preview">{contact.lastMessage}</span>
                        {contact.unread > 0 && (
                          <span className="badge">{contact.unread}</span>
                        )}
                      </div>
                      <span className="role-tag">{contact.role === 'admin' ? 'Admin' : 'Teacher'}</span>
                    </div>
                  </div>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="chat-empty">{activeTab === "admin" ? "No admin messages" : "No teachers found"}</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-main-header">
                <div>
                  <h2>{selectedConversation.name}</h2>
                  <p>{selectedConversation.grade}</p>
                </div>
                <div className="chat-main-header-tag">{selectedConversation.role === 'admin' ? 'Admin' : 'Teacher'}</div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-empty">Start the conversation ✨</div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`chat-message-row ${
                      msg.from === "student" ? "from-teacher" : "from-other"
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
              <p>Choose a teacher or admin from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

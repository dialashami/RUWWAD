 import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:3000/api";

export const ChatCenter = ({ currentRole = "parent" }) => {
  const [activeTab, setActiveTab] = useState("teachers"); // teachers | admin
  const [contacts, setContacts] = useState({ teachers: [], admin: [] });
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const userId = user._id;

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId || !token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/messages/conversations/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        
        // Separate teachers and admin
        const teacherConversations = data.filter(
          (conv) => conv.partnerRole === "teacher"
        );
        const adminConversations = data.filter(
          (conv) => conv.partnerRole === "admin"
        );
        
        setContacts({
          teachers: teacherConversations,
          admin: adminConversations,
        });
        
        // Select first conversation if available
        if (teacherConversations.length > 0) {
          setSelectedConversation(teacherConversations[0]);
        } else if (adminConversations.length > 0) {
          setSelectedConversation(adminConversations[0]);
          setActiveTab("admin");
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [userId, token]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation || !userId || !token) return;
      try {
        const res = await fetch(
          `${API_BASE}/messages/conversation/${userId}/${selectedConversation.partnerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
        
        // Mark messages as read
        await fetch(
          `${API_BASE}/messages/read/${userId}/${selectedConversation.partnerId}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [selectedConversation, userId, token]);

  // Filter contacts by search based on active tab
  const filteredContacts = (contacts[activeTab] || []).filter((conv) =>
    conv.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !token) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: userId,
          receiver: selectedConversation.partnerId,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const sentMessage = await res.json();

      // Add to local messages
      setMessages((prev) => [...prev, {
        ...sentMessage,
        sender: { _id: userId, firstName: user.firstName, lastName: user.lastName },
        receiver: { _id: selectedConversation.partnerId },
      }]);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="chat-page-parent">
      <div className="chat-header-parent">
        <div className="header-content">
          <h1>Messages</h1>
          <p> </p>
        </div>
      </div>

      <div className="chat-layout-parent">
        {/* Sidebar */}
        <div className="chat-sidebar-parent">
          <div className="parent-tabs">
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
                Admin {contacts.admin.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
                  <span className="tab-badge">{contacts.admin.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}</span>
                )}
              </button>
            )}
          </div>

          <div className="chat-search-parent">
            <input
              type="text"
              placeholder={activeTab === "admin" ? "Search admin..." : "Search teachers..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="chat-conversation-list-parent">
            {loading ? (
              <div className="chat-empty-parent">Loading conversations...</div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((conv) => (
                <div
                  key={conv.partnerId}
                  className={`chat-conversation-item-parent ${
                    selectedConversation?.partnerId === conv.partnerId ? "selected" : ""
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="avatar-circle-parent">
                    {conv.partnerName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="chat-conversation-text-parent">
                    <div className="chat-conversation-top-parent">
                      <span className="name">{conv.partnerName}</span>
                      <span className="time">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <div className="chat-conversation-middle-parent">
                      <span className="subject">{conv.partnerRole === 'admin' ? 'Admin' : 'Teacher'}</span>
                    </div>
                    <div className="chat-conversation-bottom-parent">
                      <span className="preview">{conv.lastMessage}</span>
                      {conv.unreadCount > 0 && (
                        <span className="badge-parent">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-empty-parent">{activeTab === "admin" ? "No admin messages" : "No conversations with teachers yet"}</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main-parent">
          {selectedConversation ? (
            <>
              <div className="chat-main-header-parent">
                <div className="header-info">
                  <div className="avatar-circle-parent main-avatar">
                    {selectedConversation.partnerName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2>{selectedConversation.partnerName}</h2>
                    <p>{selectedConversation.partnerRole === 'admin' ? 'Administrator' : 'Teacher'}</p>
                  </div>
                </div>
                <div className="chat-main-header-tag-parent teacher">
                  {selectedConversation.partnerRole === 'admin' ? 'Admin' : 'Teacher'}
                </div>
              </div>

              <div className="chat-messages-parent">
                {messages.length === 0 && (
                  <div className="chat-empty-parent">Start the conversation ✨</div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message-row-parent ${
                      msg.sender?._id === userId || msg.sender === userId
                        ? "from-parent"
                        : "from-other"
                    }`}
                  >
                    <div className="chat-message-bubble-parent">
                      <p>{msg.content}</p>
                      <span className="chat-message-time-parent">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form className="chat-input-area-parent" onSubmit={handleSend}>
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="send-button-parent">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-main-empty-parent">
              <div className="empty-icon">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose a teacher or staff member to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
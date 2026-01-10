import { useState, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Search,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { API_CONFIG } from '../../../config/api.config';

const API_BASE = API_CONFIG.BASE_URL + '/api';

export function CommunicationCenter({ initialChatName, initialTab = 'messages' }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab || 'messages');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [recipientGroup, setRecipientGroup] = useState('all'); // all, students, teachers, parents
  const [recipientTarget, setRecipientTarget] = useState('all'); // 'all' or specific user id
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch all users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/admin/users?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Transform users into conversation format
          const users = data.users || [];
          const allUsers = users.map(u => {
            let roleDisplay = '';
            if (u.role === 'student') {
              roleDisplay = `Student${u.schoolGrade ? ` - ${u.schoolGrade.replace('grade', 'Grade ')}` : ''}`;
            } else if (u.role === 'teacher') {
              roleDisplay = u.teacherType === 'university' ? 'University Teacher' : 'School Teacher';
            } else if (u.role === 'parent') {
              roleDisplay = 'Parent';
            } else {
              roleDisplay = u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'User';
            }
            
            return {
              id: u._id,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              email: u.email,
              phone: u.phone || '',
              role: roleDisplay,
              userRole: u.role,
              subject: u.subject,
              avatar: `${(u.firstName || 'U')[0]}${(u.lastName || '')[0] || ''}`.toUpperCase(),
              online: u.isActive,
              lastMessage: '',
              time: '',
              unread: 0,
            };
          });
          setConversations(allUsers);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  // Get current admin user ID
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser._id || currentUser.id || 'admin';
  
  console.log('Current user:', currentUser);
  console.log('Current user ID:', currentUserId);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Users available for the currently selected recipient group
  const getRecipientUsersForGroup = () => {
    if (recipientGroup === 'students') {
      return conversations.filter((c) => c.userRole === 'student');
    }
    if (recipientGroup === 'teachers') {
      return conversations.filter((c) => c.userRole === 'teacher');
    }
    if (recipientGroup === 'parents') {
      return conversations.filter((c) => c.userRole === 'parent');
    }
    return [];
  };

  const recipientUsersInGroup = getRecipientUsersForGroup();

  const getRecipientGroupLabel = () => {
    if (recipientGroup === 'students') return 'Students';
    if (recipientGroup === 'teachers') return 'Teachers';
    if (recipientGroup === 'parents') return 'Parents';
    return '';
  };

  const getRecipientIdsForSelection = () => {
    if (recipientTarget && recipientTarget !== 'all') {
      return [recipientTarget];
    }

    if (!recipientGroup || recipientGroup === 'all') {
      return conversations.map((c) => c.id);
    }

    const groupUsers = getRecipientUsersForGroup();
    return groupUsers.map((u) => u.id);
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in both subject and message before sending.');
      return;
    }

    const recipientIds = getRecipientIdsForSelection();
    if (!recipientIds || recipientIds.length === 0) {
      alert('No recipients found for selected criteria.');
      return;
    }

    try {
      setSendingEmail(true);
      let successCount = 0;

      for (const userId of recipientIds) {
        try {
          const singleRes = await fetch(`${API_BASE}/notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user: userId,
              title: emailSubject.trim(),
              message: emailBody.trim(),
              type: 'message',
            }),
          });

          const singleData = await singleRes.json().catch(() => ({}));

          if (!singleRes.ok) {
            console.error('Failed to create notification for user', userId, singleRes.status, singleData);
            continue;
          }

          successCount++;
        } catch (singleErr) {
          console.error('Error creating notification for user', userId, singleErr);
        }
      }

      if (successCount === 0) {
        alert('Failed to send email notifications.');
        return;
      }

      alert(`Email notifications sent to ${successCount} recipient(s).`);
      setEmailBody('');
      setEmailSubject('');
    } catch (err) {
      console.error('Error sending bulk email notification:', err);
      alert('Error sending email notifications: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  // Fetch messages when a chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !currentUserId) return;
      
      try {
        const res = await fetch(`${API_BASE}/messages/conversation/${currentUserId}/${selectedChat.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const messages = await res.json();
          const formattedMessages = messages.map(msg => ({
            id: msg._id,
            sender: msg.sender._id === currentUserId ? 'me' : 'other',
            content: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setChatMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();
  }, [selectedChat, currentUserId, token]);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called');
    console.log('message:', message);
    console.log('selectedChat:', selectedChat);
    console.log('currentUserId:', currentUserId);
    
    if (!message.trim()) {
      console.log('Message is empty');
      return;
    }
    if (!selectedChat) {
      console.log('No chat selected');
      return;
    }
    if (!currentUserId) {
      console.log('No current user ID');
      return;
    }

    try {
      const requestBody = {
        sender: currentUserId,
        receiver: selectedChat.id,
        content: message.trim(),
      };
      console.log('Sending request:', requestBody);
      
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', res.status);
      
      if (res.ok) {
        const savedMsg = await res.json();
        console.log('Message saved:', savedMsg);
        const newMsg = {
          id: savedMsg._id,
          sender: 'me',
          content: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, newMsg]);
        setMessage('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to send message:', res.status, errorData);
        alert('Failed to send message: ' + (errorData.message || res.statusText));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message: ' + err.message);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialChatName && conversations.length > 0) {
      const conv = conversations.find((c) => c.name === initialChatName);
      if (conv) {
        setSelectedChat(conv);
        setActiveTab('messages');
      }
    }
  }, [initialChatName, conversations]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Communication Center</h1>
        <p className="text-gray-600">Connect with teachers, parents, and students</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white">
          <Mail className="w-5 h-5" />
          Email
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-gray-900 mb-4">Send Bulk Email</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Recipients</label>
            <select
              value={recipientGroup}
              onChange={(e) => {
                setRecipientGroup(e.target.value);
                setRecipientTarget('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
              <option value="parents">Parents Only</option>
            </select>
          </div>
          {recipientGroup !== 'all' && (
            <div>
              <label className="block text-gray-700 mb-2">Target in this category</label>
              <select
                value={recipientTarget}
                onChange={(e) => setRecipientTarget(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All {getRecipientGroupLabel()}</option>
                {recipientUsersInGroup.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email subject"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Message</label>
            <textarea
              rows={8}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your message here..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Save as Draft
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Message = require('../models/Message');
const User = require('../models/user_model');
const mongoose = require('mongoose');

exports.sendMessage = async (req, res, next) => {
  try {
    const { sender, receiver, content, course } = req.body;
    
    // Determine the sender ID
    let senderId = sender;
    
    // Check if sender is a valid ObjectId
    const isValidObjectId = (id) => {
      return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
    };
    
    // If sender is 'admin' or not a valid ObjectId, find a system user to use as sender
    if (!senderId || senderId === 'admin' || !isValidObjectId(senderId)) {
      // Try to use req.userId if it's a valid ObjectId
      if (req.userId && isValidObjectId(req.userId)) {
        senderId = req.userId;
      } else {
        // Find the permanent admin user by email
        let adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' });
        if (!adminUser) {
          return res.status(400).json({ message: 'Admin user not found. Please ensure the admin account exists.' });
        }
        senderId = adminUser._id;
      }
    }
    
    if (!senderId || !receiver || !content) {
      return res.status(400).json({ message: 'Sender, receiver, and content are required' });
    }
    
    const message = await Message.create({
      sender: senderId,
      receiver,
      content,
      course: course || undefined,
    });
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    next(err);
  }
};

exports.getMessagesForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
      .sort({ createdAt: -1 })
      .populate('sender receiver');
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    next(err);
  }
};

// Get conversation between two users
exports.getConversation = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender receiver', 'firstName lastName email role');
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// Get all conversations for a user (grouped by other participant)
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.json([]);
    }
    
    // Get all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender receiver', 'firstName lastName email role');

    // Group by conversation partner
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      // Skip messages with missing sender or receiver (deleted users)
      if (!msg.sender || !msg.receiver || !msg.sender._id || !msg.receiver._id) {
        return;
      }
      
      const partnerId = msg.sender._id.toString() === userId 
        ? msg.receiver._id.toString() 
        : msg.sender._id.toString();
      
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        conversationsMap.set(partnerId, {
          partnerId,
          partnerName: `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || 'Unknown',
          partnerEmail: partner.email || '',
          partnerRole: partner.role || 'user',
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      }
      
      // Count unread messages from partner
      if (msg.receiver._id.toString() === userId && !msg.isRead) {
        const conv = conversationsMap.get(partnerId);
        if (conv) conv.unreadCount++;
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    console.error('getConversations error:', err);
    next(err);
  }
};

// Delete a message
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

// Mark all messages in a conversation as read
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { userId, partnerId } = req.params;
    
    // Mark all messages from partner to user as read
    const result = await Message.updateMany(
      { sender: partnerId, receiver: userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ 
      message: 'Messages marked as read', 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    next(err);
  }
};

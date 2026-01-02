const Message = require('../models/Message');
const User = require('../models/user_model');
const mongoose = require('mongoose');
const { resolveUserId, isValidObjectId } = require('../utils/userIdResolver');

exports.sendMessage = async (req, res, next) => {
  try {
    const { sender, receiver, content, course } = req.body;
    
    // Resolve sender ID - handle 'admin' or invalid ObjectId
    let senderId = await resolveUserId(sender || req.userId);
    
    if (!senderId) {
      return res.status(400).json({ message: 'Could not resolve sender. Please ensure you are logged in.' });
    }
    
    if (!receiver || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
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
    let userId = req.params.userId;
    
    // Resolve 'admin' or invalid userId to real ObjectId
    if (!isValidObjectId(userId)) {
      userId = await resolveUserId(userId);
      if (!userId) {
        return res.json([]);
      }
    }
    
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
    let { userId1, userId2 } = req.params;
    
    // Resolve 'admin' or invalid userIds to real ObjectIds
    if (!isValidObjectId(userId1)) {
      userId1 = await resolveUserId(userId1);
      if (!userId1) return res.json([]);
    }
    if (!isValidObjectId(userId2)) {
      userId2 = await resolveUserId(userId2);
      if (!userId2) return res.json([]);
    }
    
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
    let userId = req.params.userId;
    console.log('[getConversations] Initial userId:', userId);
    
    if (!userId) {
      return res.json([]);
    }
    
    // Resolve 'admin' or invalid userId to real ObjectId
    if (!isValidObjectId(userId)) {
      userId = await resolveUserId(userId);
      console.log('[getConversations] Resolved userId:', userId);
      if (!userId) {
        return res.json([]);
      }
    }
    
    // Ensure userId is a string for comparison
    const userIdStr = userId.toString();
    console.log('[getConversations] Using userIdStr:', userIdStr);
    
    // Get all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender receiver', 'firstName lastName email role');

    console.log('[getConversations] Found', messages.length, 'messages');

    // Group by conversation partner
    const conversationsMap = new Map();
    
    try {
      messages.forEach(msg => {
        // Skip messages with missing sender or receiver (deleted users)
        if (!msg.sender || !msg.receiver) {
          console.log('[getConversations] Skipping message with missing sender/receiver');
          return;
        }
        if (!msg.sender._id || !msg.receiver._id) {
          console.log('[getConversations] Skipping message with missing sender/receiver _id');
          return;
        }
        
        const partnerId = msg.sender._id.toString() === userIdStr 
          ? msg.receiver._id.toString() 
          : msg.sender._id.toString();
        
        if (!conversationsMap.has(partnerId)) {
          const partner = msg.sender._id.toString() === userIdStr ? msg.receiver : msg.sender;
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
        if (msg.receiver._id.toString() === userIdStr && !msg.isRead) {
          const conv = conversationsMap.get(partnerId);
          if (conv) conv.unreadCount++;
        }
      });
    } catch (forEachErr) {
      console.error('[getConversations] Error in forEach:', forEachErr);
      throw forEachErr;
    }

    console.log('[getConversations] Returning', conversationsMap.size, 'conversations');
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
    let { userId, partnerId } = req.params;
    
    // Resolve 'admin' or invalid userIds to real ObjectIds
    if (!isValidObjectId(userId)) {
      userId = await resolveUserId(userId);
      if (!userId) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
    }
    if (!isValidObjectId(partnerId)) {
      partnerId = await resolveUserId(partnerId);
      if (!partnerId) {
        return res.status(400).json({ message: 'Invalid partner ID' });
      }
    }
    
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

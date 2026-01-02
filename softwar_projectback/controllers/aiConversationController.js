const AIConversation = require('../models/AIConversation');
const { resolveUserId, isValidObjectId } = require('../utils/userIdResolver');

// Helper to get resolved userId
const getResolvedUserId = async (reqUserId) => {
  if (!reqUserId) return null;
  if (!isValidObjectId(reqUserId)) {
    return await resolveUserId(reqUserId);
  }
  return reqUserId;
};

// Get all conversations for the authenticated user
exports.getConversations = async (req, res, next) => {
  try {
    let userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversations = await AIConversation.find({ 
      user: userId, 
      isDeleted: false 
    })
      .select('title preview messageCount createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.json(conversations);
  } catch (err) {
    console.error('Error getting AI conversations:', err);
    next(err);
  }
};

// Get a single conversation with all messages
exports.getConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversation = await AIConversation.findOne({ 
      _id: id, 
      user: userId,
      isDeleted: false 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error getting AI conversation:', err);
    next(err);
  }
};

// Create a new conversation
exports.createConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { title, preview, messages } = req.body;

    const conversation = await AIConversation.create({
      user: userId,
      title: title || 'New Conversation',
      preview: preview || '',
      messages: messages || [],
      messageCount: messages ? messages.length : 0
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error('Error creating AI conversation:', err);
    next(err);
  }
};

// Update a conversation (add messages)
exports.updateConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { title, preview, messages, messageCount } = req.body;

    const conversation = await AIConversation.findOne({ 
      _id: id, 
      user: userId,
      isDeleted: false 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Update fields
    if (title) conversation.title = title;
    if (preview) conversation.preview = preview;
    if (messages) conversation.messages = messages;
    if (messageCount !== undefined) conversation.messageCount = messageCount;

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error('Error updating AI conversation:', err);
    next(err);
  }
};

// Delete a conversation (soft delete)
exports.deleteConversation = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: id, user: userId },
      { isDeleted: true },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting AI conversation:', err);
    next(err);
  }
};

// Add a message to an existing conversation
exports.addMessage = async (req, res, next) => {
  try {
    let userId = req.userId;
    const { id } = req.params;
    const { type, text } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Resolve 'admin' to real ObjectId
    userId = await getResolvedUserId(userId);
    if (!userId) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!type || !text) {
      return res.status(400).json({ message: 'Message type and text are required' });
    }

    const conversation = await AIConversation.findOne({ 
      _id: id, 
      user: userId,
      isDeleted: false 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.messages.push({ type, text });
    conversation.messageCount = conversation.messages.length;
    
    // Update preview with latest user message
    if (type === 'user') {
      conversation.preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    }

    await conversation.save();

    res.json(conversation);
  } catch (err) {
    console.error('Error adding message to AI conversation:', err);
    next(err);
  }
};

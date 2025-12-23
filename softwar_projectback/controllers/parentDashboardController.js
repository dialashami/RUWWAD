const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/user_model');

// Parent dashboard: view children's progress and activity
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || userPayload.role !== 'parent') {
      return res.status(403).json({ message: 'Parent access required' });
    }

    // Get the parent's profile
    const parent = await User.findById(userId);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // For now, parents can view all students (in a real app, you'd have a parent-child relationship)
    // This could be enhanced with a 'children' field on the parent user model
    
    // Get parent's messages and notifications
    const [messages, notifications] = await Promise.all([
      Message.find({ $or: [{ sender: userId }, { receiver: userId }] })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('sender receiver', 'firstName lastName role'),
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Unread counts
    const unreadMessages = messages.filter(
      m => m.receiver && m.receiver._id && m.receiver._id.toString() === userId && !m.isRead
    ).length;
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    // Recent activity
    const recentActivities = notifications.slice(0, 10).map(n => ({
      type: 'notification',
      id: n._id,
      title: n.title,
      description: n.body,
      createdAt: n.createdAt,
      isRead: n.isRead,
    }));

    return res.json({
      parentId: userId,
      parentName: `${parent.firstName} ${parent.lastName}`,
      stats: {
        unreadMessages,
        unreadNotifications,
      },
      messages: messages.slice(0, 10),
      notifications: notifications.slice(0, 10),
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};

// Get children's progress (placeholder - requires parent-child relationship in DB)
exports.getChildrenProgress = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || userPayload.role !== 'parent') {
      return res.status(403).json({ message: 'Parent access required' });
    }

    // In a real implementation, you would:
    // 1. Have a 'children' array on the parent user model
    // 2. Fetch each child's courses, assignments, and grades
    // For now, return empty array as placeholder
    
    return res.json({
      children: [],
      message: 'Child management feature coming soon. Please contact admin to link your children to your account.',
    });
  } catch (err) {
    next(err);
  }
};

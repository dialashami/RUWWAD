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

    // Log for debugging
    console.log('Parent Dashboard - userId:', userId, 'role:', userPayload?.role);

    // Allow parent role (case-insensitive check for consistency)
    const role = (userPayload?.role || '').toLowerCase();
    if (!userId || role !== 'parent') {
      return res.status(403).json({ message: `Parent access required. Current role: ${userPayload?.role || 'unknown'}` });
    }

    // Get the parent's profile with populated children
    const parent = await User.findById(userId).populate('children', '-password');
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Get linked children from parent profile
    const children = parent.children || [];
    
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

    // Recent activity - combine notifications and children activities
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
        totalChildren: children.length,
      },
      children: children.map(child => ({
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        studentType: child.studentType,
        schoolGrade: child.schoolGrade,
        universityMajor: child.universityMajor,
        profileImage: child.profileImage,
        avgScore: child.avgScore || 0,
      })),
      messages: messages.slice(0, 10),
      notifications: notifications.slice(0, 10),
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};

// Get children's progress - fetches all linked children with their academic progress
exports.getChildrenProgress = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    // Allow parent role (case-insensitive check for consistency)
    const role = (userPayload?.role || '').toLowerCase();
    if (!userId || role !== 'parent') {
      return res.status(403).json({ message: 'Parent access required' });
    }

    // Get parent with populated children
    const parent = await User.findById(userId).populate('children', '-password');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    const children = parent.children || [];
    
    if (children.length === 0) {
      return res.json({
        children: [],
        message: 'No children linked to your account. Go to Settings to link your children.',
      });
    }

    // Return basic children info - detailed data is fetched per child via /api/users/children/:childId/dashboard
    return res.json({
      children: children.map(child => ({
        _id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        studentType: child.studentType,
        schoolGrade: child.schoolGrade,
        universityMajor: child.universityMajor,
        profileImage: child.profileImage,
        avgScore: child.avgScore || 0,
        achievements: child.achievements || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

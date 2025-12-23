const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const User = require('../models/user_model');

const ADMIN_EMAIL = 'aboodjamal684@gmail.com';

// Admin dashboard: system-wide stats and management
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    // Allow both 'admin' role and hardcoded admin
    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Calculate date for last month comparison
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get system-wide counts
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalParents,
      totalTrainees,
      totalCourses,
      activeCourses,
      totalAssignments,
      totalMessages,
      totalNotifications,
      totalFeedbacks,
      recentUsers,
      recentFeedbacks,
      // Last month counts for percentage calculation
      lastMonthUsers,
      lastMonthStudents,
      lastMonthTeachers,
      lastMonthParents,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' }, email: { $ne: ADMIN_EMAIL } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'parent' }),
      User.countDocuments({ role: 'trainee' }),
      Course.countDocuments(),
      Course.countDocuments({ isActive: true }),
      Assignment.countDocuments(),
      Message.countDocuments(),
      Notification.countDocuments(),
      Feedback.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
      Feedback.find().sort({ createdAt: -1 }).limit(10).populate('author', 'firstName lastName role'),
      // Count users created in the last month
      User.countDocuments({ role: { $ne: 'admin' }, email: { $ne: ADMIN_EMAIL }, createdAt: { $gte: oneMonthAgo } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: oneMonthAgo } }),
      User.countDocuments({ role: 'teacher', createdAt: { $gte: oneMonthAgo } }),
      User.countDocuments({ role: 'parent', createdAt: { $gte: oneMonthAgo } }),
    ]);

    // Calculate percentage changes (new users this month / total before this month * 100)
    const calcPercentChange = (total, newThisMonth) => {
      const previousTotal = total - newThisMonth;
      if (previousTotal === 0) return newThisMonth > 0 ? 100 : 0;
      return ((newThisMonth / previousTotal) * 100).toFixed(1);
    };

    const userChange = calcPercentChange(totalUsers, lastMonthUsers);
    const studentChange = calcPercentChange(totalStudents, lastMonthStudents);
    const teacherChange = calcPercentChange(totalTeachers, lastMonthTeachers);
    const parentChange = calcPercentChange(totalParents, lastMonthParents);

    // Calculate parent engagement (parents with children / total parents * 100)
    const parentsWithChildren = await User.countDocuments({ role: 'parent', children: { $exists: true, $ne: [] } });
    const parentEngagement = totalParents > 0 ? ((parentsWithChildren / totalParents) * 100).toFixed(1) : 0;

    // Calculate average rating from feedbacks
    const feedbacksWithRating = await Feedback.find({ rating: { $exists: true, $ne: null } });
    const avgRating = feedbacksWithRating.length > 0
      ? (feedbacksWithRating.reduce((sum, f) => sum + f.rating, 0) / feedbacksWithRating.length).toFixed(1)
      : 0;

    // Recent activity (new users and feedbacks)
    const recentActivities = [
      ...recentUsers.map(u => ({
        type: 'new_user',
        id: u._id,
        title: `New ${u.role}: ${u.firstName} ${u.lastName}`,
        description: u.email,
        createdAt: u.createdAt,
      })),
      ...recentFeedbacks.map(f => ({
        type: 'feedback',
        id: f._id,
        title: `Feedback from ${f.author?.firstName || 'User'}`,
        description: f.comment?.substring(0, 50) || `Rating: ${f.rating}/5`,
        createdAt: f.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);

    return res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        totalTrainees,
        totalCourses,
        activeCourses,
        totalAssignments,
        totalMessages,
        totalNotifications,
        totalFeedbacks,
        avgRating: parseFloat(avgRating),
        // Percentage changes
        userChange: parseFloat(userChange),
        studentChange: parseFloat(studentChange),
        teacherChange: parseFloat(teacherChange),
        parentChange: parseFloat(parentChange),
        parentEngagement: parseFloat(parentEngagement),
      },
      recentUsers,
      recentFeedbacks,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
};

// Get all users with filtering and pagination
exports.getUsers = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {
      role: { $ne: 'admin' }, // Exclude admin users from the list
    };

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('children', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    // Debug: log first user's avgScore
    if (users.length > 0) {
      console.log('=== GET USERS ===');
      console.log('First user avgScore from DB:', users[0].avgScore);
    }

    // Enrich user data with additional info
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // For students: get enrolled courses count and parent info
      if (user.role === 'student') {
        // Count courses where this student is enrolled
        const enrolledCoursesCount = await Course.countDocuments({ students: user._id });
        userObj.enrolledCoursesCount = enrolledCoursesCount;
        
        // Get course names
        const enrolledCourses = await Course.find({ students: user._id }).select('title');
        userObj.enrolledCourses = enrolledCourses.map(c => c.title);
        
        // Find parent - first check if student has parent field, then fallback to checking children array
        let parent = null;
        if (user.parent) {
          parent = await User.findById(user.parent).select('firstName lastName email');
        }
        if (!parent) {
          // Fallback: find parent who has this student in their children array
          parent = await User.findOne({ role: 'parent', children: user._id }).select('firstName lastName email');
        }
        if (parent) {
          userObj.parentName = `${parent.firstName} ${parent.lastName}`;
          userObj.parentEmail = parent.email;
          userObj.parentId = parent._id;
        }
      }
      
      // For teachers: get student count and course count
      if (user.role === 'teacher') {
        const teacherCourses = await Course.find({ teacher: user._id });
        const studentIds = new Set();
        teacherCourses.forEach(course => {
          course.students?.forEach(s => studentIds.add(s.toString()));
        });
        userObj.studentCount = studentIds.size;
        userObj.courseCount = teacherCourses.length;
        userObj.courseNames = teacherCourses.map(c => c.title);
        userObj.teacherType = user.teacherType || '';
        userObj.subject = user.subject || '';
        userObj.specialization = user.specialization || '';
        console.log('Teacher data:', { name: userObj.firstName, teacherType: userObj.teacherType, subject: userObj.subject, specialization: userObj.specialization });
      }
      
      return userObj;
    }));

    return res.json({
      users: enrichedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get system reports
exports.getReports = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get registration stats by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const registrationStats = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            role: '$role',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get course creation stats
    const courseStats = await Course.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get assignment stats
    const assignmentStats = await Assignment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return res.json({
      registrationStats,
      courseStats,
      assignmentStats,
    });
  } catch (err) {
    next(err);
  }
};

// Update a user
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('=== UPDATE USER ===');
    console.log('ID:', id);
    console.log('Received data:', updateData);

    // Remove fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.role;

    // Validate that we have something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    console.log('Data to save:', updateData);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: false }
    ).select('-password');

    console.log('Updated user avgScore:', updatedUser?.avgScore);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Update user status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'User status updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// Send system-wide notification
exports.sendSystemNotification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, body, targetRole } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    // Get target users
    const filter = targetRole ? { role: targetRole } : {};
    const users = await User.find(filter).select('_id');

    // Create notifications for all target users
    const notifications = users.map(user => ({
      user: user._id,
      title,
      body,
      type: 'system',
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    return res.status(201).json({
      message: `Notification sent to ${notifications.length} users`,
      count: notifications.length,
    });
  } catch (err) {
    next(err);
  }
};

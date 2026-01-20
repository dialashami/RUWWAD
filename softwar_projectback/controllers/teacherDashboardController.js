const mongoose = require('mongoose');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/user_model');
const { CacheManager, FastQuery } = require('../utils/dbOptimizer');

// Teacher dashboard: aggregate key stats and recent activity for logged-in teacher
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    // Log for debugging
    console.log('Teacher Dashboard - userId:', userId, 'role:', userPayload?.role);

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Allow teacher role (case-insensitive check)
    const role = (userPayload?.role || '').toLowerCase();
    if (role !== 'teacher') {
      return res.status(403).json({ message: `Teacher access required. Current role: ${userPayload?.role || 'unknown'}` });
    }

    // Return cached dashboard if available (short TTL)
    const cacheKey = `teacherDashboard:${userId}`;
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const teacherObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch all data in parallel - OPTIMIZED with lean(), projections, and aggregates
    const [
      courses,
      totalAssignments,
      submissionsSummary,
      recentAssignments,
      recentAssignmentsWeek,
      totalStudentsCount,
      sentMessages,
      receivedMessages,
      notifications,
      totalTeachersCount
    ] = await Promise.all([
      Course.find({ teacher: userId })
        .select('title description subject grade students isActive zoomLink createdAt scheduleTime')
        .lean(),
      Assignment.countDocuments({ teacher: userId }),
      Assignment.aggregate([
        { $match: { teacher: teacherObjectId } },
        {
          $project: {
            submissionsCount: { $size: { $ifNull: ['$submissions', []] } },
            pendingSubmissionsCount: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$submissions', []] },
                  as: 's',
                  cond: {
                    $and: [
                      { $or: [{ $eq: ['$$s.grade', null] }, { $eq: ['$$s.grade', undefined] }] },
                      { $or: [{ $eq: ['$$s.feedback', null] }, { $eq: ['$$s.feedback', undefined] }] }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: '$submissionsCount' },
            pendingSubmissions: { $sum: '$pendingSubmissionsCount' }
          }
        }
      ]),
      Assignment.find({ teacher: userId })
        .select({ title: 1, description: 1, createdAt: 1, updatedAt: 1, submissions: { $slice: 3 } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Assignment.find({ teacher: userId, createdAt: { $gte: sevenDaysAgo } })
        .select('createdAt')
        .lean(),
      User.countDocuments({ role: 'student' }),
      Message.find({ sender: userId })
        .select('content createdAt isRead')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Message.find({ receiver: userId })
        .select('content createdAt isRead')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.find({ user: userId })
        .select('title body isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      User.countDocuments({ role: 'teacher' })
    ]);

    // Calculate real stats
    // 1. Total students in system (or enrolled in teacher's courses)
    const studentIds = new Set();
    courses.forEach((course) => {
      (course.students || []).forEach((s) => {
        studentIds.add(String(s));
      });
    });
    // If no students enrolled in courses, show total students in system
    const totalStudents = studentIds.size > 0 ? studentIds.size : totalStudentsCount;

    // 2. Active courses count
    const activeCourses = courses.filter((c) => c.isActive !== false).length;

    // 3. Total assignments
    const totalAssignmentsCount = totalAssignments || 0;

    // 4. Calculate submissions count from aggregate
    const summary = submissionsSummary && submissionsSummary[0]
      ? submissionsSummary[0]
      : { totalSubmissions: 0, pendingSubmissions: 0 };
    const totalSubmissions = summary.totalSubmissions || 0;
    const pendingSubmissions = summary.pendingSubmissions || 0;

    // 5. Activity rate (percentage based on recent activity)
    const recentAssignmentsForRate = recentAssignmentsWeek || [];
    const recentMessages = [...sentMessages, ...receivedMessages].filter((m) => new Date(m.createdAt) >= sevenDaysAgo);
    // Calculate activity rate as percentage (max 100)
    const activityScore = recentAssignmentsForRate.length * 10 + recentMessages.length * 5;
    const activityRate = Math.min(activityScore, 100);

    // 6. Unread messages count
    const unreadMessages = receivedMessages.filter(m => !m.isRead).length;

    // Build recent activities from multiple sources
    const recentActivities = [];

    // Add recent assignments
    recentAssignments.slice(0, 5).forEach((a) => {
      recentActivities.push({
        type: 'assignment',
        id: a._id,
        title: `Created: ${a.title}`,
        description: a.description?.substring(0, 50) || '',
        createdAt: a.createdAt,
      });
    });

    // Add recent submissions
    recentAssignments.forEach((a) => {
      (a.submissions || []).slice(0, 3).forEach((sub) => {
        recentActivities.push({
          type: 'submission',
          id: sub._id || a._id,
          title: `Submission on ${a.title}`,
          description: sub.studentId ? 'Student submitted work' : 'New submission',
          createdAt: sub.submittedAt || a.updatedAt,
        });
      });
    });

    // Add recent messages
    receivedMessages.slice(0, 5).forEach((m) => {
      recentActivities.push({
        type: 'message',
        id: m._id,
        title: 'New message received',
        description: m.content?.substring(0, 50) || '',
        createdAt: m.createdAt,
      });
    });

    // Sort by date and limit
    recentActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = recentActivities.slice(0, 10);

    // Build upcoming lessons from courses with schedule
    const upcomingLessons = courses
      .filter(c => c.isActive !== false)
      .slice(0, 5)
      .map((c, index) => ({
        id: c._id,
        title: c.title,
        grade: c.grade || 'All Grades',
        subject: c.subject || 'Course',
        time: c.scheduleTime 
          ? new Date(c.scheduleTime).toLocaleString()
          : index === 0 ? 'Today, 10:00 AM' : index === 1 ? 'Today, 2:00 PM' : 'This week',
        room: c.zoomLink ? 'Online (Zoom)' : `Room ${100 + index}`,
        zoomLink: c.zoomLink,
      }));

    // Build weekly stats based on recent activity
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      
      // Count activities for this day
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      let activityCount = 0;
      
      // Count assignments created on this day
      activityCount += recentAssignmentsWeek.filter(a => {
        const createdAt = new Date(a.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length * 20;
      
      // Count messages sent/received on this day
      activityCount += [...sentMessages, ...receivedMessages].filter(m => {
        const createdAt = new Date(m.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length * 10;
      
      // Cap at 100
      weeklyStats.push({
        day: dayName,
        value: Math.min(activityCount, 100)
      });
    }

    const responsePayload = {
      teacherId: userId,
      stats: {
        totalStudents,
        activeCourses,
        totalAssignments: totalAssignmentsCount,
        totalSubmissions,
        pendingSubmissions,
        activityRate,
        unreadMessages,
        totalTeachers: totalTeachersCount,
      },
      courses: courses.map(c => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        subject: c.subject,
        grade: c.grade,
        students: c.students || [],
        isActive: c.isActive,
        zoomLink: c.zoomLink,
        createdAt: c.createdAt,
      })),
      recentActivities: limitedActivities,
      upcomingLessons,
      weeklyStats,
    };

    CacheManager.set(cacheKey, responsePayload, 15000);

    return res.json(responsePayload);
  } catch (err) {
    console.error('Teacher Dashboard Error:', err);
    next(err);
  }
};

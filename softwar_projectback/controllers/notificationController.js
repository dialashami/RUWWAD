const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const SentNotification = require('../models/SentNotification');
const User = require('../models/user_model');

exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
};

exports.getNotificationsForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log('[getNotificationsForUser] Fetching notifications for userId:', userId);
    
    // Check if user is a parent
    const user = await User.findById(userId).select('role children').populate('children', 'firstName lastName email');
    
    if (!user) {
      console.log('[getNotificationsForUser] User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('[getNotificationsForUser] User role:', user.role);
    console.log('[getNotificationsForUser] User has', user.children?.length || 0, 'children');
    
    let notifications;
    
    if (user.role === 'parent') {
      // For parents, always include their own notifications
      const userIdsToQuery = [userId];
      
      // Add children IDs if they exist
      if (user.children && user.children.length > 0) {
        const childIds = user.children.map(child => child._id || child);
        userIdsToQuery.push(...childIds);
        console.log('[getNotificationsForUser] Querying for parent + children:', userIdsToQuery.length, 'users');
      } else {
        console.log('[getNotificationsForUser] Parent has no linked children, showing only parent notifications');
      }
      
      // Fetch all notifications for parent and children
      notifications = await Notification.find({ 
        user: { $in: userIdsToQuery } 
      })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email');
      
      console.log('[getNotificationsForUser] Found', notifications.length, 'notifications');
      
      // Add child information to each notification
      notifications = notifications.map(notif => {
        const notifObj = notif.toObject();
        const notifUserId = notifObj.user?._id?.toString() || notifObj.user?.toString();
        
        if (notifUserId === userId.toString()) {
          // Parent's own notification
          notifObj.childName = 'You';
        } else {
          // Child's notification - find the child's name
          const child = user.children?.find(c => {
            const childId = c._id?.toString() || c.toString();
            return childId === notifUserId;
          });
          
          if (child && child.firstName) {
            notifObj.childName = `${child.firstName} ${child.lastName || ''}`.trim();
          } else if (notifObj.user?.firstName) {
            notifObj.childName = `${notifObj.user.firstName} ${notifObj.user.lastName || ''}`.trim();
          } else {
            notifObj.childName = 'Student';
          }
          notifObj.childId = notifUserId;
        }
        return notifObj;
      });
    } else {
      // For non-parents, fetch their own notifications
      console.log('[getNotificationsForUser] Non-parent user, fetching own notifications');
      notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
      console.log('[getNotificationsForUser] Found', notifications.length, 'notifications');
    }
    
    console.log('[getNotificationsForUser] Returning', notifications.length, 'total notifications');
    res.json(notifications);
  } catch (err) {
    console.error('[getNotificationsForUser] Error:', err);
    next(err);
  }
};

// Get notifications for admin user
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    console.log('[getAdminNotifications] Request from userId:', userId, 'role:', userPayload?.role);

    if (!userId || !userPayload || userPayload.role !== 'admin') {
      console.log('[getAdminNotifications] Access denied - not admin');
      return res.status(403).json({ message: 'Admin access required' });
    }

    // For admin, return a global log of all notifications in the system
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    console.log('[getAdminNotifications] Found', notifications.length, 'notifications in database');
    console.log('[getAdminNotifications] Sample notification types:', notifications.slice(0, 5).map(n => ({ type: n.type, title: n.title })));
    
    res.json(notifications);
  } catch (err) {
    console.error('[getAdminNotifications] Error:', err);
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (err) {
    next(err);
  }
};

// Mark all notifications as read for a user
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

// Delete a notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

// Get unread notification count for authenticated user
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let targetUserId = userId;

    // If this is the hardcoded admin (userId === 'admin'), resolve the real admin user id
    if (userPayload && userPayload.role === 'admin' && userId === 'admin') {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        targetUserId = adminUser._id;
      }
    }

    const count = await Notification.countDocuments({
      user: targetUserId,
      isRead: false,
    });

    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// Send assignment reminder to students with assignments due tomorrow
exports.sendAssignmentReminder = async (req, res, next) => {
  try {
    const teacherId = req.userId;
    const { customMessage } = req.body;
    
    if (!teacherId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Calculate date range - from now until end of tomorrow (to catch assignments due soon)
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
    endOfTomorrow.setHours(0, 0, 0, 0);

    console.log('Current time:', now);
    console.log('Searching for assignments due between:', startOfToday, 'and', endOfTomorrow);

    // Find ALL assignments due today or tomorrow
    const assignments = await Assignment.find({
      dueDate: {
        $gte: startOfToday,
        $lt: endOfTomorrow
      }
    }).populate('course');

    console.log('Assignments found due today/tomorrow:', assignments.length);
    
    // Also check all assignments to debug
    const allAssignments = await Assignment.find({}).select('title dueDate');
    console.log('All assignments in database:');
    allAssignments.forEach(a => {
      console.log(`  - ${a.title}: ${a.dueDate}`);
    });

    if (assignments.length === 0) {
      return res.json({ 
        message: 'No assignments due today or tomorrow', 
        notificationsSent: 0,
        studentsNotified: []
      });
    }

    // Collect all students from courses that have assignments due tomorrow
    const studentsToNotify = new Set();
    const assignmentDetails = [];

    for (const assignment of assignments) {
      console.log('Processing assignment:', assignment.title);
      console.log('  - Has course:', !!assignment.course);
      if (assignment.course) {
        console.log('  - Course title:', assignment.course.title);
        console.log('  - Course students:', assignment.course.students);
      }
      
      if (assignment.course && assignment.course.students && assignment.course.students.length > 0) {
        assignment.course.students.forEach(studentId => {
          studentsToNotify.add(studentId.toString());
        });
        assignmentDetails.push({
          title: assignment.title,
          courseName: assignment.course.title,
          dueDate: assignment.dueDate
        });
      } else {
        // Even if no students, still add assignment to details for the notification record
        assignmentDetails.push({
          title: assignment.title,
          courseName: assignment.course ? assignment.course.title : 'No course',
          dueDate: assignment.dueDate
        });
      }
    }
    
    console.log('Total students to notify:', studentsToNotify.size);
    console.log('Assignment details:', assignmentDetails);

    // Create notifications for each student
    const notifications = [];
    const studentIds = Array.from(studentsToNotify);

    for (const studentId of studentIds) {
      const assignmentTitles = assignmentDetails.map(a => a.title).join(', ');
      const notification = {
        user: studentId,
        title: 'Assignment Reminder',
        body: customMessage || `Reminder: You have assignment(s) due tomorrow: ${assignmentTitles}. Please submit on time.`,
        type: 'assignment',
        isRead: false
      };
      notifications.push(notification);
    }

    // Bulk create notifications
    let createdNotifications = [];
    if (notifications.length > 0) {
      createdNotifications = await Notification.insertMany(notifications);
    }

    // Save the sent notification record for the teacher
    const assignmentTitles = assignmentDetails.map(a => a.title).join(', ');
    await SentNotification.create({
      sender: teacherId,
      title: 'Assignment Reminder',
      body: customMessage || `Reminder: You have assignment(s) due tomorrow: ${assignmentTitles}. Please submit on time.`,
      type: 'reminder',
      recipientCount: studentIds.length,
      status: 'sent'
    });

    res.json({
      message: 'Assignment reminders sent successfully',
      notificationsSent: createdNotifications.length,
      assignmentsDueTomorrow: assignmentDetails,
      studentsNotified: studentIds.length
    });
  } catch (err) {
    console.error('Error sending assignment reminders:', err);
    next(err);
  }
};

// Get sent notifications for a teacher
exports.getSentNotifications = async (req, res, next) => {
  try {
    const teacherId = req.userId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const sentNotifications = await SentNotification.find({ sender: teacherId })
      .sort({ createdAt: -1 });

    res.json(sentNotifications);
  } catch (err) {
    next(err);
  }
};

// Save a sent notification (for custom/cancellation notifications)
// Also creates notifications for all students
exports.saveSentNotification = async (req, res, next) => {
  try {
    const teacherId = req.userId;
    if (!teacherId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { title, body, type, status } = req.body;
    const User = require('../models/user_model');

    // Find all students to send notification to
    const students = await User.find({ role: 'student' }).select('_id');
    
    // Create notifications for each student
    if (students.length > 0) {
      const notifications = students.map(student => ({
        user: student._id,
        title: title || 'New Notification',
        message: body,
        type: type || 'message',
        isRead: false,
      }));
      
      await Notification.insertMany(notifications);
    }

    // Save the sent notification record for the teacher
    const sentNotification = await SentNotification.create({
      sender: teacherId,
      title,
      body,
      type: type || 'custom',
      recipientCount: students.length,
      status: status || 'sent'
    });

    res.status(201).json(sentNotification);
  } catch (err) {
    next(err);
  }
};

exports.sendBulkEmailNotification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload || (userPayload.role !== 'admin' && userId !== 'admin')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { subject, body, recipientGroup, recipientTarget } = req.body || {};

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    let adminUserId = null;

    if (userPayload.role === 'admin' && userId && userId !== 'admin') {
      adminUserId = userId;
    } else {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (!adminUser) {
        return res.status(400).json({ message: 'Admin user not found' });
      }
      adminUserId = adminUser._id;
    }

    let recipientFilter = {};

    if (recipientTarget && recipientTarget !== 'all') {
      recipientFilter = { _id: recipientTarget };
    } else {
      if (!recipientGroup || recipientGroup === 'all') {
        recipientFilter = { role: { $ne: 'admin' } };
      } else if (recipientGroup === 'students') {
        recipientFilter = { role: 'student' };
      } else if (recipientGroup === 'teachers') {
        recipientFilter = { role: 'teacher' };
      } else if (recipientGroup === 'parents') {
        recipientFilter = { role: 'parent' };
      }
    }

    const recipients = await User.find(recipientFilter).select('firstName lastName email');

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found for selected criteria' });
    }

    const notifications = recipients.map((u) => ({
      user: u._id,
      title: subject,
      message: body,
      type: 'message',
      isRead: false,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    await SentNotification.create({
      sender: adminUserId,
      title: subject,
      body,
      type: 'custom',
      recipientCount: recipients.length,
      status: 'sent',
    });

    const adminNotification = await Notification.create({
      user: adminUserId,
      title: `Email sent: ${subject}`,
      message: `Sent to ${recipients.length} recipient(s).`,
      type: 'message',
      isRead: false,
    });

    return res.status(201).json({
      message: 'Email notifications sent successfully',
      notificationCount: createdNotifications.length,
      adminNotificationId: adminNotification._id,
    });
  } catch (err) {
    next(err);
  }
};

exports.replyToNotification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { originalNotificationId, replyBody } = req.body || {};

    if (!replyBody || !originalNotificationId) {
      return res.status(400).json({ message: 'originalNotificationId and replyBody are required' });
    }

    const originalNotification = await Notification.findById(originalNotificationId);

    const sender = await User.findById(userId).select('firstName lastName email');

    let adminUserId = null;

    const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
    if (!adminUser) {
      return res.status(400).json({ message: 'Admin user not found' });
    }
    adminUserId = adminUser._id;

    const senderName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email : 'User';
    const subjectPart = originalNotification && originalNotification.title ? ` regarding: ${originalNotification.title}` : '';

    const adminNotification = await Notification.create({
      user: adminUserId,
      title: `Email reply from ${senderName}${subjectPart}`,
      message: replyBody,
      type: 'message',
      isRead: false,
    });

    return res.status(201).json({
      message: 'Reply sent successfully',
      adminNotificationId: adminNotification._id,
    });
  } catch (err) {
    next(err);
  }
};

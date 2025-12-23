const User = require('../models/user_model');

// Get teacher profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password -verificationCode');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      subject: user.subject || '',
      teacherType: user.teacherType || '',
      specialization: user.specialization || '',
      profileImage: user.profileImage || '',
      preferences: user.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: false,
        assignmentReminders: true,
        gradeNotifications: true
      },
      twoFactorEnabled: user.twoFactorEnabled || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('Error getting teacher profile:', err);
    next(err);
  }
};

// Update teacher profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    console.log('=== UPDATE TEACHER PROFILE ===');
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    // Allowed fields to update
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'bio', 'subject', 'teacherType', 'specialization', 'profileImage'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle name field (split into firstName and lastName)
    if (req.body.name) {
      const nameParts = req.body.name.trim().split(' ');
      updates.firstName = nameParts[0] || '';
      updates.lastName = nameParts.slice(1).join(' ') || '';
    }

    console.log('Updates to save:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: false }
    ).select('-password -verificationCode');

    console.log('Updated user subject:', updatedUser.subject);

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        bio: updatedUser.bio || '',
        subject: updatedUser.subject || '',
        experience: updatedUser.experience || 0,
        profileImage: updatedUser.profileImage || '',
        preferences: updatedUser.preferences || {},
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (err) {
    console.error('Error updating teacher profile:', err);
    next(err);
  }
};

// Update teacher preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    const { emailNotifications, pushNotifications, weeklyReports, assignmentReminders, gradeNotifications } = req.body;

    const preferences = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : user.preferences?.emailNotifications ?? true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : user.preferences?.pushNotifications ?? true,
      weeklyReports: weeklyReports !== undefined ? weeklyReports : user.preferences?.weeklyReports ?? false,
      assignmentReminders: assignmentReminders !== undefined ? assignmentReminders : user.preferences?.assignmentReminders ?? true,
      gradeNotifications: gradeNotifications !== undefined ? gradeNotifications : user.preferences?.gradeNotifications ?? true
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true, runValidators: true }
    ).select('-password -verificationCode');

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
  } catch (err) {
    console.error('Error updating teacher preferences:', err);
    next(err);
  }
};

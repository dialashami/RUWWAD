const User = require('../models/user_model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Verify JWT token
exports.verifyToken = (req, res) => {
  return res.json({ ok: true, user: req.User || null });
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'bio', 'profilePicture', 'profileImage', 'grade', 'schoolGrade', 'universityMajor', 'studentType'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Convert empty strings to null for enum fields
    if (updates.universityMajor === '') {
      updates.universityMajor = null;
    }
    if (updates.schoolGrade === '') {
      updates.schoolGrade = null;
    }
    if (updates.studentType === '') {
      updates.studentType = null;
    }

    // Handle grade conversion for students
    if (req.body.grade) {
      if (req.body.grade === 'University') {
        updates.studentType = 'university';
        updates.schoolGrade = null;
      } else if (req.body.grade.startsWith('Grade ')) {
        updates.studentType = 'school';
        // Convert "Grade 10" to "grade10" format for enum
        const gradeNum = req.body.grade.replace('Grade ', '');
        updates.schoolGrade = `grade${gradeNum}`;
        updates.universityMajor = null;
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// Request password reset (forgot password)
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = resetCode;
    await user.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code',
      text: `Hello ${user.firstName}, your password reset code is: ${resetCode}. This code will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
};

// Reset password with code
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userPayload = req.User;

    if (!userId || !userPayload) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Generate new token
    const token = jwt.sign(
      {
        email: userPayload.email,
        userId: userId,
        role: userPayload.role,
      },
      process.env.SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

// Toggle Two-Factor Authentication
exports.toggle2FA = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { enabled } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.twoFactorEnabled = enabled;
    await user.save();

    res.json({ 
      message: enabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (err) {
    next(err);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password before deletion
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

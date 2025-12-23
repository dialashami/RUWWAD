const User = require('../models/user_model');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


// Validation middleware
exports.validateSignup = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student','parent','teacher','trainee']).withMessage('Invalid role'),
  body('studentType').custom((value, { req }) => {
    if (req.body.role === 'student' && !value) throw new Error('studentType is required for students');
    return true;
  }),
  body('schoolGrade').custom((value, { req }) => {
    if (req.body.role === 'student' && req.body.studentType === 'school' && !value) 
      throw new Error('schoolGrade is required for school students');
    return true;
  }),
  body('universityMajor').custom((value, { req }) => {
    if (req.body.role === 'student' && req.body.studentType === 'university' && !value) 
      throw new Error('universityMajor is required for university students');
    return true;
  }),
  body('trainingField').custom((value, { req }) => {
    if (req.body.role === 'trainee' && !value) throw new Error('trainingField is required for trainees');
    return true;
  })
];

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { firstName, lastName, email, password, role, studentType, schoolGrade, universityMajor, trainingField, confirmPassword } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    
    if (role === 'student' && studentType === 'school') {
      req.body.universityMajor = null;
      req.body.trainingField = null;
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      studentType : studentType || null,
      schoolGrade : schoolGrade || null,
      universityMajor: universityMajor || null,
      trainingField: trainingField || null,
      isVerified: false,
      verificationCode
    });

    await user.save();

    try {
      const adminUser = await User.findOne({ email: 'aboodjamal684@gmail.com' }).select('_id');
      if (adminUser) {
        const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;
        await Notification.create({
          user: adminUser._id,
          title: 'New user registered',
          message: `New ${role} user: ${fullName} (${email})`,
          type: 'system',
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.error('Error creating admin notification for new signup:', notifErr);
    }

    // إرسال الكود بالبريد
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Hello ${firstName}, your verification code is: ${verificationCode}`
    };
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered, please check your email for verification code" });

  } catch (err) {
    next(err);
  }
};

exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = undefined;
      await user.save();
      return res.status(200).json({ message: "Email verified successfully!" });
    }

    res.status(400).json({ message: "Invalid verification code." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};


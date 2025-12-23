const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    validate: [validator.isEmail, 'Please provide a valid email'] 
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student','parent','teacher','trainee','admin'], required: true },

  // الحقول الخاصة بالطلاب والمتدربين
  studentType: {
    type: String,
    enum: ['school', 'university' , null],
    default: null
   
  },
  schoolGrade: {
    type: String,
    enum: ['grade1','grade2','grade3','grade4','grade5','grade6','grade7','grade8','grade9','grade10','grade11','grade12', null],
    default: null
  },
  universityMajor: {
    type: String,
    enum: ['Computer Engineering','Architectural Engineering','Civil Engineering','Electrical Engineering','Industrial Engineering','Mechanical Engineering','Mechatronics Engineering','Chemical Engineering', 'engineering', 'other' , null],
    default: null

  },
  trainingField: {
    type: String,
    enum: ['engineering','legal','languages','it','business','medical','education' , null],
    default: null
  },

  // Teacher-specific fields
  phone: { type: String, trim: true },
  bio: { type: String, trim: true, maxlength: 500 },
  teacherType: {
    type: String,
    enum: ['school', 'university', null],
    default: null
  },
  specialization: {
    type: String,
    default: null
  },
  subject: { 
    type: String, 
    enum: ['math', 'science', 'english', 'history', 'arabic', 'islamic', 'chemistry', 'physics', 'biology', null],
    default: null 
  },
  profileImage: { type: String, trim: true }, // URL to profile image
  avgScore: { type: Number, default: 0 }, // Average score for students
  achievements: { type: Number, default: 0 }, // Number of achievements
  rating: { type: Number, default: 0, min: 0, max: 100 }, // Teacher rating out of 100

  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false },
    assignmentReminders: { type: Boolean, default: true },
    gradeNotifications: { type: Boolean, default: true }
  },

  // Security
  twoFactorEnabled: { type: Boolean, default: false },

  // Parent-specific: linked children (array of student user IDs)
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Student-specific: linked parent (parent user ID)
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String },
    body: { type: String },
    type: { 
      type: String, 
      enum: [
        'assignment',
        'message',
        'system',
        'grade',
        'lesson',
        'quiz',
        'schedule',
        'achievement',
        'deadline',
        'course',
        'enrollment',
        'relationship',
        'other',
      ],
      default: 'other',
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

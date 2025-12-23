const mongoose = require('mongoose');

const sentNotificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String },
    type: { type: String, enum: ['reminder', 'cancellation', 'custom', 'other'], default: 'other' },
    recipientCount: { type: Number, default: 0 },
    status: { type: String, enum: ['sent', 'scheduled'], default: 'sent' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SentNotification', sentNotificationSchema);

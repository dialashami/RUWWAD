const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'ai'], required: true }, // ✅ ثابت
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  preview: String,
  messages: [MessageSchema],
  messageCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });


// Index for efficient queries
aiConversationSchema.index({ user: 1, isDeleted: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    preview: { type: String, trim: true },
    messages: [messageSchema],
    messageCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Index for efficient queries
aiConversationSchema.index({ user: 1, isDeleted: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);

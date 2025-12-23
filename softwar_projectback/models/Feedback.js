const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // e.g. teacher or student
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);

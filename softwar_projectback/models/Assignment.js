const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date, default: Date.now },
  file: { type: String }, // Base64 data URL or external URL
  fileName: { type: String, trim: true }, // Original file name
  comment: { type: String, trim: true }, // Student's comment
  grade: { type: Number, min: 0 },
  feedback: { type: String, trim: true },
  isGraded: { type: Boolean, default: false },
});

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    attachments: [{ type: String }], // URLs or file IDs
    // Additional fields for frontend compatibility
    subject: { type: String, trim: true },
    grade: { type: String, trim: true }, // target grade level e.g. 'Grade 9' or 'University'
    universityMajor: { type: String, trim: true }, // e.g. 'Computer Engineering', 'Civil Engineering'
    status: { type: String, enum: ['active', 'upcoming', 'closed'], default: 'upcoming' },
    points: { type: Number, default: 100 }, // total points possible
    passingScore: { type: Number, default: 60 },
    totalStudents: { type: Number, default: 0 },
    instructionsFileUrl: { type: String, trim: true },
    instructionsFileName: { type: String, trim: true },
    submissions: [submissionSchema], // embedded submissions
  },
  { timestamps: true }
);

// Virtual for submitted count
assignmentSchema.virtual('submitted').get(function () {
  return this.submissions ? this.submissions.length : 0;
});

// Virtual for graded count
assignmentSchema.virtual('graded').get(function () {
  return this.submissions ? this.submissions.filter(s => s.isGraded).length : 0;
});

// Ensure virtuals are included in JSON
assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);

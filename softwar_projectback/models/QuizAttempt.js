const mongoose = require('mongoose');

// Individual quiz attempt by a student
const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  attemptNumber: { type: Number, required: true, default: 1 },
  
  // Questions presented in this attempt (can be randomized from pool)
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    selectedAnswer: { type: Number, default: -1 }, // -1 = not answered
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String }
  }],
  
  // Results
  score: { type: Number, default: 0 }, // Percentage (0-100)
  correctAnswers: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 20 },
  passed: { type: Boolean, default: false },
  passingScore: { type: Number, default: 60 },
  
  // Timing
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeSpent: { type: Number }, // Seconds spent on quiz
  
  // Status
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'abandoned'], 
    default: 'in-progress' 
  }
}, { timestamps: true });

// Index for efficient queries
quizAttemptSchema.index({ student: 1, chapter: 1 });
quizAttemptSchema.index({ student: 1, status: 1 });

// Virtual to calculate if attempt is still valid (not timed out)
quizAttemptSchema.virtual('isExpired').get(function() {
  if (this.status !== 'in-progress') return false;
  // Consider expired after 2 hours of starting
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return this.startedAt < twoHoursAgo;
});

// Method to submit answers and calculate score
quizAttemptSchema.methods.submitAnswers = function(answers) {
  let correctCount = 0;
  
  answers.forEach((answer, index) => {
    if (index < this.questions.length) {
      this.questions[index].selectedAnswer = answer;
      this.questions[index].isCorrect = answer === this.questions[index].correctAnswer;
      if (this.questions[index].isCorrect) {
        correctCount++;
      }
    }
  });
  
  this.correctAnswers = correctCount;
  this.score = Math.round((correctCount / this.totalQuestions) * 100);
  this.passed = this.score >= this.passingScore;
  this.completedAt = new Date();
  this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
  this.status = 'completed';
  
  return {
    score: this.score,
    correctAnswers: this.correctAnswers,
    totalQuestions: this.totalQuestions,
    passed: this.passed,
    timeSpent: this.timeSpent
  };
};

// Ensure virtuals are included in JSON
quizAttemptSchema.set('toJSON', { virtuals: true });
quizAttemptSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);

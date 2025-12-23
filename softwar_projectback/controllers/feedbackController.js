const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res, next) => {
  try {
    console.log('Creating feedback with data:', req.body);
    
    // Validate required fields
    if (!req.body.author) {
      return res.status(400).json({ message: 'Author is required' });
    }
    
    const feedbackData = {
      author: req.body.author,
      rating: req.body.rating || null,
      comment: req.body.comment || '',
      targetUser: req.body.targetUser || null,
      course: req.body.course || null,
    };
    
    const feedback = await Feedback.create(feedbackData);
    console.log('Feedback created successfully:', feedback._id);
    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error creating feedback:', err);
    next(err);
  }
};

exports.getFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('author')
      .populate('targetUser')
      .populate('course');
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};

exports.getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('author')
      .populate('targetUser')
      .populate('course');
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

// Get random feedbacks for welcome page display
exports.getRandomFeedbacks = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const feedbacks = await Feedback.aggregate([
      { $match: { rating: { $gte: 4 } } }, // Only show positive feedback
      { $sample: { size: limit } },
    ]);
    
    // Populate author info
    await Feedback.populate(feedbacks, { path: 'author', select: 'firstName lastName role' });
    
    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};

exports.updateFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    next(err);
  }
};

exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    next(err);
  }
};

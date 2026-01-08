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

// Get feedback received by the current user (for students to see their feedback)
exports.getMyFeedback = async (req, res, next) => {
  try {
    const userId = req.userId;
    console.log('getMyFeedback called with userId:', userId);
    
    // Check if userId exists
    if (!userId) {
      console.log('No userId found, returning empty arrays');
      return res.json({
        received: [],
        given: [],
      });
    }
    
    // Check if userId is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid ObjectId:', userId, '- returning empty arrays');
      // Return empty arrays for invalid user IDs (like "admin" string)
      return res.json({
        received: [],
        given: [],
      });
    }
    
    console.log('Fetching feedback for valid userId:', userId);
    // Get feedback where the current user is the target (received feedback)
    const receivedFeedback = await Feedback.find({ targetUser: userId })
      .populate('author', 'firstName lastName role')
      .populate('course', 'title subject')
      .sort({ createdAt: -1 });
    
    // Get feedback created by the current user (given feedback)
    const givenFeedback = await Feedback.find({ author: userId })
      .populate('targetUser', 'firstName lastName role')
      .populate('course', 'title subject')
      .sort({ createdAt: -1 });
    
    console.log('Feedback fetched - received:', receivedFeedback.length, 'given:', givenFeedback.length);
    res.json({
      received: receivedFeedback,
      given: givenFeedback,
    });
  } catch (err) {
    console.error('Error in getMyFeedback:', err);
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

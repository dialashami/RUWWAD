const User = require('../models/user_model');
const mongoose = require('mongoose');

// Admin email used for resolving 'admin' userId to real ObjectId
const ADMIN_EMAIL = 'aboodjamal684@gmail.com';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * Resolve userId to a valid MongoDB ObjectId
 * If userId is 'admin' or invalid, resolves to the real admin user's ObjectId
 * 
 * @param {string} userId - The userId from request (could be 'admin' or valid ObjectId)
 * @returns {Promise<string|null>} - Resolved ObjectId string or null if not found
 */
const resolveUserId = async (userId) => {
  // If it's already a valid ObjectId, return it
  if (isValidObjectId(userId)) {
    return userId;
  }
  
  // If userId is 'admin' or invalid, resolve to real admin user
  const adminUser = await User.findOne({ email: ADMIN_EMAIL }).select('_id');
  return adminUser ? adminUser._id.toString() : null;
};

/**
 * Get the resolved userId, with caching for the request lifecycle
 * Use this in controllers to avoid multiple DB lookups for the same request
 * 
 * @param {Object} req - Express request object
 * @returns {Promise<string|null>} - Resolved ObjectId string or null
 */
const getResolvedUserId = async (req) => {
  // Cache the resolved ID on the request object
  if (req._resolvedUserId !== undefined) {
    return req._resolvedUserId;
  }
  
  req._resolvedUserId = await resolveUserId(req.userId);
  return req._resolvedUserId;
};

module.exports = {
  isValidObjectId,
  resolveUserId,
  getResolvedUserId,
  ADMIN_EMAIL,
};

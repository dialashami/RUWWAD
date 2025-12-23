// Centralized Express error-handling middleware

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Backend error:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Server error';

  res.status(status).json({
    message,
    // Optionally include stack in development only
    // stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = errorHandler;

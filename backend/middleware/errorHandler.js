'use strict';

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  // Log all errors; include stack only for unexpected errors in development
  const meta = { statusCode, method: req.method, url: req.originalUrl };
  if (!isOperational || process.env.NODE_ENV === 'development') {
    meta.stack = err.stack;
  }
  logger.error(err.message, meta);

  // Never expose internal error details in production
  const message =
    isOperational || process.env.NODE_ENV !== 'production'
      ? err.message
      : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;

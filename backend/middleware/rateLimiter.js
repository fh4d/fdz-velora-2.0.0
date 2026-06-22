'use strict';

const rateLimit = require('express-rate-limit');
const config    = require('../config/env');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: 'Too many requests — please try again later.',
  },
});

module.exports = { globalLimiter };

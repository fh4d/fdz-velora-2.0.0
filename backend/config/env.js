'use strict';

/**
 * Validates that all required environment variables are present.
 * Throws with a clear message on the first missing variable so the
 * server fails fast instead of producing confusing runtime errors.
 */
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config = {
  env:      process.env.NODE_ENV || 'development',
  port:     parseInt(process.env.PORT || '3000', 10),

  siteDomain:   process.env.SITE_DOMAIN   || 'http://localhost:3000',
  frontendUrl:  process.env.FRONTEND_URL  || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI || null,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX        || '100',    10),
  },
};

module.exports = config;

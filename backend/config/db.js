'use strict';

const mongoose = require('mongoose');
const config   = require('./env');
const logger   = require('../utils/logger');

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES    = 5;

async function connectDB(attempt = 1) {
  if (!config.mongoUri) {
    logger.warn('MONGO_URI is not set — database connection skipped');
    return;
  }

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  } catch (err) {
    logger.error(`MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`, {
      error: err.message,
    });

    if (attempt < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s…`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    logger.error('Max MongoDB connection retries reached — exiting');
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = connectDB;

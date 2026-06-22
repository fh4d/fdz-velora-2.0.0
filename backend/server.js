'use strict';

require('dotenv').config();

const http      = require('http');
const app       = require('./app');
const config    = require('./config/env');
const connectDB = require('./config/db');
const logger    = require('./utils/logger');

const server = http.createServer(app);

async function start() {
  // Establish database connection (skipped gracefully if MONGO_URI is unset)
  await connectDB();

  server.listen(config.port, () => {
    logger.info(`Server running`, {
      env:  config.env,
      port: config.port,
      url:  `http://localhost:${config.port}`,
    });
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection — shutting down', { error: err.message });
  server.close(() => process.exit(1));
});

start();

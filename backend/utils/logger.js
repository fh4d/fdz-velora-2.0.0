'use strict';

const isProd = process.env.NODE_ENV === 'production';

const logger = {
  info(message, meta = {}) {
    const out = { level: 'info', message, ...meta, ts: new Date().toISOString() };
    console.log(isProd ? JSON.stringify(out) : `[INFO]  ${message}`);
  },

  warn(message, meta = {}) {
    const out = { level: 'warn', message, ...meta, ts: new Date().toISOString() };
    console.warn(isProd ? JSON.stringify(out) : `[WARN]  ${message}`);
  },

  error(message, meta = {}) {
    const out = { level: 'error', message, ...meta, ts: new Date().toISOString() };
    console.error(isProd ? JSON.stringify(out) : `[ERROR] ${message}`);
  },
};

module.exports = logger;

'use strict';

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');

const config             = require('./config/env');
const { globalLimiter }  = require('./middleware/rateLimiter');
const notFound           = require('./middleware/notFound');
const errorHandler       = require('./middleware/errorHandler');
const healthRouter       = require('./routes/health');
const contactRouter      = require('./routes/contact');
const newsletterRouter   = require('./routes/newsletter');
const blogRouter         = require('./routes/blog');
const adminRouter        = require('./routes/admin');

const app = express();

// ─── 1. HTTP request logging ──────────────────────────────────────────────────
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ─── 2. Security headers ──────────────────────────────────────────────────────
// CSP is disabled here — Framer's runtime loads scripts from framer.com and
// framerusercontent.com which conflict with Helmet's default strict policy.
// Re-enable and tune CSP in a dedicated hardening phase.
app.use(helmet({ contentSecurityPolicy: false }));

// ─── 3. CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-admin-password'],
  })
);

// ─── 4. Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── 5. Global rate limiter ───────────────────────────────────────────────────
app.use(globalLimiter);

// ─── 6. API routes ────────────────────────────────────────────────────────────
app.use('/health',         healthRouter);
app.use('/api/contact',    contactRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/blog',       blogRouter);
app.use('/admin',          adminRouter);

// ─── 7. 404 ───────────────────────────────────────────────────────────────────
// Frontend is served by Vercel — Express handles API routes only.
app.use(notFound);

// ─── 11. Centralized error handler ────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

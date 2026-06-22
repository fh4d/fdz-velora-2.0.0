'use strict';

const Newsletter = require('../models/Newsletter');
const AppError   = require('../utils/AppError');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

async function subscribeNewsletter(req, res, next) {
  try {
    const raw = req.body.email;

    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return next(new AppError('Email is required', 400));
    }

    const email = raw.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return next(new AppError('Email must be a valid address', 400));
    }

    const existing = await Newsletter.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already subscribed',
      });
    }

    await Newsletter.create({ email });

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const text = Object.values(err.errors).map((e) => e.message).join(', ');
      return next(new AppError(text, 400));
    }
    next(err);
  }
}

module.exports = { subscribeNewsletter };

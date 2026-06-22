'use strict';

const Contact  = require('../models/Contact');
const AppError = require('../utils/AppError');

async function createContact(req, res, next) {
  try {
    const { name, email, message, subject } = req.body;

    // Required field validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Name is required', 400));
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new AppError('Email is required', 400));
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return next(new AppError('Message is required', 400));
    }

    const submission = await Contact.create({
      name:    name.trim(),
      email:   email.trim(),
      message: message.trim(),
      subject: subject ? subject.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Message received successfully',
    });
  } catch (err) {
    // Mongoose validation errors → 400
    if (err.name === 'ValidationError') {
      const text = Object.values(err.errors).map((e) => e.message).join(', ');
      return next(new AppError(text, 400));
    }
    next(err);
  }
}

module.exports = { createContact };

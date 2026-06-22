'use strict';

const { Schema, model } = require('mongoose');

const contactSchema = new Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [200, 'Name must not exceed 200 characters'],
    },
    email: {
      type:     String,
      required: [true, 'Email is required'],
      trim:     true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid address'],
    },
    subject: {
      type:  String,
      trim:  true,
      maxlength: [300, 'Subject must not exceed 300 characters'],
    },
    message: {
      type:     String,
      required: [true, 'Message is required'],
      trim:     true,
      maxlength: [5000, 'Message must not exceed 5000 characters'],
    },
    status: {
      type:    String,
      enum:    ['new', 'read', 'replied'],
      default: 'new',
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    versionKey: false,
  }
);

module.exports = model('Contact', contactSchema);

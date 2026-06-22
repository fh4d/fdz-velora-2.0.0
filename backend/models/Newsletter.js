'use strict';

const { Schema, model } = require('mongoose');

const newsletterSchema = new Schema(
  {
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      trim:     true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid address'],
    },
    status: {
      type:    String,
      enum:    ['active', 'unsubscribed'],
      default: 'active',
    },
    subscribedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model('Newsletter', newsletterSchema);

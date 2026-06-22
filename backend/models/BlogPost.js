'use strict';

const { Schema, model } = require('mongoose');

const blogPostSchema = new Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
    },
    slug: {
      type:     String,
      required: [true, 'Slug is required'],
      unique:   true,
      trim:     true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    content: {
      type:     String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    status: {
      type:    String,
      enum:    ['draft', 'published'],
      default: 'draft',
    },
    // Identifies whether this post originates from the static Framer export
    // or was authored directly in MongoDB.
    // "static" posts are read-only references; "mongo" posts are fully managed here.
    source: {
      type:    String,
      enum:    ['static', 'mongo'],
      default: 'mongo',
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = model('BlogPost', blogPostSchema);

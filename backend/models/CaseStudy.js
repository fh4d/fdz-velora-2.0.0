'use strict';

const { Schema, model } = require('mongoose');

const statSchema = new Schema(
  {
    value: { type: String, required: [true, 'Stat value is required'], trim: true },
    label: { type: String, required: [true, 'Stat label is required'], trim: true },
  },
  { _id: false }
);

const caseStudySchema = new Schema(
  {
    title: {
      type:     String,
      required: [true, 'Title is required'],
      trim:     true,
    },
    slug: {
      type:      String,
      required:  [true, 'Slug is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    subtitle: {
      type:     String,
      required: [true, 'Subtitle is required'],
      trim:     true,
    },
    industry: {
      type:     String,
      required: [true, 'Industry is required'],
      trim:     true,
    },
    timeline: {
      type:     String,
      required: [true, 'Timeline is required'],
      trim:     true,
    },
    year: {
      type:     Number,
      required: [true, 'Year is required'],
      min:      [2000, 'Year must be 2000 or later'],
      max:      [2100, 'Year must be 2100 or earlier'],
    },
    scopeOfWork: {
      type:     [String],
      required: [true, 'Scope of work is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 1,
        message:   'At least one scope of work item is required',
      },
    },
    stats: {
      type:     [statSchema],
      required: [true, 'Stats are required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message:   'Exactly 2 stats are required',
      },
    },
    challenge: {
      type:     String,
      required: [true, 'Challenge is required'],
      trim:     true,
    },
    strategy: {
      type:     String,
      required: [true, 'Strategy is required'],
      trim:     true,
    },
    livePreviewUrl: {
      type:  String,
      trim:  true,
      match: [/^https?:\/\/.+/, 'Live preview URL must be a valid URL'],
    },
    coverImage: {
      type: String,
      trim: true,
    },
    bodyImage: {
      type: String,
      trim: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    // "static" = migrated from a Framer HTML export (protected from API deletion)
    // "mongo"  = created via admin panel
    source: {
      type:    String,
      enum:    ['static', 'mongo'],
      default: 'mongo',
    },
    status: {
      type:    String,
      enum:    ['draft', 'published'],
      default: 'draft',
    },
    order: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for the most common public query pattern
caseStudySchema.index({ status: 1, source: 1, order: 1, createdAt: -1 });

module.exports = model('CaseStudy', caseStudySchema);

'use strict';

const { Schema, model } = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const statSchema = new Schema(
  {
    value: { type: String, required: [true, 'Stat value is required'], trim: true },
    label: { type: String, required: [true, 'Stat label is required'], trim: true },
  },
  { _id: false }
);

// Stores only the slug of a related case study.
// The template resolves the full document at render time so card content
// never goes stale when a related case study is later updated.
const relatedProjectSchema = new Schema(
  { slug: { type: String, required: true, trim: true } },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const caseStudySchema = new Schema(
  {
    // Identity
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

    // Project metadata
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

    // Statistics — exactly 2 for the current Nexlify template layout
    stats: {
      type:     [statSchema],
      required: [true, 'Stats are required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message:   'Exactly 2 stats are required',
      },
    },

    // Body content
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

    // Images
    heroImage: {
      type: String,
      trim: true,
    },
    bodyImage: {
      type: String,
      trim: true,
    },

    // CTA
    livePreviewUrl: {
      type:  String,
      trim:  true,
      match: [/^https?:\/\/.+/, 'Live preview URL must be a valid URL'],
    },

    // Related projects — array of slugs resolved to full documents at render time.
    // If empty, the template falls back to querying 2 other published case studies.
    relatedProjects: {
      type:    [relatedProjectSchema],
      default: [],
    },

    // SEO
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },

    // System fields
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
    timestamps: true,   // adds createdAt + updatedAt
    versionKey: false,
  }
);

// Compound index — covers the most common public query (published list sorted by order)
caseStudySchema.index({ status: 1, order: 1, createdAt: -1 });

module.exports = model('CaseStudy', caseStudySchema);

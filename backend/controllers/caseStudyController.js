'use strict';

const CaseStudy = require('../models/CaseStudy');
const AppError  = require('../utils/AppError');

// Returns all published case studies sorted by order asc, then newest first.
// Lightweight projection — full body fields are excluded for listing use.
async function getAllCaseStudies(req, res, next) {
  try {
    const studies = await CaseStudy.find({ status: 'published' })
      .select('title slug subtitle industry year coverImage stats order createdAt')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count:   studies.length,
      data:    studies,
    });
  } catch (err) {
    next(err);
  }
}

// Returns a single published case study by slug — full document.
async function getCaseStudyBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string') {
      return next(new AppError('Slug is required', 400));
    }

    const study = await CaseStudy.findOne({
      slug:   slug.trim().toLowerCase(),
      status: 'published',
    }).select('-__v');

    if (!study) {
      return next(new AppError('Case study not found', 404));
    }

    res.status(200).json({ success: true, data: study });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllCaseStudies, getCaseStudyBySlug };

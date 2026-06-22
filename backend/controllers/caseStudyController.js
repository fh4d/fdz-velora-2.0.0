'use strict';

const CaseStudy = require('../models/CaseStudy');
const AppError  = require('../utils/AppError');

// Fields needed to render a "More projects" card in the template
const CARD_PROJECTION = 'title slug subtitle stats heroImage order';

// ── Public: list ──────────────────────────────────────────────────────────────
// Lightweight projection — body content excluded; used by listing page and cards.
async function getAllCaseStudies(req, res, next) {
  try {
    const studies = await CaseStudy.find({ status: 'published' })
      .select('title slug subtitle industry year heroImage stats order createdAt')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: studies.length, data: studies });
  } catch (err) {
    next(err);
  }
}

// ── Public: single ────────────────────────────────────────────────────────────
// Returns the full case study document plus resolved relatedProjects.
// If relatedProjects[] is empty, falls back to the 2 next-ordered published
// case studies so the "More projects" block is always populated.
async function getCaseStudyBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== 'string') {
      return next(new AppError('Slug is required', 400));
    }

    const study = await CaseStudy.findOne({
      slug:   slug.trim().toLowerCase(),
      status: 'published',
    }).lean();

    if (!study) return next(new AppError('Case study not found', 404));

    // ── Resolve related projects ──────────────────────────────────────────────
    let related = [];

    if (study.relatedProjects && study.relatedProjects.length > 0) {
      // Explicit list stored on the document — resolve each slug in order
      const slugs = study.relatedProjects.map((r) => r.slug);
      const docs  = await CaseStudy.find({
        slug:   { $in: slugs },
        status: 'published',
      }).select(CARD_PROJECTION).lean();

      // Preserve the stored order
      related = slugs
        .map((s) => docs.find((d) => d.slug === s))
        .filter(Boolean);
    }

    // Fill remaining slots (up to 2) from other published case studies
    if (related.length < 2) {
      const excludeSlugs = [study.slug, ...related.map((r) => r.slug)];
      const fallback = await CaseStudy.find({
        slug:   { $nin: excludeSlugs },
        status: 'published',
      })
        .select(CARD_PROJECTION)
        .sort({ order: 1, createdAt: -1 })
        .limit(2 - related.length)
        .lean();

      related = related.concat(fallback);
    }

    res.status(200).json({
      success: true,
      data:    { ...study, relatedProjects: related },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllCaseStudies, getCaseStudyBySlug };

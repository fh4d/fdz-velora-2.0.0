'use strict';

const mongoose = require('mongoose');
const CaseStudy = require('../models/CaseStudy');
const AppError  = require('../utils/AppError');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Normalise relatedProjects input — accepts [{slug}] or ['slug-string']
function normaliseRelated(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return { slug: item.trim() };
      if (item && typeof item.slug === 'string') return { slug: item.slug.trim() };
      return null;
    })
    .filter((item) => item && item.slug);
}

// ── Admin: list ───────────────────────────────────────────────────────────────
// Returns all case studies (any status) for the admin panel list view.
async function adminListCaseStudies(req, res, next) {
  try {
    const studies = await CaseStudy.find()
      .select('title slug status order createdAt updatedAt')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: studies.length, data: studies });
  } catch (err) {
    next(err);
  }
}

// ── Admin: single ─────────────────────────────────────────────────────────────
// Returns a full case study by slug regardless of status — used to pre-fill
// the edit form.
async function adminGetCaseStudy(req, res, next) {
  try {
    const study = await CaseStudy.findOne({ slug: req.params.slug });
    if (!study) return next(new AppError('Case study not found', 404));
    res.status(200).json({ success: true, data: study });
  } catch (err) {
    next(err);
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createCaseStudy(req, res, next) {
  try {
    const {
      title, slug, subtitle, industry, timeline, year,
      scopeOfWork, stats, challenge, strategy,
      livePreviewUrl, heroImage, bodyImage, logo,
      relatedProjects, seoTitle, seoDescription,
      status, order,
    } = req.body;

    // Required field guards
    if (!title?.trim())     return next(new AppError('Title is required', 400));
    if (!subtitle?.trim())  return next(new AppError('Subtitle is required', 400));

    if (!Array.isArray(stats) || stats.length !== 2) {
      return next(new AppError('Exactly 2 stats are required', 400));
    }
    for (const s of stats) {
      if (!s.value?.trim() || !s.label?.trim()) {
        return next(new AppError('Each stat must have a value and a label', 400));
      }
    }

    const cleanSlug = slug ? buildSlug(slug) : buildSlug(title);
    if (!cleanSlug) return next(new AppError('Could not generate a valid slug', 400));

    const existing = await CaseStudy.findOne({ slug: cleanSlug });
    if (existing) return next(new AppError('A case study with this slug already exists', 409));

    const study = await CaseStudy.create({
      title:           title.trim(),
      slug:            cleanSlug,
      subtitle:        subtitle.trim(),
      industry:        industry?.trim()        || undefined,
      timeline:        timeline?.trim()        || undefined,
      year:            year !== undefined && year !== '' ? Number(year) : undefined,
      scopeOfWork:     Array.isArray(scopeOfWork) ? scopeOfWork.map((s) => s.trim()).filter(Boolean) : [],
      stats:           stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
      challenge:       challenge?.trim()       || undefined,
      strategy:        strategy?.trim()        || undefined,
      livePreviewUrl:  livePreviewUrl?.trim()  || undefined,
      heroImage:       heroImage?.trim()       || undefined,
      bodyImage:       bodyImage?.trim()       || undefined,
      logo:            logo?.trim()            || undefined,
      relatedProjects: normaliseRelated(relatedProjects),
      seoTitle:        seoTitle?.trim()        || undefined,
      seoDescription:  seoDescription?.trim()  || undefined,
      status:          status === 'published'  ? 'published' : 'draft',
      order:           order !== undefined     ? Number(order) : undefined,
    });

    res.status(201).json({ success: true, data: study });
  } catch (err) {
    next(err);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
// Identified by MongoDB _id. Slug is immutable — changing it would break URLs.
async function updateCaseStudy(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return next(new AppError('Invalid case study id', 400));
    }

    const existing = await CaseStudy.findById(req.params.id);
    if (!existing) return next(new AppError('Case study not found', 404));

    const {
      title, subtitle, industry, timeline, year,
      scopeOfWork, stats, challenge, strategy,
      livePreviewUrl, heroImage, bodyImage, logo,
      relatedProjects, seoTitle, seoDescription,
      status, order,
    } = req.body;

    if (stats !== undefined) {
      if (!Array.isArray(stats) || stats.length !== 2) {
        return next(new AppError('Exactly 2 stats are required', 400));
      }
      for (const s of stats) {
        if (!s.value?.trim() || !s.label?.trim()) {
          return next(new AppError('Each stat must have a value and a label', 400));
        }
      }
    }

    const updates = {};
    if (title !== undefined)           updates.title           = title.trim();
    if (subtitle !== undefined)        updates.subtitle        = subtitle.trim();
    if (industry !== undefined)        updates.industry        = industry.trim()       || undefined;
    if (timeline !== undefined)        updates.timeline        = timeline.trim()       || undefined;
    if (year !== undefined)            updates.year            = year !== '' ? Number(year) : undefined;
    if (challenge !== undefined)       updates.challenge       = challenge.trim()      || undefined;
    if (strategy !== undefined)        updates.strategy        = strategy.trim()       || undefined;
    if (livePreviewUrl !== undefined)  updates.livePreviewUrl  = livePreviewUrl.trim()  || undefined;
    if (heroImage !== undefined)       updates.heroImage       = heroImage.trim()       || undefined;
    if (bodyImage !== undefined)       updates.bodyImage       = bodyImage.trim()       || undefined;
    if (logo !== undefined)            updates.logo            = logo.trim()            || undefined;
    if (seoTitle !== undefined)        updates.seoTitle        = seoTitle.trim()        || undefined;
    if (seoDescription !== undefined)  updates.seoDescription  = seoDescription.trim()  || undefined;
    if (status !== undefined)          updates.status          = status;
    if (order !== undefined)           updates.order           = Number(order);
    if (scopeOfWork !== undefined)     updates.scopeOfWork     = scopeOfWork.map((s) => s.trim()).filter(Boolean);
    if (stats !== undefined)           updates.stats           = stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() }));
    if (relatedProjects !== undefined) updates.relatedProjects = normaliseRelated(relatedProjects);

    const updated = await CaseStudy.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ── Toggle status ─────────────────────────────────────────────────────────────
async function toggleStatus(req, res, next) {
  try {
    const study = await CaseStudy.findOne({ slug: req.params.slug });
    if (!study) return next(new AppError('Case study not found', 404));

    study.status = study.status === 'published' ? 'draft' : 'published';
    await study.save();

    res.status(200).json({ success: true, data: { slug: study.slug, status: study.status } });
  } catch (err) {
    next(err);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
// Identified by MongoDB _id.
async function deleteCaseStudy(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return next(new AppError('Invalid case study id', 400));
    }

    const study = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!study) return next(new AppError('Case study not found', 404));

    res.status(200).json({ success: true, message: 'Case study deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  adminListCaseStudies,
  adminGetCaseStudy,
  createCaseStudy,
  updateCaseStudy,
  toggleStatus,
  deleteCaseStudy,
};

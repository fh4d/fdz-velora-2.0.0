'use strict';

const CaseStudy = require('../models/CaseStudy');
const AppError  = require('../utils/AppError');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Returns all case studies (any status, any source) for the admin listing.
async function adminListCaseStudies(req, res, next) {
  try {
    const studies = await CaseStudy.find()
      .select('title slug status source order createdAt updatedAt')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: studies.length, data: studies });
  } catch (err) {
    next(err);
  }
}

// Returns a single case study by slug regardless of status — for the edit form.
async function adminGetCaseStudy(req, res, next) {
  try {
    const study = await CaseStudy.findOne({ slug: req.params.slug });
    if (!study) return next(new AppError('Case study not found', 404));
    res.status(200).json({ success: true, data: study });
  } catch (err) {
    next(err);
  }
}

// Creates a new case study. Source defaults to "mongo"; status defaults to "draft".
async function createCaseStudy(req, res, next) {
  try {
    const {
      title, slug, subtitle, industry, timeline, year,
      scopeOfWork, stats, challenge, strategy,
      livePreviewUrl, coverImage, bodyImage,
      seoTitle, seoDescription, status, order,
    } = req.body;

    if (!title?.trim())    return next(new AppError('Title is required', 400));
    if (!subtitle?.trim()) return next(new AppError('Subtitle is required', 400));
    if (!industry?.trim()) return next(new AppError('Industry is required', 400));
    if (!timeline?.trim()) return next(new AppError('Timeline is required', 400));
    if (!year)             return next(new AppError('Year is required', 400));
    if (!challenge?.trim()) return next(new AppError('Challenge is required', 400));
    if (!strategy?.trim()) return next(new AppError('Strategy is required', 400));

    if (!Array.isArray(scopeOfWork) || scopeOfWork.length < 1) {
      return next(new AppError('At least one scope of work item is required', 400));
    }
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
      title:          title.trim(),
      slug:           cleanSlug,
      subtitle:       subtitle.trim(),
      industry:       industry.trim(),
      timeline:       timeline.trim(),
      year:           Number(year),
      scopeOfWork:    scopeOfWork.map((s) => s.trim()).filter(Boolean),
      stats:          stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() })),
      challenge:      challenge.trim(),
      strategy:       strategy.trim(),
      livePreviewUrl: livePreviewUrl?.trim() || undefined,
      coverImage:     coverImage?.trim()     || undefined,
      bodyImage:      bodyImage?.trim()      || undefined,
      seoTitle:       seoTitle?.trim()       || undefined,
      seoDescription: seoDescription?.trim() || undefined,
      status:         status === 'published' ? 'published' : 'draft',
      order:          order !== undefined ? Number(order) : undefined,
      source:         'mongo',
    });

    res.status(201).json({ success: true, data: study });
  } catch (err) {
    next(err);
  }
}

// Updates an existing case study. Slug cannot be changed.
// All fields are optional — only supplied fields are updated.
async function updateCaseStudy(req, res, next) {
  try {
    const existing = await CaseStudy.findOne({ slug: req.params.slug });
    if (!existing) return next(new AppError('Case study not found', 404));

    const {
      title, subtitle, industry, timeline, year,
      scopeOfWork, stats, challenge, strategy,
      livePreviewUrl, coverImage, bodyImage,
      seoTitle, seoDescription, status, order,
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

    if (scopeOfWork !== undefined) {
      if (!Array.isArray(scopeOfWork) || scopeOfWork.length < 1) {
        return next(new AppError('At least one scope of work item is required', 400));
      }
    }

    const updates = {};
    if (title !== undefined)          updates.title          = title.trim();
    if (subtitle !== undefined)       updates.subtitle       = subtitle.trim();
    if (industry !== undefined)       updates.industry       = industry.trim();
    if (timeline !== undefined)       updates.timeline       = timeline.trim();
    if (year !== undefined)           updates.year           = Number(year);
    if (challenge !== undefined)      updates.challenge      = challenge.trim();
    if (strategy !== undefined)       updates.strategy       = strategy.trim();
    if (livePreviewUrl !== undefined) updates.livePreviewUrl = livePreviewUrl.trim() || undefined;
    if (coverImage !== undefined)     updates.coverImage     = coverImage.trim()     || undefined;
    if (bodyImage !== undefined)      updates.bodyImage      = bodyImage.trim()      || undefined;
    if (seoTitle !== undefined)       updates.seoTitle       = seoTitle.trim()       || undefined;
    if (seoDescription !== undefined) updates.seoDescription = seoDescription.trim() || undefined;
    if (status !== undefined)         updates.status         = status;
    if (order !== undefined)          updates.order          = Number(order);
    if (scopeOfWork !== undefined)    updates.scopeOfWork    = scopeOfWork.map((s) => s.trim()).filter(Boolean);
    if (stats !== undefined)          updates.stats          = stats.map((s) => ({ value: s.value.trim(), label: s.label.trim() }));

    const updated = await CaseStudy.findOneAndUpdate(
      { slug: req.params.slug },
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// Toggles status between draft and published.
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

// Deletes a case study. Blocked for source = "static" — static-origin records
// are protected until the static HTML files are manually decommissioned.
async function deleteCaseStudy(req, res, next) {
  try {
    const study = await CaseStudy.findOne({ slug: req.params.slug });
    if (!study) return next(new AppError('Case study not found', 404));

    if (study.source === 'static') {
      return next(
        new AppError(
          'Cannot delete a static-origin case study via the API. ' +
          'Remove the static HTML file and update vercel.json first, ' +
          'then change source to "mongo" before deleting.',
          403
        )
      );
    }

    await study.deleteOne();
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

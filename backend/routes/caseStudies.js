'use strict';

const { Router }   = require('express');
const adminAuth    = require('../middleware/adminAuth');
const { getAllCaseStudies, getCaseStudyBySlug } = require('../controllers/caseStudyController');
const {
  adminListCaseStudies,
  adminGetCaseStudy,
  createCaseStudy,
  updateCaseStudy,
  toggleStatus,
  deleteCaseStudy,
} = require('../controllers/adminCaseStudyController');

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/',      getAllCaseStudies);
router.get('/:slug', getCaseStudyBySlug);

// ── Admin — protected ─────────────────────────────────────────────────────────
router.get(   '/admin/list',           adminAuth, adminListCaseStudies);
router.get(   '/admin/:slug',          adminAuth, adminGetCaseStudy);
router.post(  '/',                     adminAuth, createCaseStudy);
router.put(   '/:slug',                adminAuth, updateCaseStudy);
router.patch( '/:slug/status',         adminAuth, toggleStatus);
router.delete('/:slug',                adminAuth, deleteCaseStudy);

module.exports = router;

'use strict';

const { Router }  = require('express');
const adminAuth   = require('../middleware/adminAuth');
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
router.get('/',      getAllCaseStudies);     // GET  /api/case-studies
router.get('/:slug', getCaseStudyBySlug);   // GET  /api/case-studies/:slug

// ── Admin — protected ─────────────────────────────────────────────────────────
router.get(   '/admin/list',          adminAuth, adminListCaseStudies);  // admin listing
router.get(   '/admin/:slug',         adminAuth, adminGetCaseStudy);     // edit form prefill
router.post(  '/',                    adminAuth, createCaseStudy);       // POST /api/case-studies
router.put(   '/:id',                 adminAuth, updateCaseStudy);       // PUT  /api/case-studies/:id
router.patch( '/:slug/status',        adminAuth, toggleStatus);          // PATCH /api/case-studies/:slug/status
router.delete('/:id',                 adminAuth, deleteCaseStudy);       // DELETE /api/case-studies/:id

module.exports = router;

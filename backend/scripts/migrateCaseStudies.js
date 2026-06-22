'use strict';

/**
 * Phase 3 — One-time migration script.
 *
 * Reads the 4 existing Framer-exported case study HTML files,
 * extracts all structured content from the SSR HTML,
 * and inserts CaseStudy documents into MongoDB.
 *
 * Usage:
 *   cd backend
 *   MONGO_URI=<your-uri> node scripts/migrateCaseStudies.js
 *   — or —
 *   node scripts/migrateCaseStudies.js   (if .env is present in backend/)
 *
 * Safe to re-run — existing slugs are skipped, not overwritten.
 */

require('dotenv').config();

const fs        = require('fs');
const path      = require('path');
const mongoose  = require('mongoose');
const CaseStudy = require('../models/CaseStudy');

// ─── Paths ────────────────────────────────────────────────────────────────────

const FRONTEND_DIR = path.join(__dirname, '../../frontend/case-studies');

// ─── Source data ──────────────────────────────────────────────────────────────
// Images are hardcoded from the analysis phase.
// Auto-detection was evaluated but rejected — several pages borrow images
// from sibling case studies, making keyword matching unreliable.

const CASE_STUDY_SOURCES = [
  {
    slug:       'nexlify-saas',
    order:      1,
    coverImage: '/assets/images/nexlify-saas-5.png',
    bodyImage:  '/assets/images/nexlify-saas-8.png',
  },
  {
    slug:       'orvexa-real-estate',
    order:      2,
    coverImage: null,   // No page-specific cover image exists in the export.
    bodyImage:  '/assets/images/scaleon-e-commerce-8.png',
  },
  {
    slug:       'scaleon-e-commerce',
    order:      3,
    coverImage: '/assets/images/scaleon-e-commerce-8.png',
    bodyImage:  '/assets/images/nexlify-saas-8.png',
  },
  {
    slug:       'velora-finance',
    order:      4,
    coverImage: '/assets/images/velora-finance-5.png',
    bodyImage:  '/assets/images/velora-finance-8.png',
  },
];

// ─── Extraction helpers ───────────────────────────────────────────────────────

function first(html, regex) {
  const m = regex.exec(html);
  return m ? m[1].trim() : null;
}

function all(html, regex) {
  const results = [];
  let m;
  const r = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((m = r.exec(html)) !== null) {
    const val = m[1].trim();
    if (val) results.push(val);
  }
  return results;
}

function extractTitle(html) {
  // First <h1> on the page — the case study name
  return first(html, /<h1[^>]*>([^<]+)<\/h1>/);
}

function extractSubtitle(html) {
  // The paragraph immediately after "Back To Projects" nav link
  const m = /Back To Projects[\s\S]{1,500}?<p[^>]*framer-text[^>]*>([^<]{20,})<\/p>/.exec(html);
  return m ? m[1].trim() : null;
}

function extractIndustry(html) {
  // <p>Industry</p> followed by the next framer-text <p>
  const m = /Industry<\/p>[\s\S]{1,200}?<p[^>]*framer-text[^>]*>([^<]+)<\/p>/.exec(html);
  return m ? m[1].trim() : null;
}

function extractTimeline(html) {
  const m = /Timeline<\/p>[\s\S]{1,200}?<p[^>]*framer-text[^>]*>([^<]+)<\/p>/.exec(html);
  return m ? m[1].trim() : null;
}

function extractYear(html) {
  // <time datetime="2024-10-03T...">2024</time>
  const m = /<time datetime="[^"]+">(\d{4})<\/time>/.exec(html);
  return m ? parseInt(m[1], 10) : null;
}

function extractScopeOfWork(html) {
  // Isolate the scope-of-work tag list between its label and the "Industry" field.
  // framer-z9b76h is the flex container holding the scope tags;
  // framer-1ee2yij is the Industry row that immediately follows it.
  const section = /Scope of work<\/p>[\s\S]{1,100}?framer-z9b76h([\s\S]{1,800}?)framer-1ee2yij/.exec(html);
  if (!section) return [];
  return all(section[1], /framer-styles-preset-1oy0gio[^>]*>([^<]+)<\/p>/);
}

function extractStats(html) {
  // h2 values (stat numbers) and the p.framer-styles-preset-e15wf0 labels that follow each
  const statBlocks = [];
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/g;
  let m;

  while ((m = h2Regex.exec(html)) !== null) {
    const value  = m[1].trim();
    const rest   = html.slice(m.index, m.index + 600);
    const labelM = /framer-styles-preset-e15wf0[^>]*>([^<]+)<\/p>/.exec(rest);
    const label  = labelM ? labelM[1].trim() : null;
    statBlocks.push({ value, label });
  }

  // The first 2 h2s on the page are the result stats; later h2s are in "More projects"
  return statBlocks.slice(0, 2);
}

function extractChallenge(html) {
  // First paragraph using the body-text preset (framer-styles-preset-sjnzkt)
  const m = /framer-styles-preset-sjnzkt[^>]*>([^<]{30,})<\/p>/.exec(html);
  return m ? m[1].trim() : null;
}

function extractStrategy(html) {
  // Second paragraph using the same body-text preset
  const regex = /framer-styles-preset-sjnzkt[^>]*>([^<]{30,})<\/p>/g;
  let m;
  let count = 0;
  while ((m = regex.exec(html)) !== null) {
    count++;
    if (count === 2) return m[1].trim();
  }
  return null;
}

function extractSeoTitle(html) {
  return first(html, /<title>([^<]+)<\/title>/);
}

function extractSeoDescription(html) {
  return first(html, /name="description" content="([^"]+)"/);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ MONGO_URI is not set. Cannot connect to MongoDB.');
    process.exit(1);
  }

  console.log('\n──────────────────────────────────────────────');
  console.log(' FDZ Velora — Case Study Migration (Phase 3)');
  console.log('──────────────────────────────────────────────\n');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✓ MongoDB connected\n');

  const report = [];

  for (const source of CASE_STUDY_SOURCES) {
    const htmlPath = path.join(FRONTEND_DIR, source.slug, 'index.html');
    const entry = { slug: source.slug, status: '', warnings: [], inserted: false };

    // ── Check idempotency ──────────────────────────────────────────────────
    const existing = await CaseStudy.findOne({ slug: source.slug });
    if (existing) {
      entry.status = 'SKIPPED (already exists)';
      report.push(entry);
      console.log(`→ ${source.slug}: skipped — document already in MongoDB`);
      continue;
    }

    // ── Read HTML ──────────────────────────────────────────────────────────
    if (!fs.existsSync(htmlPath)) {
      entry.status = 'ERROR — HTML file not found';
      report.push(entry);
      console.error(`✗ ${source.slug}: HTML file not found at ${htmlPath}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');

    // ── Extract fields ─────────────────────────────────────────────────────
    const title       = extractTitle(html);
    const subtitle    = extractSubtitle(html);
    const industry    = extractIndustry(html);
    const timeline    = extractTimeline(html);
    const year        = extractYear(html);
    const scopeOfWork = extractScopeOfWork(html);
    const stats       = extractStats(html);
    const challenge   = extractChallenge(html);
    const strategy    = extractStrategy(html);
    const seoTitle    = extractSeoTitle(html);
    const seoDesc     = extractSeoDescription(html);

    // ── Validate required fields ───────────────────────────────────────────
    const required = { title, subtitle, industry, timeline, year, challenge, strategy };
    for (const [key, val] of Object.entries(required)) {
      if (!val) entry.warnings.push(`MISSING: ${key}`);
    }

    if (!scopeOfWork.length)         entry.warnings.push('MISSING: scopeOfWork');
    if (stats.length < 2)            entry.warnings.push(`MISSING: stats (got ${stats.length}, need 2)`);
    if (stats.some((s) => !s.label)) entry.warnings.push('MISSING: one or more stat labels');

    // ── Flag optional nulls ────────────────────────────────────────────────
    if (!source.coverImage) entry.warnings.push('NULL: coverImage — must be supplied manually');
    if (!source.bodyImage)  entry.warnings.push('NULL: bodyImage — must be supplied manually');

    // ── Always flag livePreviewUrl as needing manual update ────────────────
    entry.warnings.push('ACTION REQUIRED: livePreviewUrl — supply real client URL via admin panel');

    // ── Abort if any required field is missing ─────────────────────────────
    const missingRequired = entry.warnings.filter((w) => w.startsWith('MISSING'));
    if (missingRequired.length) {
      entry.status = 'ERROR — required fields could not be extracted';
      report.push(entry);
      console.error(`✗ ${source.slug}: extraction failed — ${missingRequired.join(', ')}`);
      continue;
    }

    // ── Insert ─────────────────────────────────────────────────────────────
    try {
      await CaseStudy.create({
        title,
        slug:           source.slug,
        subtitle,
        industry,
        timeline,
        year,
        scopeOfWork,
        stats,
        challenge,
        strategy,
        livePreviewUrl: undefined,  // Placeholder URL is not usable — left null intentionally
        coverImage:     source.coverImage || undefined,
        bodyImage:      source.bodyImage  || undefined,
        seoTitle:       seoTitle  || undefined,
        seoDescription: seoDesc   || undefined,
        source:         'static',
        status:         'published',
        order:          source.order,
      });

      entry.status   = 'INSERTED';
      entry.inserted = true;
      report.push(entry);
      console.log(`✓ ${source.slug}: inserted successfully`);
    } catch (err) {
      entry.status = `ERROR — ${err.message}`;
      report.push(entry);
      console.error(`✗ ${source.slug}: insert failed — ${err.message}`);
    }
  }

  // ── Validation report ──────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────');
  console.log(' VALIDATION REPORT');
  console.log('──────────────────────────────────────────────');

  for (const entry of report) {
    console.log(`\n  ${entry.slug}`);
    console.log(`  Status : ${entry.status}`);
    if (entry.warnings.length) {
      entry.warnings.forEach((w) => console.log(`  ⚠  ${w}`));
    } else {
      console.log('  ✓ No warnings');
    }
  }

  const inserted = report.filter((r) => r.inserted).length;
  const skipped  = report.filter((r) => r.status.startsWith('SKIPPED')).length;
  const errors   = report.filter((r) => r.status.startsWith('ERROR')).length;

  console.log('\n──────────────────────────────────────────────');
  console.log(` Summary: ${inserted} inserted  ${skipped} skipped  ${errors} errors`);
  console.log('──────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

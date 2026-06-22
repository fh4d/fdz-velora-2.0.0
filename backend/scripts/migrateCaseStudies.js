'use strict';

/**
 * Case Study Migration Script
 *
 * Source of truth: live Framer pages (turquoise-lemur-139782.framer.app).
 * All content and image CDN URLs were extracted in Phase C.
 *
 * What this script does:
 *   1. Connects to MongoDB.
 *   2. For each of the 4 case studies: deletes any existing record with the
 *      same slug and inserts the correct document (idempotent — safe to re-run).
 *   3. Verifies all 4 slugs are queryable as published.
 *   4. Prints a report.
 *
 * Usage:
 *   cd backend
 *   MONGO_URI=<atlas-uri> node scripts/migrateCaseStudies.js
 *   — or —
 *   node scripts/migrateCaseStudies.js   (if .env is present in backend/)
 */

require('dotenv').config();

const mongoose  = require('mongoose');
const CaseStudy = require('../models/CaseStudy');

// ── Source data ───────────────────────────────────────────────────────────────
// Content extracted from live Framer pages (Phase C audit).
// Images are Framer CDN URLs — publicly accessible, no auth required.
// livePreviewUrl is null for all 4 — client must supply real project URLs.

const CASE_STUDIES = [
  {
    title:     'Nexlify SaaS',
    slug:      'nexlify-saas',
    subtitle:  'Redesigned the product experience and built a scalable acquisition funnel.',
    industry:  'SaaS',
    timeline:  '10 Weeks',
    year:      2024,
    scopeOfWork: ['Paid Advertising', 'Branding'],
    stats: [
      { value: '+185%', label: 'Qualified Leads' },
      { value: '+78%',  label: 'Demo Bookings' },
    ],
    challenge: 'The existing website lacked clarity, and marketing efforts were inconsistent, resulting in low-quality leads and poor conversion performance.',
    strategy:  'We designed a conversion-focused website and built a structured growth funnel, aligning messaging, UX, and acquisition channels to drive better user engagement and lead quality.',
    heroImage: 'https://framerusercontent.com/images/M79racg3TpfNfQGh02MyQwKVjOc.png',
    bodyImage: 'https://framerusercontent.com/images/SmTWFXJ93tM3wO2MSY5lCXX1gqI.png',
    relatedProjects: [{ slug: 'velora-finance' }, { slug: 'scaleon-e-commerce' }],
    livePreviewUrl: undefined,
    seoTitle:       'Nexlify SaaS — Velora',
    seoDescription: 'Redesigned the product experience and built a scalable acquisition funnel.',
    status: 'published',
    order:  1,
  },
  {
    title:     'Orvexa Real Estate',
    slug:      'orvexa-real-estate',
    subtitle:  'Orvexa Real Estate partnered with our studio to modernize their brand and improve local visibility in a competitive property market.',
    industry:  'Real Estate',
    timeline:  '7 Weeks',
    year:      2023,
    scopeOfWork: ['Paid Advertising', 'Branding'],
    stats: [
      { value: '+240%', label: 'Website Traffic' },
      { value: '3.6x',  label: 'Lead Conversion' },
    ],
    // Raw HTML had a UTF-8 mojibake for the apostrophe — corrected here
    challenge: "Orvexa's brand lacked differentiation in a saturated market, making it difficult to stand out or build trust with potential buyers. Their website was outdated, poorly structured, and not optimized for local search, resulting in low visibility and missed opportunities.",
    strategy:  'We repositioned the brand with a refined identity focused on trust and clarity. A new website was designed with a strong emphasis on user experience and conversion flow, while a localized SEO strategy was implemented to target high-intent property searches and improve discoverability.',
    heroImage: 'https://framerusercontent.com/images/xLSn80xFkywSwJTazxbweDyGif8.png',
    bodyImage: 'https://framerusercontent.com/images/7lFJUi8zfdImUHdPr0W5tR3pKM.png',
    relatedProjects: [{ slug: 'velora-finance' }, { slug: 'nexlify-saas' }],
    livePreviewUrl: undefined,
    seoTitle:       'Orvexa Real Estate — Velora',
    seoDescription: 'Orvexa Real Estate partnered with our studio to modernize their brand and improve local visibility in a competitive property market.',
    status: 'published',
    order:  2,
  },
  {
    title:     'Scaleon E-commerce',
    slug:      'scaleon-e-commerce',
    subtitle:  'Optimized the customer journey to increase purchase intent and retention.',
    industry:  'E-commerce',
    timeline:  '9 Weeks',
    year:      2025,
    scopeOfWork: ['Paid Advertising', 'Branding'],
    stats: [
      { value: '+120%', label: 'Revenue Growth' },
      { value: '+65%',  label: 'ROAS' },
    ],
    challenge: 'Despite consistent traffic, Scaleon struggled with low conversion rates and inefficient ad performance. Their customer journey lacked optimization, leading to drop-offs and underperforming campaigns.',
    strategy:  'We analyzed the full customer journey and implemented conversion rate optimization across key touchpoints. Paid ad campaigns were restructured with better audience targeting and creative direction, resulting in improved performance, higher engagement, and increased return on ad spend.',
    heroImage: 'https://framerusercontent.com/images/VSY20Oub79u4TgJXxVhNH73Uw.png',
    bodyImage: 'https://framerusercontent.com/images/LNXz590z8hpTm57BjuG8UjFpU.png',
    relatedProjects: [{ slug: 'velora-finance' }, { slug: 'nexlify-saas' }],
    livePreviewUrl: undefined,
    seoTitle:       'Scaleon E-commerce — Velora',
    seoDescription: 'Optimized the customer journey to increase purchase intent and retention.',
    status: 'published',
    order:  3,
  },
  {
    title:     'Velora Finance',
    slug:      'velora-finance',
    subtitle:  'Repositioned a fintech brand to attract higher-value clients and improve conversion performance.',
    industry:  'Fintech',
    timeline:  '8 Weeks',
    year:      2022,
    scopeOfWork: ['Paid Advertising', 'Branding'],
    stats: [
      { value: '+312%', label: 'Organic Traffic' },
      { value: '4.2x',  label: 'Conversion Rate' },
    ],
    challenge: 'Velora Finance struggled with low visibility and an outdated brand presence that failed to communicate trust and authority. Their website lacked structure, and conversion rates were significantly below industry benchmarks, limiting their ability to attract high-value clients.',
    strategy:  'We redefined the brand positioning and developed a modern identity aligned with their target audience. Alongside a complete website redesign, we implemented a structured SEO strategy focused on high-intent keywords and optimized user journeys to improve engagement and conversion.',
    heroImage: 'https://framerusercontent.com/images/4zVK867wq0rZwEPXnNK4w8msgk.jpg',
    bodyImage: 'https://framerusercontent.com/images/iLSTdrgGRZIUNeN007srGilnhaY.png',
    relatedProjects: [{ slug: 'nexlify-saas' }, { slug: 'scaleon-e-commerce' }],
    livePreviewUrl: undefined,
    seoTitle:       'Velora Finance — Velora',
    seoDescription: 'Repositioned a fintech brand to attract higher-value clients and improve conversion performance.',
    status: 'published',
    order:  4,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('\n✗ MONGO_URI is not set.');
    process.exit(1);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(' Case Study Migration — Phase E');
  console.log('──────────────────────────────────────────\n');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✓ MongoDB connected\n');

  const report = [];

  for (const data of CASE_STUDIES) {
    const { slug } = data;

    // Delete any existing record with this slug (old schema, wrong images)
    const deleted = await CaseStudy.findOneAndDelete({ slug });
    if (deleted) console.log(`  → ${slug}: removed stale record`);

    // Insert fresh document
    try {
      const doc = await CaseStudy.create(data);
      console.log(`  ✓ ${slug}: inserted (_id: ${doc._id})`);
      report.push({ slug, ok: true });
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`);
      report.push({ slug, ok: false, error: err.message });
    }
  }

  // ── Verification ──────────────────────────────────────────────────────────
  console.log('\n── Verification ───────────────────────────\n');

  const expectedSlugs = CASE_STUDIES.map((c) => c.slug);
  for (const slug of expectedSlugs) {
    const doc = await CaseStudy.findOne({ slug, status: 'published' })
      .select('title slug heroImage relatedProjects order');
    if (doc) {
      console.log(`  ✓ /case-studies/${slug}`);
      console.log(`      title: ${doc.title}`);
      console.log(`      heroImage: ${doc.heroImage}`);
      console.log(`      relatedProjects: [${doc.relatedProjects.map((r) => r.slug).join(', ')}]`);
    } else {
      console.error(`  ✗ /case-studies/${slug} — NOT FOUND`);
    }
  }

  const ok    = report.filter((r) => r.ok).length;
  const fails = report.filter((r) => !r.ok).length;

  console.log(`\n── Summary: ${ok} inserted  ${fails} failed ──\n`);

  await mongoose.disconnect();
  process.exit(fails > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

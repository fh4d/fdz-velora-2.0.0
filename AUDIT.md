# FDZ Velora 2.0.0 — Backend Migration Audit
**Version:** 1.0.0
**Audit Date:** 2026-06-22
**Auditor:** Claude (Sonnet 4.6)
**Status:** PHASE 0 — AWAITING APPROVAL BEFORE IMPLEMENTATION

---

## Audit Scope

Source project: `C:\Users\Admin\Desktop\fdz2.0` (Framer export, static)
Working copy: `C:\Users\Admin\Desktop\FDZ-Velora-2.0.0\frontend\` (READ ONLY)
Original: **UNTOUCHED** — no files modified, no files added to source.

---

## 1. Site Inventory

### 1.1 Framer Runtime Identity

```
Generator:     Framer f3f9b36
Build hash:    b3492b4
Hydration:     data-framer-hydrate-v2 (SSR + client reconciliation)
Scroll lib:    Lenis (class="lenis" on <html>)
CMS engine:    Framer DatabaseCollection + QueryEngine
Locale:        default (single locale)
```

### 1.2 Pages & Routes

| Route | HTML File | Purpose | Form Present | CMS Data |
|---|---|---|---|---|
| `/` | `frontend/index.html` | Homepage — hero, services, pricing, contact | ✅ Contact + Newsletter | ✅ case-studies |
| `/about` | `frontend/about/index.html` | Studio / team | ✅ Newsletter | ❌ |
| `/blog` | `frontend/blog/index.html` | Blog post listing | ✅ Newsletter | ✅ **Primary blog CMS** |
| `/blog/the-growth-systems-behind-high-performing-marketing-campaigns` | `frontend/blog/the-growth.../index.html` | Blog post | ✅ Newsletter | ✅ |
| `/blog/turning-social-platforms-into-scalable-growth-channels` | `frontend/blog/turning-social.../index.html` | Blog post | ✅ Newsletter | ✅ |
| `/blog/why-strong-branding-is-the-foundation-of-every-successful-business` | `frontend/blog/why-strong.../index.html` | Blog post | ✅ Newsletter | ✅ |
| `/blog/how-to-build-an-seo-strategy-that-drives-consistent-growth` | **MISSING — no HTML folder** | Blog post #4 | — | ✅ in CMS data only |
| `/case-studies` | `frontend/case-studies/index.html` | Case study listing | ✅ Newsletter | ✅ |
| `/case-studies/nexlify-saas` | `frontend/case-studies/nexlify-saas/index.html` | Case study | ✅ Newsletter | ✅ |
| `/case-studies/orvexa-real-estate` | `frontend/case-studies/orvexa-real-estate/index.html` | Case study | ✅ Newsletter | ✅ |
| `/case-studies/scaleon-e-commerce` | `frontend/case-studies/scaleon-e-commerce/index.html` | Case study | ✅ Newsletter | ✅ |
| `/case-studies/velora-finance` | `frontend/case-studies/velora-finance/index.html` | Case study | ✅ Newsletter | ✅ |
| `/book-a-call` | `frontend/book-a-call/index.html` | Booking page | ❌ (Cal.com iframe) | ❌ |
| `/terms-of-service` | `frontend/terms-of-service/index.html` | Legal page | ✅ Newsletter | ❌ |

**Total: 14 routes. 13 with newsletter form. 1 contact form. 1 broken route. 1 third-party embed.**

### 1.3 Asset Inventory

| Category | Location | Count |
|---|---|---|
| Images | `frontend/assets/images/` | 137 files (PNG/JPG) |
| Videos | `frontend/assets/videos/` | 2 MP4 files |
| Fonts | `frontend/assets/fonts/` | Inter Black woff2 (multiple Unicode subsets) |
| JS modules | `frontend/assets/js/` | 71 hashed `.mjs` files + 3 CMS support `.js` files |
| CMS binary data | `frontend/assets/cms/` | 7 `.framercms` binary chunks |
| CSS | `frontend/styles.css` | 1 file, 224 KB |

### 1.4 External Integrations

| Service | Location | Method | Under Our Control? |
|---|---|---|---|
| **Cal.com** | `/book-a-call` | `<iframe src="https://app.cal.com/framer-placeholder/default/embed?…">` | ❌ Third-party. Replace `framer-placeholder` with real account. |
| **Framer editor bar** | Every page `<head>` | `modulepreload https://framer.com/edit/init.mjs` | Remove in production |
| **Framer search index** | Every page `<head>` | `<meta name="framer-search-index" content="https://framerusercontent.com/…">` | Remove in production |
| **framerusercontent.com CDN** | Blog post images (in CMS data) | Absolute URLs inside `.framercms` binary | Long-term: migrate to own CDN |

### 1.5 Runtime Dependencies (DO NOT REMOVE)

```
Framer runtime     — hydration via hashed .mjs chunks
Lenis              — smooth scroll (class="lenis" on <html>)
Framer CMS engine  — DatabaseCollection, QueryEngine (fetches .framercms files)
window.fetch patch — present on line 4 of every HTML file (routes .framercms to /assets/cms/)
```

---

## 2. Form Audit

### 2.1 CMS Fetch Interceptor (CRITICAL — present on EVERY page)

Every HTML file, line 4, contains this inline script before any other resource:

```js
(function(){
  var f = window.fetch;
  window.fetch = function(u, o) {
    if (typeof u === 'string' && u.includes('.framercms'))
      return f('/assets/cms/' + u.split('/').pop(), o);
    return f(u, o);
  };
})();
```

This runs before Framer hydration. It patches `window.fetch` to redirect CMS data requests to local files. **Any backend integration that also patches `window.fetch` must chain this existing patch, not replace it.**

---

### 2.2 Contact Form

**Location:** Homepage (`/`) only — anchored at `#contact-us-section`
**Purpose:** Project inquiry

**Fields (verified from HTML):**

| Field | Element | `name` attr | `type` | Required | Issue |
|---|---|---|---|---|---|
| Name | `<input>` | `Name` | `text` | ✅ | None |
| Email | `<input>` | `Email` | `email` | ✅ | None |
| Project Details | `<textarea>` | `Email` | — | ✅ | **BUG: same `name` as email field** |
| Honeypot × many | `<input>` hidden | `website`, `company`, `message`, `subject` | `text` | — | `aria-hidden="true"`, `tabIndex=-1`, `position:absolute; transform:scale(0)` |

**Submit button attributes:**
```html
<button type="submit" data-reset="button" data-framer-name="Default" …>Submit</button>
```
`data-reset="button"` signals Framer's internal runtime to reset the form after submission. Framer will fire a **bubble-phase** submit listener to POST to its own endpoint. Our interceptor must fire in the **capture phase** and call `stopImmediatePropagation()` to block Framer's handler.

**Selector stability:**

| Selector | Stability | Verdict |
|---|---|---|
| `form.framer-1uq3czq` | Changes every Framer republish | ❌ NEVER USE |
| `section#contact-us-section form` | `id` is content-derived, stable | ✅ PREFERRED |
| `input[name="Name"]` | HTML attribute, stable | ✅ USE |
| `input[type="email"]` | HTML attribute, stable | ✅ USE |
| `form textarea` | Only one textarea in contact form | ✅ USE |
| `input[aria-hidden="true"]` | Framer honeypot convention, stable | ✅ USE for honeypot check |

**Critical extraction rule:** Do NOT use `new FormData(form).get('Email')` — the textarea collision will return the textarea body, not the email address. Always read:
- Name: `input[name="Name"].value`
- Email: `input[type="email"].value` (NOT by name)
- Message: `textarea.value` (NOT by name)

**MongoDB integration options:**

| Option | Method | Pros | Cons |
|---|---|---|---|
| A (Recommended) | Express injects capture-phase `<script>` into `<head>` at serve time | No file modification, survives re-renders, server controls injection | Requires Express to serve HTML (not pure static CDN) |
| B | Modify HTML files at build time | Simple, no server needed | Must redo on every Framer re-export |
| C | Replace `action` attribute in form HTML | Native HTML POST semantics | Breaks Framer's animated success/error states; requires file modification |

---

### 2.3 Newsletter Form

**Location:** Footer of **every page** (14 files)
**Purpose:** Email list subscription

**Fields:**

| Field | Element | `name` attr | Visible |
|---|---|---|---|
| Email | `<input type="email">` | `Email` | ✅ |
| Honeypots × 10+ | `<input type="text">` | `website`, `company`, `message`, `subject`, `title`, `description`, `feedback`, `notes`, `details`, `remarks` | ❌ |

**How to distinguish from contact form at runtime:** Count non-hidden, non-honeypot inputs.
- Newsletter form = 1 visible field (email only)
- Contact form = 3 visible fields (name + email + textarea)

**Selector:** `form input[type="email"]:not([aria-hidden="true"])` within the 1-field form.

---

### 2.4 Cal.com Booking Embed

**Location:** `/book-a-call` only
**Type:** `<iframe>` — fully third-party
**Current src:** `https://app.cal.com/framer-placeholder/default/embed?layout=month_view&theme=light…`
**Action needed:** Replace `framer-placeholder` with the real Cal.com username. No backend work needed.

---

### 2.5 Form Classification Summary

| Form | Type | Pages | Backend Needed |
|---|---|---|---|
| Contact | Custom Framer | 1 (homepage) | ✅ `POST /api/contact` |
| Newsletter | Custom Framer | 13 (all except book-a-call) | ✅ `POST /api/newsletter` |
| Cal.com embed | Third-party iframe | 1 (book-a-call) | ❌ External service |

---

## 3. Blog Audit

### 3.1 Implementation Type

**Framer CMS — Hybrid SSR + Runtime Fetch**

Evidence:
1. The fetch interceptor on line 4 of every page rewrites `.framercms` requests to local paths
2. `frontend/assets/js/LCRLPhPPh.js` (readable) imports `DatabaseCollection` and `QueryEngine` from the `framer` package — Framer's internal CMS primitives
3. Seven binary `.framercms` files exist in `frontend/assets/cms/`
4. Each blog post also exists as a pre-rendered static HTML file — content renders without JS
5. Blog index page fetches CMS data at runtime to generate the post listing dynamically

### 3.2 Blog CMS Schema (from `LCRLPhPPh.js` source, not guessed)

Framer obfuscates field names. These are the actual property IDs:

| Framer Internal ID | Semantic Meaning | Type |
|---|---|---|
| `DAn3scK2q` | **Title** | `String` |
| `pDwME1fyj` | **Slug** | `String` |
| `dVCYvR1Nd` | **Cover image** | `ResponsiveImage` (JSON with src + srcSet) |
| `v3uFzoGA8` | **Content** | `RichText` (Framer's own AST format — NOT HTML, NOT Markdown) |
| `createdAt` | Created date | `Date` |
| `updatedAt` | Updated date | `Date` |
| `id` | Framer internal ID | `String` (non-nullable) |
| `previousItemId` | Linked list prev | `String` |
| `nextItemId` | Linked list next | `String` |

**The content field is Framer's own AST.** Example structure extracted from CMS binary:
```
[1,[4,"p",{"dir":"auto"},[5,"Text content here"]],[4,"h4",{"dir":"auto"},[5,"Heading"]]…]
```
This is NOT standard Markdown or HTML. Converting this AST to HTML or Markdown requires a custom parser.

### 3.3 Blog Posts Inventory

| Slug | Folder exists | CMS data exists | Status |
|---|---|---|---|
| `the-growth-systems-behind-high-performing-marketing-campaigns` | ✅ | ✅ | OK |
| `turning-social-platforms-into-scalable-growth-channels` | ✅ | ✅ | OK |
| `why-strong-branding-is-the-foundation-of-every-successful-business` | ✅ | ✅ | OK |
| `how-to-build-an-seo-strategy-that-drives-consistent-growth` | ❌ **MISSING** | ✅ | **BROKEN LINK** — blog index links to this, returns 404 |

### 3.4 CMS Collections Identified (from all `.framercms` blobs)

| Bundle ID | Content | Pages using it |
|---|---|---|
| `LCRLPhPPh` | **Blog posts** — 4 records, linked list order | `/blog`, `/blog/*` |
| `RPndE_UK1` | **Case studies** — 4+ records with client, slug, image, excerpt | `/case-studies`, `/case-studies/*` |
| `TPinLLryz` | **Blog tags/categories** — Advertising, Digital Marketing, Optimization… | `/blog` |
| `hatAamrTs` | **Privacy Policy** body (RichText) | `/terms-of-service` (likely) |
| `myCPo9Job` | Unknown — small, possibly author records or config | Unknown |

### 3.5 Migration Options

#### Option A — Keep static blog (no migration)

Serve existing HTML files as-is. No blog backend work.

| Dimension | Assessment |
|---|---|
| Complexity | **Low** |
| Risk | **Low** |
| SEO impact | None — SSR content unchanged |
| Maintenance | Requires Framer re-export for new posts |
| Broken post fix | Manual — copy an existing post folder, rename, edit HTML |
| Authoring | Must re-export from Framer |

#### Option B — MongoDB-backed blog, Express renders HTML

Seed existing post content from HTML into MongoDB. Express intercepts `/blog/*`, fetches from MongoDB, uses Cheerio to inject content into HTML template before serving.

| Dimension | Assessment |
|---|---|
| Complexity | **High** |
| Risk | **High** — Framer hydration conflict (runtime re-fetches `.framercms` and may overwrite substituted content) |
| SEO impact | Positive — correctable canonicals, descriptions, OG images per post |
| Maintenance | Independent of Framer re-exports |
| Authoring | Via internal API or future admin panel |
| Hydration note | Framer runtime will still attempt to fetch `.framercms` and reconcile. If data doesn't match server-rendered HTML, content flicker or console errors occur |

#### Option C — Hybrid (static existing posts + MongoDB for new posts)

Serve existing 3 post HTML files unchanged. New posts authored in MongoDB and rendered by Express using static post HTML as a template.

| Dimension | Assessment |
|---|---|
| Complexity | **Medium** |
| Risk | **Medium** — hydration conflict only on dynamically rendered new posts |
| SEO impact | Neutral for existing; positive for new posts |
| Maintenance | Two code paths |
| Authoring | Existing posts: Framer re-export. New posts: MongoDB API |

**Audit finding:** Option A is safest for MVP. Option B introduces hydration conflict risk that must be evaluated in an isolated test before committing. Option C is a viable incremental path.

---

## 4. SEO Audit

### 4.1 Tags Present on All Pages

| Tag | Present | Current Value | Issue |
|---|---|---|---|
| `<title>` | ✅ | Per-page (blog posts correctly titled) | OK |
| `<meta name="description">` | ✅ | **SAME on all pages** — Framer template default copy | Must be unique per page |
| `<meta property="og:title">` | ✅ | Per-page | OK |
| `<meta property="og:description">` | ✅ | **SAME on all pages** — template copy | Must be unique per page |
| `<meta property="og:image">` | ✅ | `assets/images/image-extra-3.png` everywhere | Blog posts need their cover image |
| `<meta property="og:url">` | ✅ | **Hardcoded to `turquoise-lemur-139782.framer.app`** | Must be replaced with real domain |
| `<meta property="og:type">` | ✅ | `website` on all pages | Blog posts should be `article` |
| `<link rel="canonical">` | ✅ | **Hardcoded to `turquoise-lemur-139782.framer.app`** | Must be replaced with real domain |
| `<meta name="twitter:card">` | ✅ | `summary_large_image` | OK |
| `<meta name="twitter:title">` | ✅ | Per-page | OK |
| `<meta name="twitter:description">` | ✅ | **SAME on all pages** | Must be unique |
| `<meta name="twitter:image">` | ✅ | Same fallback everywhere | OK for now |
| `<meta name="robots">` | ✅ | `max-image-preview:large` | OK |
| `<meta name="framer-search-index">` | ✅ | Points to `framerusercontent.com` | **Remove in production** |
| `<meta name="generator">` | ✅ | `Framer f3f9b36` | Optional remove |
| Structured data (JSON-LD) | ❌ | Not present | Add for blog posts (`Article` schema) |
| `sitemap.xml` | ❌ | Not in export | Express must generate |
| `robots.txt` | ❌ | Not in export | Express must serve |

### 4.2 Critical SEO Actions Required Before Launch

1. Replace all canonical and `og:url` values with real production domain (done at Express serve time, not by modifying HTML files)
2. Add unique `<meta name="description">` per page
3. Add `sitemap.xml` via Express
4. Add `robots.txt` via Express
5. Remove `framer-search-index` meta tag
6. Add `og:image` per blog post (the cover image from CMS data)
7. Blog posts: change `og:type` from `website` to `article`

### 4.3 What Must NOT Be Changed

- All `<link rel="preload">` and `<link rel="modulepreload">` tags (Framer runtime requires these)
- `<base href="/">` — removing this breaks ALL relative asset paths (images, fonts, JS)
- The fetch interceptor script on line 4
- `data-framer-hydrate-v2` attribute on `#main`

---

## 5. Frontend Integration (Runtime) Audit

### 5.1 Hydration Boundary

Framer mounts to: `<div id="main" data-framer-hydrate-v2="{…}">`

The JSON payload contains: `routeId`, `localeId`, breakpoint hashes, and SSR timestamps. The Framer runtime reads this, fetches the appropriate `.mjs` module, and reconciles the existing DOM against a virtual tree.

**Implication:** Any DOM node inside `#main` may be patched or replaced during hydration and on route transitions. No integration code may hold direct node references to elements inside `#main`.

### 5.2 Safe DOM Insertion Points

| Location | Safe? | Reason |
|---|---|---|
| `<head>` (injected by Express middleware) | ✅ SAFE | Framer does not modify `<head>` at runtime |
| Before `<div id="main">` | ✅ SAFE | Outside hydration boundary |
| After closing tag of `#main` container | ✅ SAFE | Outside hydration boundary |
| Inside `#main` — any node | ⚠️ RISKY | May be patched or removed during reconciliation |
| Inside Framer component subtrees | ❌ UNSAFE | Will be overwritten |

### 5.3 Safe Event Integration Points

| Strategy | Safety | Notes |
|---|---|---|
| `document.addEventListener('submit', handler, true)` — **capture phase** on `document` | ✅ SAFE | Fires before any Framer bubble-phase handler. Does not hold node references. Survives re-renders. |
| `MutationObserver` on `#main` | ✅ SAFE | Detects hydration completion if needed |
| Appending additional fetch interceptors | ⚠️ CONDITIONAL | Must chain the existing Framer fetch patch, not replace it |
| `form.addEventListener(…)` on a specific form element | ⚠️ RISKY | If Framer replaces the `<form>` node during state change, listener is orphaned |
| Patching `window.fetch` (second time) | ⚠️ CONDITIONAL | Must wrap the already-patched fetch, check order |

### 5.4 SAFE Modifications

```
✅ Inject <script> tags into <head> via Express middleware
✅ Inject <meta>, <link> corrections into <head> via Express middleware
✅ Serve /api/* routes alongside static files
✅ Serve /robots.txt and /sitemap.xml via Express
✅ Replace canonical and og:url text values before serving
✅ Replace Cal.com iframe src (framer-placeholder → real account)
✅ Add capture-phase event listeners on document
✅ Remove framer-search-index meta tag at serve time
✅ Remove framer editor bar modulepreload at serve time (production only)
```

### 5.5 UNSAFE Modifications

```
❌ Modify any file in frontend/assets/js/ (hashed Framer runtime modules)
❌ Modify frontend/styles.css
❌ Remove <base href="/"> from any page
❌ Remove the window.fetch patch script (line 4)
❌ Modify data-framer-hydrate-v2 JSON
❌ Add action attributes to Framer forms
❌ Insert DOM nodes inside React/Framer component trees
❌ Replace window.fetch without chaining existing Framer patch
❌ Remove <link rel="preload"> or <link rel="modulepreload"> tags
❌ Rename or restructure files inside frontend/assets/
```

---

## 6. Backend Architecture Options

### Option A — CDN + Separate Express API

```
Browser
  ├── Static files → CDN (Vercel / Netlify / Cloudflare Pages)
  └── /api/* → Express (Railway / Render) → MongoDB Atlas
```

Script injection is done at **build time** (one-time HTML transformation).

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Risk | Low — clear separation |
| Scalability | High — frontend scales at CDN edge |
| Maintenance | Medium — two deployments, CORS required |
| CORS | Required between CDN domain and API domain |

---

### Option B — Express Serves Everything (Recommended for MVP)

```
Browser → Express
            ├── HEAD injection middleware (canonical, meta correction)
            ├── express.static() → serves frontend/ files
            ├── GET  /health
            ├── GET  /robots.txt
            ├── GET  /sitemap.xml
            ├── POST /api/contact → MongoDB
            ├── POST /api/newsletter → MongoDB
            └── GET  /api/blog, /api/blog/:slug → MongoDB (Phase 5)
```

| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Risk | Low |
| Scalability | Medium (add Cloudflare in front for edge caching) |
| Maintenance | Low — single deployment |
| CORS | Not required (same origin) |

---

### Option C — Express + SSR Blog from MongoDB

Extends Option B. For `/blog/*` routes, Express fetches post from MongoDB, uses Cheerio to substitute content into the pre-rendered HTML template before serving.

| Dimension | Assessment |
|---|---|
| Complexity | High |
| Risk | High — Framer hydration conflict must be tested |
| Scalability | High |
| Maintenance | High — two content paths |
| CORS | Not required |

---

## 7. Database Planning

### Collection 1: `contacts`

```js
{
  _id:            ObjectId,
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, lowercase: true, trim: true },
  message:        { type: String, required: true, trim: true },
  honeypotTripped: { type: Boolean, default: false },  // server-side recheck
  sourcePage:     { type: String },                    // req.headers.referer
  ip:             { type: String },                    // rate limit reference
  userAgent:      { type: String },
  submittedAt:    { type: Date, default: Date.now }
}
```

Indexes: `{ email: 1, submittedAt: -1 }` (for deduplication lookups)
Why: Core business record. Stored regardless of email delivery success.

---

### Collection 2: `newsletterSubscribers`

```js
{
  _id:              ObjectId,
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  status:           { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
  subscribedAt:     { type: Date, default: Date.now },
  unsubscribedAt:   { type: Date },
  sourcePage:       { type: String },   // which page the form was on
  ip:               { type: String }
}
```

Indexes: `{ email: 1 }` (unique), `{ status: 1 }`
Why: Separate from contacts — different GDPR lawful basis, different downstream processing, different unsubscribe flow.

---

### Collection 3: `blogPosts` (Phase 5 — conditional on blog strategy approval)

```js
{
  _id:          ObjectId,
  slug:         { type: String, required: true, unique: true, index: true, match: /^[a-z0-9-]+$/ },
  title:        { type: String, required: true },
  excerpt:      { type: String },
  content:      { type: String },          // HTML, converted from Framer AST at migration time
  coverImage:   {
    src:        String,                    // URL (initially framerusercontent.com)
    srcSet:     String,
    width:      Number,
    height:     Number
  },
  author:       { type: String },
  tags:         [String],
  published:    { type: Boolean, default: false },
  publishedAt:  { type: Date },
  updatedAt:    { type: Date },
  seo: {
    title:       String,                   // override <title> if different from post title
    description: String,                   // <meta name="description">
    ogImage:     String                    // override og:image URL
  }
}
```

Indexes: `{ slug: 1 }` (unique), `{ published: 1, publishedAt: -1 }`
Why: Replaces proprietary `.framercms` binary format. The `slug` field is the join key to Framer's URL routing — must be exact match.

---

### Collection 4: `caseStudies` (Future — not MVP)

Not required for MVP. Case studies are static and fully functional. Add in Phase 6 if dynamic authoring is needed.

---

## 8. Deployment Planning

### Recommended Stack

```
Service         Platform              Tier
────────────────────────────────────────────────
Backend         Railway               Starter ($5/mo)
Database        MongoDB Atlas         M0 (free) → M10 for production
DNS + CDN       Cloudflare            Free plan
Domain          User-provided         Point A record to Railway app
SSL             Automatic via Railway / Cloudflare  Free
```

### Environment Variables Required

```env
# Application
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fdz-velora

# Domain (used for canonical URL injection)
SITE_DOMAIN=https://yourdomain.com

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Optional (future)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=
```

### CORS Policy

Option B (Express serves everything): **CORS not needed** — same origin.
Option A (separate API): CORS required, restrict to your domain only.

---

## 9. Risk Analysis

| Area | Risk | Level | Reasoning |
|---|---|---|---|
| Contact form integration | Textarea `name="Email"` collision silently corrupts data | 🔴 HIGH | Must read textarea by position/element type, not by `name`. Easy to get wrong. |
| Contact form integration | Framer fires its own submit handler on top of ours | 🟠 MEDIUM | Solved by `stopImmediatePropagation()` in capture phase, but must be tested |
| Newsletter integration | Form is on 13 separate HTML pages | 🟡 LOW | Single interceptor on `document` handles all 13, differentiated by field count |
| Blog migration (Option B/C) | Framer hydration reconciles against `.framercms` data, not our DB | 🔴 HIGH | If server renders from MongoDB but Framer re-renders from CMS binary, content will diverge or flicker. Requires isolated testing before committing. |
| Blog migration (Option A) | Missing 4th post is a broken link | 🟡 LOW | Fixable manually by copying a post folder and editing HTML, or serving a 404 page. |
| SEO — canonical domain | All canonicals hardcoded to Framer preview domain | 🔴 HIGH | Google will index wrong domain. Must be corrected before first public traffic. |
| SEO — duplicate descriptions | Same meta description on all 14 pages | 🟠 MEDIUM | Hurts search ranking quality. Should be corrected in Phase 1. |
| Framer runtime interference | Modifying assets/js/ or styles.css | 🔴 HIGH | Would break the entire site. These files must never be touched. |
| Framer re-export | Client republishes in Framer — form class hashes change | 🟠 MEDIUM | All selectors must use stable attributes (`name`, `type`, `aria-hidden`), never class hashes. |
| Cal.com embed | Currently shows placeholder booking calendar | 🟡 LOW | Needs real Cal.com account URL before launch. Backend has no involvement. |
| Selector drift | Form class names change on Framer republish | 🟠 MEDIUM | Mitigated by attribute-based selectors only |
| Rate limiting absence | Contact/newsletter endpoints open to spam | 🟠 MEDIUM | Must add `express-rate-limit` in Phase 1 |

---

## 10. Discovered Bugs (Pre-Existing)

These exist in the current Framer export and are not introduced by backend work:

| Bug | Location | Severity | Fix Path |
|---|---|---|---|
| Blog post 4 missing on disk | `/blog/how-to-build-an-seo-strategy…` | Medium | Option A: manually create folder. Option B/C: auto-resolved when DB serves content. |
| Contact textarea has `name="Email"` (collision) | `index.html` contact form | High | Backend must extract by element type, not name. Do not modify HTML. |
| All canonical URLs point to Framer preview domain | Every HTML file | High | Express corrects at serve time |
| Identical meta descriptions on all pages | Every HTML file | Medium | Express corrects at serve time |
| Cal.com iframe shows placeholder booking | `book-a-call/index.html` | Medium | Replace src URL with real account |
| `framer-search-index` meta present | Every HTML file | Low | Express removes at serve time |

---

## Audit Verdict

The site is technically sound for backend integration using Option B architecture (Express serves everything). The frontend is in a clean SSR state with stable form selectors and predictable CMS behavior. All identified risks have mitigation paths.

**Status: AUDIT COMPLETE — AWAITING PHASE 0 APPROVAL BEFORE ANY IMPLEMENTATION**

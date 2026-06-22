# FDZ Velora 2.0.0 — Implementation Roadmap
**Version:** 1.0.0
**Date:** 2026-06-22
**Status:** PHASE 0 — AWAITING APPROVAL

---

## Approval Gates

Each phase below ends with a hard STOP.
Implementation must not proceed to the next phase until explicit approval is received.
No phase is automatically triggered by completion of the prior phase.

```
Phase 0 → AUDIT COMPLETE → ⛔ STOP — Await approval
Phase 1 → Backend Foundation → ⛔ STOP — Await approval
Phase 2 → Database Models → ⛔ STOP — Await approval
Phase 3 → Contact Form API → ⛔ STOP — Await approval
Phase 4 → Newsletter API → ⛔ STOP — Await approval
Phase 5 → Blog Strategy → ⛔ STOP — Await approval
Phase 6 → Admin / Dashboard → ⛔ STOP — Await approval
```

---

## Phase 0 — Full Audit ✅ COMPLETE

**Output:** `AUDIT.md` (this file's companion)
**What was done:**
- Created `FDZ-Velora-2.0.0/` working directory
- Copied Framer export to `frontend/` (READ ONLY — original untouched)
- Verified copy: 352 files, exact match
- Performed complete site inventory
- Performed form audit (contact + newsletter + Cal.com embed)
- Performed blog audit (Framer CMS structure identified, schema decoded)
- Performed SEO audit (canonical bug, missing sitemap, description duplication identified)
- Performed runtime/hydration boundary audit
- Evaluated 3 backend architecture options
- Recommended MongoDB schemas for 3 collections
- Produced deployment and environment variable plan
- Ranked all integration risks

**⛔ STOP — Phase 0 complete. Awaiting approval to begin Phase 1.**

---

## Phase 1 — Backend Foundation

**Prerequisites:** Phase 0 audit approved.
**Goal:** Create the Express + Mongoose skeleton. No form integration. No blog work. No frontend changes.

**Directory structure to create:**

```
FDZ-Velora-2.0.0/
  backend/
    config/
      db.js              ← Mongoose connection with retry logic
      env.js             ← Validated environment variable loader (throws on missing required vars)
    controllers/
      healthController.js
    middleware/
      errorHandler.js    ← Centralized error handler (4-param Express signature)
      notFound.js        ← 404 handler for API routes
      rateLimiter.js     ← express-rate-limit instance
      securityHeaders.js ← Helmet configuration
    models/              ← Empty directory, populated in Phase 2
    routes/
      health.js          ← GET /health → { status: "ok", timestamp: "…" }
    services/            ← Empty directory, populated in Phase 3+
    utils/
      logger.js          ← Structured console logger (no external logging service yet)
      AppError.js        ← Custom error class with statusCode + isOperational
    app.js               ← Express app setup (middleware stack, routes, static serving)
    server.js            ← HTTP server bootstrap, DB connection, graceful shutdown
  .env.example           ← All required env vars documented, no real values
  .gitignore
  package.json
```

**Packages (exactly these, no extras):**

| Package | Version | Purpose |
|---|---|---|
| `express` | `^4.18` | HTTP framework |
| `mongoose` | `^8` | MongoDB ODM |
| `helmet` | `^7` | Security HTTP headers |
| `cors` | `^2` | CORS policy |
| `express-rate-limit` | `^7` | Abuse protection |
| `dotenv` | `^16` | Environment variable loading |
| `morgan` | `^1.10` | HTTP request logging |

**No other packages. No TypeScript. No ORM. No additional abstraction layers.**

**Express middleware stack order (in app.js):**

```
1. morgan (logging)
2. helmet (security headers)
3. cors (cross-origin policy)
4. express.json (body parser)
5. rateLimiter (global — loose limit on all routes)
6. HEAD INJECTION MIDDLEWARE (corrects canonical, og:url, removes framer-search-index)
7. express.static('frontend')
8. API routes (/health, then future /api/*)
9. 404 handler
10. Centralized error handler
```

**HEAD injection middleware behavior:**
- Intercepts responses for `*.html` files only
- Replaces `turquoise-lemur-139782.framer.app` with `process.env.SITE_DOMAIN`
- Removes `<meta name="framer-search-index" …>`
- Removes `<link rel="modulepreload" href="https://framer.com/edit/init.mjs">` (production only)
- All other content passes through unmodified

**Endpoint delivered:**

```http
GET /health
Response: 200 { "status": "ok", "timestamp": "2026-06-22T…Z", "env": "production" }
```

**Success criteria for Phase 1:**
- [ ] `node backend/server.js` starts without error
- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] All 14 frontend routes serve correct HTML
- [ ] All assets (CSS, JS, images, fonts) load correctly
- [ ] Canonical tags in served HTML show real domain (from `SITE_DOMAIN` env var)
- [ ] `framer-search-index` meta tag is absent from served HTML
- [ ] Framer runtime hydrates correctly (check browser console — zero Framer errors)
- [ ] Lenis smooth scroll works
- [ ] Animations work
- [ ] Newsletter form is visible and styled (not yet wired to backend)
- [ ] Contact form is visible and styled (not yet wired to backend)

**⛔ STOP after Phase 1. Await approval before Phase 2.**

---

## Phase 2 — Database Models

**Prerequisites:** Phase 1 approved and running.
**Goal:** Define and test Mongoose models. No API endpoints that write data yet.

**Files to create:**

```
backend/models/
  Contact.js             ← contacts collection schema
  NewsletterSubscriber.js ← newsletterSubscribers collection schema
  BlogPost.js            ← blogPosts collection schema (Phase 5 — created now, used later)
```

**Contact schema:**

```js
{
  name:             String (required, trim, maxLength: 200)
  email:            String (required, lowercase, trim, email format)
  message:          String (required, trim, maxLength: 5000)
  honeypotTripped:  Boolean (default: false)
  sourcePage:       String
  ip:               String
  userAgent:        String
  submittedAt:      Date (default: Date.now)
}
```

**NewsletterSubscriber schema:**

```js
{
  email:            String (required, unique, lowercase, trim)
  status:           String (enum: ['active', 'unsubscribed'], default: 'active')
  subscribedAt:     Date (default: Date.now)
  unsubscribedAt:   Date
  sourcePage:       String
  ip:               String
}
```

**BlogPost schema:**

```js
{
  slug:         String (required, unique, index, regex: /^[a-z0-9-]+$/)
  title:        String (required)
  excerpt:      String
  content:      String          ← stored as HTML
  coverImage:   { src, srcSet, width, height }
  author:       String
  tags:         [String]
  published:    Boolean (default: false)
  publishedAt:  Date
  updatedAt:    Date
  seo: {
    title:       String
    description: String
    ogImage:     String
  }
}
```

**Success criteria for Phase 2:**
- [ ] All three models import without error
- [ ] MongoDB connection established (Atlas M0)
- [ ] Test script can insert and retrieve one record per model
- [ ] Indexes are created correctly (check via Atlas UI or Compass)
- [ ] No data is written through public API yet

**⛔ STOP after Phase 2. Await approval before Phase 3.**

---

## Phase 3 — Contact Form API

**Prerequisites:** Phase 2 approved.
**Goal:** Wire contact form to `POST /api/contact`. No newsletter. No blog.

**Files to create/modify:**

```
backend/routes/contact.js
backend/controllers/contactController.js
backend/services/contactService.js
backend/middleware/validateContact.js
```

**Endpoint:**

```http
POST /api/contact
Content-Type: application/json
Body: { "name": "…", "email": "…", "message": "…" }

Success: 201 { "success": true, "message": "Message received" }
Validation fail: 400 { "success": false, "error": "…" }
Rate limited: 429 { "success": false, "error": "Too many requests" }
```

**Strict rate limit on this endpoint:** 5 requests per IP per 15 minutes.

**Server-side validation:**
- `name`: required, non-empty, max 200 chars
- `email`: required, valid email format (regex), max 254 chars
- `message`: required, non-empty, max 5000 chars
- Honeypot fields: if any honeypot key is present and non-empty in body → reject silently (return 200 to fool bots, do not store)

**Frontend interceptor script (injected into `<head>` by Express middleware):**

```js
// This is NOT placed in a file yet — content only, for planning
// Injected before </head> on every HTML page at serve time

document.addEventListener('submit', function(e) {
  var form = e.target;
  if (!(form instanceof HTMLFormElement)) return;

  // Identify visible fields (exclude honeypots)
  var visible = Array.from(form.querySelectorAll('input, textarea'))
    .filter(function(el) {
      return el.getAttribute('aria-hidden') !== 'true' && el.tabIndex !== -1;
    });

  // Contact form: 3 visible fields (name, email, textarea)
  if (visible.length !== 3) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  // Read by element type/position — NOT by name (textarea has wrong name attr)
  var name = form.querySelector('input[name="Name"]').value.trim();
  var email = form.querySelector('input[type="email"]').value.trim();
  var message = form.querySelector('textarea').value.trim();

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email, message: message })
  }).then(function(res) {
    // Success/error handling here — do NOT manipulate Framer DOM
    // Log only; Framer manages its own success/error UI state
    console.log('[FDZ] Contact submitted:', res.status);
  }).catch(function(err) {
    console.error('[FDZ] Contact error:', err);
  });
}, true); // capture phase
```

**Note:** The `stopImmediatePropagation()` will suppress Framer's success animation. Two options must be evaluated before implementation:
1. Accept: Framer success animation is suppressed; add our own success message
2. Allow Framer to animate by NOT calling `stopImmediatePropagation()`, but then Framer also POSTs to its own endpoint (double submission)

**This decision requires explicit approval before Phase 3 implementation.**

**Success criteria for Phase 3:**
- [ ] Contact form submission stores record in MongoDB `contacts` collection
- [ ] All three fields captured correctly (especially message vs email no collision)
- [ ] Honeypot check works (bot submissions rejected silently)
- [ ] Rate limiting: 6th request from same IP within 15 min returns 429
- [ ] Network tab shows POST to `/api/contact` (not to Framer endpoints)
- [ ] No visual regression in contact form appearance
- [ ] Framer runtime shows no JS errors related to form interception

**⛔ STOP after Phase 3. Await approval before Phase 4.**

---

## Phase 4 — Newsletter API

**Prerequisites:** Phase 3 approved.
**Goal:** Wire newsletter form (footer, all 13 pages) to `POST /api/newsletter`.

**Files to create/modify:**

```
backend/routes/newsletter.js
backend/controllers/newsletterController.js
backend/services/newsletterService.js
backend/middleware/validateNewsletter.js
```

**Endpoint:**

```http
POST /api/newsletter
Content-Type: application/json
Body: { "email": "…" }

Success (new):         201 { "success": true, "message": "Subscribed" }
Success (duplicate):   200 { "success": true, "message": "Already subscribed" }
Validation fail:       400 { "success": false, "error": "Invalid email" }
Rate limited:          429
```

**Logic:** Upsert by email (unique index). If email exists and status is `unsubscribed`, set back to `active`. Never create duplicates.

**Unsubscribe flow:**
```
GET /unsubscribe?email=…&token=…
← Token validation against HMAC of email + secret
← Sets status to 'unsubscribed', sets unsubscribedAt
← Returns confirmation page (plain HTML, not Framer)
```

**Update to frontend interceptor:** extend existing capture-phase listener to detect 1-field forms and route to `/api/newsletter`. The single document-level listener handles both forms; field count determines routing.

**Success criteria for Phase 4:**
- [ ] Newsletter submission stores in `newsletterSubscribers` collection
- [ ] Submitting same email twice does not create duplicate
- [ ] Source page is captured per submission
- [ ] Newsletter form works on all 13 pages that have it
- [ ] Unsubscribe endpoint sets correct status

**⛔ STOP after Phase 4. Await approval before Phase 5.**

---

## Phase 5 — Blog Strategy

**Prerequisites:** Phase 4 approved AND blog strategy decision made by client.

**Decision required before implementation begins:**

| Question | Options |
|---|---|
| Blog authoring | A) Framer re-export only  B) MongoDB + future admin  C) Hybrid |
| Missing post 4 | A) Manual HTML fix  B) Seed from content  C) Accept 404 temporarily |
| Image hosting | A) Keep framerusercontent.com  B) Migrate to S3/R2 |

**Option A (static only — no blog backend):**

```
Tasks:
- Fix missing post 4 by creating HTML folder manually (copy existing, edit content)
- Express already serves all /blog/* routes via express.static()
- Add /blog/* routes to sitemap.xml
- No MongoDB blog work needed in this phase
```

**Option B (MongoDB-backed blog):**

```
Tasks:
- Write seed script to extract content from 3 existing post HTML files
- Manually author post 4 content
- Implement GET /api/blog → list of published posts
- Implement GET /api/blog/:slug → full post
- Implement Express route for /blog/:slug that:
    1. Fetches post from MongoDB
    2. Loads post HTML template with Cheerio
    3. Substitutes: title, meta description, canonical, og:image, og:type, post body
    4. Serves modified HTML
- Test: hydration conflict evaluation (MUST PASS before committing to this option)
- Neutralize .framercms fetch if hydration conflict detected
```

**Option C (hybrid):**

```
Tasks:
- Serve existing 3 posts via express.static() as-is
- Fix missing post 4 in MongoDB only
- Express route /blog/:slug:
    - If static file exists → serve as-is
    - If not → fetch from MongoDB and render (Option B logic)
```

**⛔ STOP after Phase 5. Await approval before Phase 6.**

---

## Phase 6 — Admin / Dashboard (Future)

**Prerequisites:** Phases 1–5 complete and approved. Explicit decision to build admin UI.

**Scope options:**

| Option | Description |
|---|---|
| API-only | Add POST /api/blog, PUT /api/blog/:id, DELETE /api/blog/:id behind JWT auth |
| Headless CMS | Integrate Payload CMS or Directus as admin layer |
| Custom admin SPA | Build separate React/Vue app on /admin/* route |

**Regardless of option:**
- Admin routes live under `/admin/*` — never inside Framer frontend
- JWT authentication required before any admin route is accessible
- POST/PUT/DELETE blog endpoints are NOT exposed on public API
- Image upload requires object storage (AWS S3 or Cloudflare R2)

**This phase has no committed implementation plan until Phase 5 is complete.**

---

## Summary Table

| Phase | Name | Status | Deliverable |
|---|---|---|---|
| 0 | Full Audit | ✅ Complete | `AUDIT.md`, `ROADMAP.md` |
| 1 | Backend Foundation | ⏸ Awaiting approval | Express server, health endpoint, static serving, head middleware |
| 2 | Database Models | ⏸ Pending | 3 Mongoose models, Atlas connection |
| 3 | Contact Form API | ⏸ Pending | `POST /api/contact`, DOM interceptor |
| 4 | Newsletter API | ⏸ Pending | `POST /api/newsletter`, unsubscribe flow |
| 5 | Blog Strategy | ⏸ Pending (decision required) | Depends on client decision |
| 6 | Admin / Dashboard | 🔮 Future | Depends on Phase 5 outcome |

# Blog Strategy — Hybrid System
**Phase:** 5
**Status:** Approved and implemented

---

## Core Principle

The Framer static blog is the **primary and permanent** content source.
MongoDB is an **additive extension only** — it never replaces, overrides, or conflicts with Framer content.

These two systems operate in completely separate lanes.

---

## How the Two Systems Coexist

```
/blog                          → Served by express.static() from frontend/blog/index.html
/blog/turning-social-...       → Served by express.static() from frontend/blog/turning-social-.../index.html
/blog/the-growth-systems-...   → Served by express.static() from frontend/blog/the-growth-.../index.html
/blog/why-strong-branding-...  → Served by express.static() from frontend/blog/why-strong-.../index.html

/api/blog                      → Returns ONLY MongoDB posts (source = "mongo")
/api/blog/:slug                → Returns ONE MongoDB post by slug (source = "mongo")
```

The `/blog/*` URL namespace belongs entirely to the Framer export.
The `/api/blog/*` URL namespace belongs entirely to MongoDB.
These namespaces never intersect.

---

## Static Framer Blog — What Stays Unchanged

- All files inside `frontend/blog/` are READ ONLY
- `express.static('frontend')` serves them with zero modification
- Framer's `.framercms` binary chunks continue to load via the fetch interceptor
- Framer's runtime hydration of blog pages is not touched
- The blog listing page (`/blog`) continues to render from Framer CMS data
- No canonical tags, meta tags, or SEO attributes inside Framer HTML are modified

---

## MongoDB Blog — Rules for New Posts

1. New posts are authored directly in MongoDB via seed script or future admin tool
2. Every new post **must** have `source: "mongo"` (schema default — cannot be omitted)
3. Every new post **must** have a slug that does not match any existing Framer blog slug

### Existing Framer slugs (RESERVED — never use these in MongoDB):
```
turning-social-platforms-into-scalable-growth-channels
the-growth-systems-behind-high-performing-marketing-campaigns
why-strong-branding-is-the-foundation-of-every-successful-business
how-to-build-an-seo-strategy-that-drives-consistent-growth
```

4. MongoDB posts are only surfaced via `/api/blog` and `/api/blog/:slug`
5. The frontend is responsible for deciding whether and how to display MongoDB posts
6. No Express route rewrites, intercepts, or proxies any `/blog/*` URL

---

## Slug Collision Avoidance

- The four reserved slugs above are never inserted into MongoDB
- When authoring new MongoDB posts, the slug must be unique in the MongoDB collection (enforced by the `unique` index on `slug`)
- If a future admin tool is built, it must validate against the reserved slug list before saving

---

## SEO Consistency

- Framer posts: SEO is fully handled by the pre-rendered HTML in `frontend/blog/*/index.html`
- MongoDB posts: SEO fields (`seoTitle`, `seoDescription`) exist in the `BlogPost` model for future use
- No canonical URL injection or meta tag modification is performed by the current API layer

---

## Routing Behavior Summary

| Request | Handled by | Source |
|---|---|---|
| `GET /blog` | `express.static` | Framer HTML |
| `GET /blog/:framer-slug` | `express.static` | Framer HTML |
| `GET /api/blog` | Express route | MongoDB only |
| `GET /api/blog/:slug` | Express route | MongoDB only |
| Any unknown `/blog/*` | `express.static` 404 | — |

---

## What This Phase Does NOT Build

- No blog creation, update, or delete endpoints
- No admin dashboard
- No authentication
- No Markdown rendering
- No Framer CMS migration
- No frontend changes

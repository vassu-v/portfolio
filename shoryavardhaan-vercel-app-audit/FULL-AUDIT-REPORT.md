# SEO Audit — shoryavardhaan.vercel.app
**Date:** 2026-06-20 | **Business type:** Personal Portfolio + Publisher | **Auditors:** 5 parallel specialist agents

---

## SEO Health Score: 41/100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 35/100 | 7.7 |
| Content Quality (E-E-A-T) | 23% | 55/100 | 12.7 |
| On-Page SEO | 20% | 40/100 | 8.0 |
| Schema / Structured Data | 10% | 42/100 | 4.2 |
| Performance (CWV) | 10% | 38/100 | 3.8 |
| AI Search Readiness | 10% | 25/100 | 2.5 |
| Images | 5% | 45/100 | 2.3 |
| **TOTAL** | | | **41.1** |

> **Context:** 41/100 is typical for a well-built SPA portfolio that hasn't addressed JavaScript rendering yet. The content quality and design are genuinely strong — the score is depressed almost entirely by the SPA architecture. Fix the render gap and most categories jump 20–30 points immediately.

---

## Executive Summary

**The site has one root cause pulling down every category: content exists only after JavaScript executes.**

Every URL — `/`, `/blog/building-buy4chai`, `/project/buy4chai` — serves identical raw HTML:
```html
<body><div id="root"></div></body>
```

With a single canonical hardcoded to `/`. Googlebot renders JS eventually, but non-Google AI crawlers (ChatGPT, Perplexity, ClaudeBot) never do. Social scrapers (LinkedIn, WhatsApp) never do. The first-wave Google crawl sees nothing useful for any inner page.

**The content that exists is genuinely good:**
- 5 blog posts with specific, first-person, data-backed writing
- 5 detailed project case studies with problem/solution/impact framing
- Person schema present in static HTML
- Real E-E-A-T signals (India Innovates Top 1k, Zenodo research, 13 GitHub stars, co-authored LinkedIn article)

Fix the delivery mechanism and the SEO health score jumps to an estimated **72–78/100** without changing any content.

---

## Critical Issues (Fix Immediately)

### C1 — SPA: All inner pages serve blank HTML to crawlers
**Categories affected:** Technical, On-Page, Schema, AI Search, SXO
**Root cause:** React SPA renders everything client-side. Raw HTML for every URL is `<div id="root"></div>` with homepage metadata.

**Why it matters:** The `<link rel="canonical" href="https://shoryavardhaan.vercel.app/">` hardcoded in `index.html` tells Google every page is a duplicate of the homepage. Googlebot will collapse all 12 sitemap URLs into one. Non-Google AI crawlers (ChatGPT, Perplexity, Claude) never execute JS — they permanently see a blank page at every URL.

**Fix:** Implement static site generation with `vite-ssg`. The data layer (`blog.js`, `projects.js`) is already perfectly structured for SSG — it's a configuration change, not a rewrite. Each route gets a pre-rendered HTML file with the correct title, description, canonical, and schema at build time.

```bash
npm install vite-ssg
```

This is the highest-leverage change on the entire site. Everything else in this report is secondary to it.

**Falsifiability:** After deploy, `curl https://shoryavardhaan.vercel.app/blog/building-buy4chai | grep "<title>"` should return the post title, not "Shoryavardhaan Gupta".

---

### C2 — Empty JSON-LD block in index.html
**File:** `index.html` (already has a valid Person schema — but SXO agent detected an empty `{}` block was present in an earlier version; verify current state)
**Fix:** Confirm the static Person schema is valid JSON. Run through https://validator.schema.org.

---

### C3 — Soft 404s: All unknown routes return HTTP 200
**Category:** Technical
**Impact:** Google may crawl and index typo URLs (e.g. `/project/buy4-chai`, `/blog/wrong-slug`) with no content, wasting crawl budget and creating thin-content entries.

**Fix (no SSG required):** Use Vercel Edge Middleware to detect routes that don't match known slugs and return a true 404. Simpler interim fix: add `<meta name="robots" content="noindex">` from the client-side 404 render state.

---

### C4 — LCP blocked by 950ms preloader + no image preload
**Category:** Performance
**Impact:** Chrome's LCP measurement starts at navigation start. The preloader `setTimeout(950)` guarantees LCP cannot occur before ~950ms. On mobile with JS parse time added, this puts real-world LCP above 3,000ms (poor threshold).

**Fix:**
1. Reduce preloader to ≤300ms or event-driven (fire when fonts loaded, not on fixed timer)
2. Add to `index.html`:
```html
<link rel="preload" as="image" href="/preview (1).jpg" fetchpriority="high">
```
3. Add `fetchpriority="high"` to the hero `<img>` in `Hero.jsx`

---

### C5 — Font Awesome: render-blocking external CDN stylesheet
**Category:** Performance
**Impact:** `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/...font-awesome/6.5.1/css/all.min.css">` is synchronous and render-blocking. 102 KB of CSS + 3 woff2 font files from a third-party origin block FCP/LCP. Only 8 unique icons are used across the entire site.

**Fix:** Remove the CDN link. Replace each `<i className="fa-...">` with inline SVGs. There are only 8 icons — this is a 30-minute job that eliminates one render-blocking external request entirely.

---

### C6 — Blog post title opaque to search intent (Buy4Chai)
**Category:** SXO
**File:** `src/data/blog.js`
**Finding:** The post at `/blog/building-buy4chai` is titled "The gap nobody was filling." Users searching "Indian developer Stripe alternative" or "Buy Me a Coffee India UPI" will never click it. The content is exactly what those users need.

**Fix:** Update the title to surface the keyword angle while keeping the voice. Example: `"Why Indian developers can't get paid online — and how I fixed it"`.

---

## High Priority Issues (Fix Within 1 Week)

### H1 — OG image is SVG, breaks social previews
**Files:** `index.html`, `src/App.jsx`
LinkedIn, Facebook, WhatsApp, and iMessage do not render SVG as social preview images. Every shared link shows a broken or blank image — this kills CTR from social sharing.

**Fix:** Export `public/og-image.svg` as `public/og-image.png` (1200×630) and update all references. Rename the URL from `.svg` to `.png` in both `index.html` and the `BASE_IMG` constant in `App.jsx`.

---

### H2 — Old Vercel preview URL competing for name search
**Finding:** `portfolio-vassu-vs-projects.vercel.app` is indexed by Google and appears in SERP results for "Shoryavardhaan Gupta", splitting authority with the production domain.

**Fix:** In Vercel dashboard, go to the old project → Settings → Domains → add a redirect from `portfolio-vassu-vs-projects.vercel.app` to `https://shoryavardhaan.vercel.app`.

---

### H3 — Missing `preconnect` to `fonts.gstatic.com`
**File:** `index.html`
Google Fonts CSS at `fonts.googleapis.com` redirects the browser to fetch woff2 files from `fonts.gstatic.com`. Without a preconnect, an extra DNS+TLS round-trip (~200–400ms) occurs before any font bytes arrive.

**Fix:**
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

---

### H4 — Person schema missing key entity signals
**File:** `index.html`
Current Person schema missing: `@id`, `description`, `birthDate`, `knowsAbout`, `award`, `memberOf`, `alternateName`. These are the fields AI crawlers read to understand who Shoryavardhaan Gupta is — and they're the only thing non-Google crawlers can currently read.

**Fix:** Replace the Person schema block:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://shoryavardhaan.vercel.app/#person",
      "name": "Shoryavardhaan Gupta",
      "alternateName": "Shorya",
      "birthDate": "2009-09-02",
      "description": "16-year-old builder and developer from Kolkata, India. Creator of Buy4Chai (Razorpay/UPI supporter pages for developers), SarkarSathi (AI civic tech, India Innovates Top 1k), and a disaster-resilient LiFi mesh network. Published AI planning research on Zenodo at age 15. Kolkata Fork Lead at Bits&Bytes. Youth Partner at 4MQ.org.",
      "jobTitle": "Builder & Developer",
      "address": { "@type": "PostalAddress", "addressLocality": "Kolkata", "addressCountry": "IN" },
      "knowsAbout": ["Civic Technology", "Open Source Software", "Hardware Prototyping", "AI Research", "Web Development"],
      "award": ["India Innovates 2026 Top 1,000 of 26,000+ entries", "CBSE Regional Science Exhibition 2025-26"],
      "memberOf": [
        { "@type": "Organization", "name": "Bits&Bytes" },
        { "@type": "Organization", "name": "4MQ.org" }
      ],
      "image": { "@type": "ImageObject", "url": "https://shoryavardhaan.vercel.app/syi.png" },
      "url": "https://shoryavardhaan.vercel.app/",
      "sameAs": [
        "https://github.com/vassu-v",
        "https://www.linkedin.com/in/shoryavardhaan",
        "https://x.com/shoryavardhaan",
        "https://www.instagram.com/let_shorya.be/",
        "https://medium.com/@shoryavardhaans2"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://shoryavardhaan.vercel.app/#website",
      "url": "https://shoryavardhaan.vercel.app/",
      "name": "Shoryavardhaan Gupta",
      "author": { "@id": "https://shoryavardhaan.vercel.app/#person" },
      "inLanguage": "en-IN"
    },
    {
      "@type": "ProfilePage",
      "@id": "https://shoryavardhaan.vercel.app/",
      "mainEntity": { "@id": "https://shoryavardhaan.vercel.app/#person" },
      "dateModified": "2026-06-20"
    }
  ]
}
```

---

### H5 — datePublished non-ISO in BlogPosting schema
**Files:** `src/data/blog.js`, `src/App.jsx`
`post.date` is stored as `"May 2026"` — not ISO 8601. Google's Rich Results tester rejects non-ISO dates and won't surface blog posts in rich results.

**Fix:** Add `isoDate` field to each post in `blog.js`:
- `building-buy4chai` → `'2026-05-01'`
- `markets-dont-get-disrupted` → `'2026-05-15'`
- `apple-ai-decade` → `'2026-04-01'`
- `both-groups-are-losing` → `'2026-04-15'`
- `hardware-failure` → `'2026-02-01'`

In `App.jsx`, change `datePublished: post.date` to `datePublished: post.isoDate ?? post.date`.

---

### H6 — BlogPosting schema missing required fields
**File:** `src/App.jsx`
Current BlogPosting is missing `mainEntityOfPage` (required for rich results), has wrong `publisher` type (must be `Organization` for article eligibility), missing `articleSection`, `wordCount`, `dateModified`.

**Fix:** See schema agent findings for complete replacement block.

---

### H7 — 5 concurrent RAF loops — INP risk on mid-range devices
**Category:** Performance
DotGrid physics, smooth scroll, cursor glow, hero parallax, and Footer liquid all run simultaneously at 60fps on the main thread. On budget Android devices, combined frame cost exceeds 16ms budget, causing dropped frames and elevated INP.

**Fixes (in priority order):**
1. Move DotGrid to OffscreenCanvas + Web Worker
2. Replace `scrollTop`-based smooth scroll with CSS `scroll-behavior: smooth` or transform-based approach
3. Add `matchMedia('(max-width: 767px)')` early return in DotGrid to skip canvas on mobile entirely
4. Merge cursor RAF and hero parallax RAF into one loop

---

### H8 — No author byline on blog posts
**File:** `src/pages/BlogPost.jsx`
Individual blog posts don't show the author's name in the rendered UI. Google's quality rater "Who" heuristic is unmet. One line fix: add `by Shoryavardhaan Gupta` to the post header component.

---

## Medium Priority (Fix Within 1 Month)

| # | Finding | File | Fix |
|---|---|---|---|
| M1 | Security headers absent (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) | `vercel.json` | Add headers config |
| M2 | No H2/H3 headings inside blog post bodies | `src/data/blog.js` | Add `{type:'heading'}` blocks |
| M3 | No internal links in blog content | `src/data/blog.js` | Link buy4chai post → `/project/buy4chai` etc. |
| M4 | Image alt text empty on all blog/project images | `BlogPost.jsx`, `BlogIndex.jsx` | `alt={post.title}` |
| M5 | Cache-Control on `/assets/*` should be immutable | `vercel.json` | `max-age=31536000, immutable` |
| M6 | `1758438412149.png` is 746 KB (PNG photograph) | `public/` | Convert to WebP, target <80 KB |
| M7 | `syi.png` is 309 KB (PNG photograph) | `public/` | Convert to WebP |
| M8 | Space Grotesk loaded in 5 weights but unused | `index.html` | Remove from Google Fonts URL |
| M9 | BreadcrumbList absent on project/blog pages | `src/App.jsx` | Add to dynamic jsonld |
| M10 | `/blog` index has no structured data | `src/App.jsx` | Add Blog schema |
| M11 | Blog posts on Medium/LinkedIn create thin-content stubs | `src/data/blog.js` | Expand native summaries OR add `sameAs` in schema |
| M12 | DotGrid RAF runs during preloader (wasted CPU) | `DotGrid.jsx` | Delay RAF start until preloader exits |

---

## Low Priority (Backlog)

| # | Finding | Fix |
|---|---|---|
| L1 | Missing `preconnect` to `cdnjs.cloudflare.com` | Add preconnect (or eliminate FA CDN — preferred) |
| L2 | Sitemap `lastmod` dates hardcoded to today for all projects | Use actual content modification dates |
| L3 | `dateModified` absent from BlogPosting schema | Add alongside `datePublished` |
| L4 | No `/llms.txt` | Create minimal file for future AI crawler optionality |
| L5 | No narrative post for "16 year old developer India" intent | Write a first-person origin story blog post |
| L6 | No `/about` standalone route | Create or ensure About content is prerendered |
| L7 | `hero image srcset` absent — mobile downloads same size as desktop | Add WebP srcset to Hero.jsx |
| L8 | `loading="lazy"` absent on below-fold images | Add to Highlights, About, Projects image elements |

---

## Positives (Preserve These)

- `robots.txt` correct — all crawlers allowed, sitemap referenced
- Sitemap covers all 12 routes with appropriate priorities
- HSTS present and correctly configured
- HTTP/2 confirmed
- CDN cache HIT from Vercel edge
- Person schema present in static HTML (rare for SPAs)
- Dynamic per-route JSON-LD architecture is correct — just needs content fixes
- Blog content has genuine first-person specificity and citable statistics
- E-E-A-T signals are real: India Innovates Top 1k, Zenodo preprint, MIT-licensed open source
- Meta description, OG tags, Twitter Card all present
- Canonical in static HTML (even if currently pointing to `/` for all pages)
- Content in `blog.js` and `projects.js` is architecturally perfect for SSG

---

## Action Plan
See `ACTION-PLAN.md` for the phased implementation roadmap.

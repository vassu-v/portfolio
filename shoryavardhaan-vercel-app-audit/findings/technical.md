# Technical SEO — Findings
**Agent:** seo-technical | **Score:** 35/100

## Summary
The site has a correct and complete robots.txt + sitemap setup, HSTS, HTTP/2, and CDN edge delivery. These are real positives. The critical gap is the SPA render model: every URL serves identical blank HTML at crawl time, and the static canonical points all pages to `/`. Soft 404s compound this by letting unknown routes silently pass.

## Positives
- `robots.txt`: correct, all crawlers allowed, sitemap referenced
- `sitemap.xml`: covers all 12 routes, appropriate priority values
- HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` ✓
- HTTP/2 confirmed
- CDN cache HIT from Vercel edge on all static assets
- `vercel.json` has SPA rewrite rule (`"source": "/(.*)", "destination": "/"`) — prevents hard 404s on direct navigation

## Critical Findings

### C1: SPA Render Gap
Every URL serves this raw HTML to crawlers:
```html
<!doctype html>
<html lang="en">
<head>
  <title>Shoryavardhaan Gupta</title>
  <link rel="canonical" href="https://shoryavardhaan.vercel.app/" />
  <!-- all homepage meta -->
</head>
<body><div id="root"></div></body>
</html>
```
The `<link rel="canonical" href=".../">` hardcoded in `index.html` tells Google every URL is a duplicate of the homepage. Googlebot collapses all 12 sitemap URLs into one. Non-Google AI crawlers never render JS at all.

**Fix:** `vite-ssg` — static pre-render at build time, no runtime change required.
**Falsifiability:** `curl https://shoryavardhaan.vercel.app/blog/building-buy4chai | grep "<title>"` should return post title after fix.

### C3: Soft 404s
Unknown routes like `/project/nonexistent`, `/blog/typo-slug` return HTTP 200 with blank SPA content. Google crawls these as thin pages and wastes crawl budget.

**Fix (interim, no SSG):** Detect unmatched routes in `router.jsx` or `App.jsx` and inject `<meta name="robots" content="noindex">` from the 404 render state.

## Medium Findings

### M1: Security Headers Missing
None of these headers are present:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

Fix via `vercel.json` headers config.

### M5: /assets/* Not Immutable
Vite content-hashes all built assets. They should be served with `Cache-Control: public, max-age=31536000, immutable`. Currently missing the `immutable` directive.

Fix via `vercel.json` headers config for `source: "/assets/(.*)"`.

## Low Findings

### L2: Sitemap lastmod dates are all today
All 12 sitemap entries have `<lastmod>2026-06-19</lastmod>`. These should reflect actual content modification dates. Minor signal for Googlebot crawl prioritization.

# Schema / Structured Data — Findings
**Agent:** seo-schema | **Score:** 42/100

## Summary
The architecture is right — static Person schema in index.html, dynamic page-level schemas injected via useEffect in App.jsx. But the content inside each schema has gaps that prevent Rich Results eligibility and weaken entity recognition. Fix H4+H5+H6 in one session and schema score jumps to ~70/100.

## Current Schema Inventory

| Schema | Location | Status |
|---|---|---|
| Person | `index.html` (static) | Present but incomplete |
| WebSite | Missing | Not present |
| ProfilePage | Missing | Not present |
| SoftwareApplication | `App.jsx` (dynamic, project routes) | Present, minor gaps |
| BlogPosting | `App.jsx` (dynamic, blog routes) | Present, multiple missing required fields |
| Blog | Missing | Not present on /blog |
| BreadcrumbList | Missing | Not on any page |

## High Findings

### H4: Person Schema Missing Key Entity Signals

**Current:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Shoryavardhaan Gupta",
  "url": "https://shoryavardhaan.vercel.app/",
  "image": "https://shoryavardhaan.vercel.app/syi.png",
  "jobTitle": "Builder & Developer",
  "address": {"@type": "PostalAddress", "addressLocality": "Kolkata", "addressCountry": "IN"},
  "sameAs": ["...github", "...linkedin", "...x", "...instagram"]
}
```

**Missing:**
- `@id` — without it, schema.org can't link entity references across pages
- `description` — the most direct "who is this person" signal for AI crawlers
- `birthDate` — establishes the "16-year-old" credential
- `knowsAbout` — topical authority signals
- `award` — India Innovates + CBSE cred
- `memberOf` — Bits&Bytes + 4MQ
- `alternateName` — "Shorya"
- Medium not in `sameAs`

**Fix:** Replace with @graph containing Person + WebSite + ProfilePage. Full replacement block in FULL-AUDIT-REPORT.md H4.

### H5: datePublished Non-ISO 8601
`post.date` stores `"May 2026"`. Google's structured data validator rejects this format. Blog posts are ineligible for rich results (article sitelinks, date display) until this is fixed.

**Fix:**
- Add `isoDate` field to each post in `blog.js`
- In `App.jsx`: `datePublished: post.isoDate ?? post.date`

### H6: BlogPosting Missing Required Fields
Current BlogPosting schema is missing:
- `mainEntityOfPage` — required for Article rich results
- `publisher` with `Organization` type (current uses `Person` — ineligible for full article rich results)
- `dateModified`
- `articleSection`
- `wordCount`

**Fix (full replacement):**
```js
jsonld = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  '@id': url,
  headline: post.title,
  description: post.subtitle,
  url,
  datePublished: post.isoDate ?? post.date,
  dateModified: post.isoDate ?? post.date,
  image: { '@type': 'ImageObject', url: img },
  author: { '@type': 'Person', '@id': `${BASE_URL}/#person`, name: BASE },
  publisher: { '@type': 'Person', name: BASE, url: BASE_URL },
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  inLanguage: 'en-IN',
}
```

## Medium Findings

### M9: BreadcrumbList Absent on Project/Blog Pages
No breadcrumb schema on any inner page — missing the SERP breadcrumb rich result (e.g. `shoryavardhaan.vercel.app › blog › building-buy4chai`).

**Fix:** Add to dynamic jsonld in App.jsx. Reduces to 3 lines per route:
```js
{ '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
  { '@type': 'ListItem', position: 2, name: 'Log', item: `${BASE_URL}/blog` },
  { '@type': 'ListItem', position: 3, name: post.title, item: url },
]}
```

### M10: No Blog Schema on /blog Index
The BlogIndex route at `/blog` emits no structured data despite listing all posts.

**Fix:** In the `isBlogIndex` branch of the meta useEffect in App.jsx:
```js
jsonld = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: `Log — ${BASE}`,
  url: `${BASE_URL}/blog`,
  author: { '@type': 'Person', '@id': `${BASE_URL}/#person` },
  inLanguage: 'en-IN',
}
```

## Validation Notes
- Verify current Person schema at: https://validator.schema.org (paste index.html content)
- After fix, validate BlogPosting at: https://search.google.com/test/rich-results
- The `{}` empty JSON-LD block noted by SXO agent: verify it's not present in current index.html (the Person schema block should be the only `application/ld+json` in the static HTML)

# Action Plan — shoryavardhaan.vercel.app
**Generated:** 2026-06-20 | **SEO Health Score:** 41/100 → Est. 72–78/100 after Phase 1

---

## Phase 1: Critical Fixes (This Week)

> These unblock everything else. Phase 2 items compound in value once Phase 1 is done.

### 1.1 Fix the Person schema in index.html *(30 min)*
Expand to @graph with Person + WebSite + ProfilePage. Add `@id`, `description`, `birthDate`, `knowsAbout`, `award`, `memberOf`, `alternateName`. This is the only thing AI crawlers (ChatGPT, Perplexity, ClaudeBot) can currently read about you — it needs to be complete.

**Files:** `index.html`
**Reference:** H4 in FULL-AUDIT-REPORT.md with complete replacement JSON

---

### 1.2 Fix datePublished in blog.js + App.jsx *(15 min)*
Add `isoDate` field to all 5 posts. Update App.jsx to use it. Unblocks Google Rich Results (article sitelinks, date display in SERPs).

**Files:** `src/data/blog.js`, `src/App.jsx`
**Dates to add:**
```js
{ slug: 'building-buy4chai',           isoDate: '2026-05-01' }
{ slug: 'markets-dont-get-disrupted',  isoDate: '2026-05-15' }
{ slug: 'apple-ai-decade',             isoDate: '2026-04-01' }
{ slug: 'both-groups-are-losing',      isoDate: '2026-04-15' }
{ slug: 'hardware-failure',            isoDate: '2026-02-01' }
```

---

### 1.3 Convert og-image.svg → og-image.png *(20 min)*
SVG OG images break on LinkedIn, WhatsApp, iMessage. Export at 1200×630 PNG. Update `index.html` and `src/App.jsx` (`BASE_IMG` constant).

**Files:** `public/og-image.png` (new), `index.html`, `src/App.jsx`

---

### 1.4 Add preconnect hints to index.html *(5 min)*
Add before any stylesheet links:
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
```

**File:** `index.html`

---

### 1.5 Redirect old Vercel preview URL *(10 min, no code)*
In Vercel dashboard: old project → Settings → Domains → redirect `portfolio-vassu-vs-projects.vercel.app` to `https://shoryavardhaan.vercel.app`. Stops authority splitting on name searches.

---

## Phase 2: High-Impact Improvements (Next 1–2 Weeks)

### 2.1 Add noindex to client-side 404 state *(30 min)*
In `router.jsx` or `App.jsx`, detect unknown routes and inject `<meta name="robots" content="noindex">`. Stops Google from crawling/indexing thin 200 pages that return no matching content.

---

### 2.2 Add author byline to BlogPost.jsx *(15 min)*
Google's quality rater "Who" heuristic: individual post pages need a visible author name. One line in `src/pages/BlogPost.jsx`.

---

### 2.3 Complete BlogPosting schema in App.jsx *(20 min)*
Add `mainEntityOfPage`, `dateModified`, `articleSection`, `wordCount`. Fix `publisher` type. Use `isoDate` from 1.2.

---

### 2.4 Add security headers to vercel.json *(20 min)*
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

### 2.5 Reduce preloader from 950ms → 300ms *(10 min)*
Find the `setTimeout` in the preloader/App.jsx and reduce to 300ms or switch to font-load event. Directly improves LCP.

---

### 2.6 Add BreadcrumbList to dynamic schemas *(20 min)*
In `App.jsx`, when building the project/blog jsonld, add a `BreadcrumbList` to the graph. Enables breadcrumb rich results in SERPs.

Example for a blog post:
```js
{ '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
  { '@type': 'ListItem', position: 2, name: 'Log', item: `${BASE_URL}/blog` },
  { '@type': 'ListItem', position: 3, name: post.title, item: url },
]}
```

---

## Phase 3: Content & Authority (Month 2)

### 3.1 Add H2/H3 headings to native blog posts
Add `{type: 'heading', level: 2, text: '...'}` blocks to `building-buy4chai` and `markets-dont-get-disrupted` in `blog.js`. Render them in `BlogPost.jsx`. Both posts are ~250 words and read as walls of text.

### 3.2 Fix image alt text
Every `<img>` in `BlogPost.jsx`, `BlogIndex.jsx`, `ProjectPage.jsx` needs `alt={post.title}` or `alt={proj.name}`. Currently all `alt=""`.

### 3.3 Add internal links in blog content
Link the Buy4Chai blog post body to `/project/buy4chai`. Link the hardware post to `/project/lifi-network`. Internal links signal topical authority and distribute PageRank.

### 3.4 Add Blog schema on /blog route
In `App.jsx`, when `isBlogIndex`, add JSON-LD:
```js
{ '@type': 'Blog', name: 'Log — Shoryavardhaan Gupta', url: `${BASE_URL}/blog`, author: { '@type': 'Person', '@id': `${BASE_URL}/#person` } }
```

### 3.5 Convert syi.png and 1758438412149.png to WebP
- `syi.png` (309 KB) → target <40 KB WebP
- `1758438412149.png` (746 KB) → target <80 KB WebP

### 3.6 Remove unused Space Grotesk font weights from Google Fonts URL
5 weights loaded, 0 used. Update the font URL in `index.html`.

### 3.7 Update buy4chai blog post title
Change "The gap nobody was filling." to something that surfaces search intent. See C6 in FULL-AUDIT-REPORT.md.

---

## Phase 4: Long-Term / Architecture (Month 2–3)

### 4.1 Implement vite-ssg for static pre-rendering *(Highest leverage)*
This is the single change that fixes C1 (the root cause of 60% of all audit findings). Every other fix in this plan becomes more effective once pages are pre-rendered.

**Expected score impact:** Technical SEO 35→75, On-Page 40→70, Schema 42→65, AI Search 25→55

```bash
npm install vite-ssg
```

After install, migrate `vite.config.js` and update the entry point. The data layer (`blog.js`, `projects.js`) is already structured for SSG.

### 4.2 Replace Font Awesome CDN with inline SVGs
Remove the 102 KB render-blocking CDN stylesheet. Only 8 icons used site-wide. Inline SVGs add ~2 KB total, eliminate 1 render-blocking request, remove the 3rd-party origin dependency.

### 4.3 Move DotGrid to OffscreenCanvas
5 concurrent RAF loops on main thread are an INP risk on mid-range Android. Start with DotGrid (physics + canvas = highest cost), move to Web Worker + OffscreenCanvas.

### 4.4 Create /llms.txt
```
# Shoryavardhaan Gupta — Portfolio

## About
16-year-old builder and developer from Kolkata, India.

## Projects
/project/buy4chai — Buy4Chai: UPI/Razorpay supporter pages for Indian developers
/project/sarkarsathi — SarkarSathi: AI civic tech, India Innovates Top 1k 2026
/project/lifi-network — Disaster-resilient LiFi mesh network (CBSE Regional finalist)

## Writing
/blog/building-buy4chai
/blog/markets-dont-get-disrupted
```

---

## Progress Tracker

| # | Item | Phase | Time Est | Done |
|---|---|---|---|---|
| 1.1 | Person schema @graph | 1 | 30m | [ ] |
| 1.2 | isoDate in blog.js | 1 | 15m | [ ] |
| 1.3 | og-image.png | 1 | 20m | [ ] |
| 1.4 | preconnect hints | 1 | 5m | [ ] |
| 1.5 | Vercel redirect | 1 | 10m | [ ] |
| 2.1 | 404 noindex | 2 | 30m | [ ] |
| 2.2 | Author byline | 2 | 15m | [ ] |
| 2.3 | BlogPosting schema | 2 | 20m | [ ] |
| 2.4 | Security headers | 2 | 20m | [ ] |
| 2.5 | Preloader 950→300ms | 2 | 10m | [ ] |
| 2.6 | BreadcrumbList | 2 | 20m | [ ] |
| 3.1 | Blog headings | 3 | 60m | [ ] |
| 3.2 | Image alt text | 3 | 20m | [ ] |
| 3.3 | Internal links | 3 | 30m | [ ] |
| 3.4 | Blog schema | 3 | 15m | [ ] |
| 3.5 | WebP images | 3 | 30m | [ ] |
| 3.6 | Remove unused fonts | 3 | 10m | [ ] |
| 3.7 | Buy4Chai title | 3 | 5m | [ ] |
| 4.1 | vite-ssg | 4 | 4h | [ ] |
| 4.2 | Inline SVG icons | 4 | 90m | [ ] |
| 4.3 | OffscreenCanvas DotGrid | 4 | 2h | [ ] |
| 4.4 | llms.txt | 4 | 15m | [ ] |

**Phase 1 total:** ~80 min
**Phase 2 total:** ~115 min
**Phase 3 total:** ~170 min
**Phase 4 total:** ~8.5 hours

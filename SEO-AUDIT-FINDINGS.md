# SEO / GEO Audit Findings

Read-only audit. No files were changed except this one.

## Summary

The prior SEO pass covered the structural basics well: canonical tags, per-route meta in `App.jsx`, a noscript fallback on the homepage, JSON-LD (Person/WebSite/ProfilePage/BlogPosting/SoftwareApplication/BreadcrumbList), a sitemap generator, and — most recently — real-React prerendering for blog posts. What's left is mostly **fact-consistency drift** (the site now understates the owner's age everywhere it's hardcoded), **missed structured-data richness** (no `ItemList`/`Blog` post listing, no `HowTo`/`FAQPage`, no `speakable`), a **real asymmetry** between how blog and project static pages are built, and some **content-quality gaps** (generic alt text, no modern image formats) that affect both classic SEO and how cleanly an AI answer engine can lift facts.

---

## Quick wins

### 1. The site says "16-year-old" everywhere, but he turned 17 on 2026-09-02 — and one surface already knows it
- **What I checked:** `src/utils/meta.js` computes `AGE` live from `BIRTH = new Date('2009-09-02')`. Today is 2026-09-11, so `AGE` currently evaluates to **17** and is rendered live in `src/components/Hero.jsx:156,235` and `src/components/Footer.jsx:208`.
- **What's wrong:** Every hardcoded surface still says 16:
  - `index.html:8,14,23,37` (description, og:description, twitter:description, Person `description`)
  - `src/App.jsx:106` — `BASE_DESC = '16-year-old builder from Kolkata...'` (used for the homepage and any non-matched route's meta tags)
  - `public/llms.txt:3` — "16-year-old builder... since age 14"
- **Why it matters:** This is exactly the numeric-consistency problem the task called out. An AI answer engine synthesizing "how old is Shoryavardhaan Gupta" will now see a live page showing 17 next to meta tags, JSON-LD, and llms.txt all saying 16 — a direct contradiction on the same domain, which is worse for GEO than a single wrong number would be.
- **Fix:** Import `AGE` from `src/utils/meta.js` wherever the age is stated in text (App.jsx's `BASE_DESC`), and either drop the numeral from the static `index.html`/`llms.txt` copy (say "teen builder" instead of "16-year-old") or add a small script step that regenerates those strings from the same `calcAge()` logic at build time.

### 2. `<html lang="en">` everywhere, but JSON-LD declares `inLanguage: "en-IN"`
- **What I checked:** `index.html:2`, every generated file in `public/blog/*/index.html` and `public/project/*/index.html`, all declare `<html lang="en">`. Meanwhile `index.html`'s `WebSite` node (`index.html:68`) and `App.jsx`'s per-route BlogPosting/Blog JSON-LD (`App.jsx:163,185`) both say `"inLanguage": "en-IN"`.
- **Why it matters:** A mismatched `lang` attribute vs. declared content language is a small but real signal inconsistency; `en-IN` is also what should be reflected in `<html lang>` for a site explicitly positioning itself as India-based content.
- **Fix:** Change `<html lang="en">` to `<html lang="en-IN">` in `index.html` and the two static-page generators.

### 3. Alt text on project/highlight images is generic, not descriptive
- **What I checked:** `src/components/Highlights.jsx:143` (`alt={alt}`, but the passed-in alt values are things like generic captions) and `Highlights.jsx:357` / `src/components/Projects.jsx:160` both use `alt={`${title} photo ${i + 1}`}` — i.e. "SarkarSathi photo 1", "Buy4Chai photo 2".
- **Why it matters:** "X photo 1" carries no descriptive/keyword value for image search or accessibility — it's a wasted opportunity to reinforce project-specific terms (e.g. "SarkarSathi civic-tech dashboard screenshot" vs "SarkarSathi photo 1").
- **Fix:** Add a per-image `alt` (or `caption`) field to each project's `images` array in `src/data/projects.js` describing what's actually shown.

### 4. No modern image formats anywhere
- **What I checked:** Every image referenced from `src/data/projects.js` (`public/projects/*.png/.jpg/.jpeg`) and root images (`public/og-image.png`, `public/syi.png`, `public/preview (1).jpg`, etc.) is a plain PNG/JPEG. No `.webp`/`.avif` files exist in `public/` at all.
- **Why it matters:** WebP/AVIF materially reduce LCP-affecting payload size, and LCP is a direct Core Web Vitals ranking input. `og-image.png` and the preload'd `preview (1).jpg` (`index.html:82`, preloaded with `fetchpriority="high"`) are the highest-value targets since they load on first paint / are used for every social-share preview.
- **Fix:** Convert at minimum `og-image.png` and `preview (1).jpg` to WebP with a PNG/JPEG fallback (`<picture>`), or serve via an image CDN that content-negotiates format.

### 5. `robots.txt` has no explicit block on nothing to block — but also no host directive or verification of alternate hosts
- **What I checked:** `public/robots.txt` is minimal and correct (`Allow: /` + `Sitemap:` line) — this is fine, not broken. Flagging only because the audit brief asked to confirm it exists: it does, and it does reference the sitemap correctly.
- **No fix needed** — included for completeness per the brief's checklist.

### 6. Footer's on-page social links don't match the full `sameAs` set in JSON-LD
- **What I checked:** `index.html`'s Person `sameAs` (`index.html:52-60`) lists 7 profiles: GitHub, LinkedIn, X, Instagram, Medium, Zenodo, ORCID. `src/components/Footer.jsx`'s `LINKS` array (`Footer.jsx:6-10`) only renders GitHub, LinkedIn, X, Instagram, and an email link — Medium, Zenodo, and ORCID are never linked from the live page itself, only from the homepage's `<noscript>` block (`index.html:117-124`) and `llms.txt`.
- **Why it matters:** Search engines weight `sameAs` more when the profile is also reciprocally and visibly linked from the page itself, not only buried in a noscript block a JS-enabled crawl won't render into the visible DOM. Right now Medium/Zenodo/ORCID exist only for non-JS crawlers.
- **Fix:** Add Medium, Zenodo, and ORCID as additional footer links (or a compact "elsewhere" row) so they're visible in the rendered page too.

### 7. Footer's LinkedIn URL differs from the canonical one used everywhere else
- **What I checked:** `Footer.jsx:6` uses `https://linkedin.com/in/shoryavardhaan` (no `www`), while `index.html:54`, `llms.txt:28`, and the homepage noscript (`index.html:119`) all use `https://www.linkedin.com/in/shoryavardhaan`.
- **Why it matters:** Both resolve to the same profile via redirect, but it's an unnecessary inconsistency in a codebase that's otherwise being deliberately kept fact-consistent across surfaces.
- **Fix:** Standardize on the `www.` form used everywhere else.

---

## Bigger investments

### 8. Project static pages are structurally weaker than blog static pages (confirmed asymmetry)
- **What I checked:** `scripts/prerender-blog.mjs` + `scripts/generate-blog-static.mjs` produce blog shells with a fully server-rendered `#root` via the real `BlogPost` component (per `CLAUDE.md`'s description, confirmed in code). `scripts/generate-project-static.mjs` (`generate-project-static.mjs:101-129`) leaves `<div id="root"></div>` **empty** and puts all crawler-visible content in a hand-written `<noscript><article>...</article></noscript>` block built from `problem`/`solution`/`how`/`impact` fields.
- **Why it matters:** This is a real, confirmed inconsistency (not speculative — I read both generators). Google generally executes JS during indexing so the empty `#root` is less of a ranking risk than it looks, but (a) AI answer-engine crawlers and other bots are far less reliable about JS execution than Googlebot, so they get a materially thinner, differently-worded version of project pages than blog posts get; (b) it also means project page content can silently drift from the live SPA's copy (the noscript text is a hand-authored paraphrase of `problem`/`solution`/`how`/`impact`, not the actual rendered component), the exact drift problem the blog migration was done specifically to eliminate.
- **Suggested fix (already flagged as a known follow-up in `CLAUDE.md`):** Bring `ProjectPage.jsx` through the same `ssrLoadModule` + `renderToStaticMarkup` pipeline as `BlogPost.jsx`, retiring the hand-written noscript approach for projects too.

### 9. No `ItemList`/enriched `Blog` schema on the blog index — a real missed structured-data opportunity
- **What I checked:** `App.jsx`'s `isBlogIndex` branch (`App.jsx:175-186`) emits only a bare `@type: "Blog"` node with `name`, `url`, `author`, `inLanguage` — no `blogPost` array, no `ItemList` of the posts actually shown on the page (confirmed against `BlogIndex.jsx`, which renders all of `POSTS` in a grid).
- **Why it matters:** An `ItemList`/`blogPost[]` on the index page gives search engines and AI crawlers a structured, authoritative post list to cite directly rather than having to parse the DOM; this is a straightforward, low-risk addition since `POSTS` is already fully available in that same `useEffect`.
- **Fix:** Add `blogPost: POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${BASE_URL}/blog/${p.slug}`, datePublished: p.isoDate }))` to the existing Blog JSON-LD object.

### 10. No `HowTo` schema for Buy4Chai despite content that's structurally a how-to
- **What I checked:** `src/data/projects.js:24-29` — Buy4Chai's `how` array is literally four ordered steps (`Setup`, `Payments`, `Zero fees`, `MIT licensed`) with label + text, already shaped like `HowTo` steps. The current static-page generator only emits `SoftwareApplication` + `BreadcrumbList` (`generate-project-static.mjs:73-90`); no `HowTo` type is used anywhere in the codebase (confirmed via search — the only schema types present across the whole repo are Person, WebSite, ProfilePage, SoftwareApplication, CreativeWork, ScholarlyArticle, BlogPosting, Blog, BreadcrumbList).
- **Why it matters:** `HowTo` is a legitimate schema.org type for exactly this content shape and is one of the richer formats AI answer engines use when synthesizing procedural answers ("how do I accept UPI payments as a developer").
- **Fix:** For projects whose `how` array reads as sequential steps (Buy4Chai qualifies most cleanly; ChemX and LiFi's `how` entries are more descriptive-parallel than sequential), add a `HowTo` node alongside the existing schema type.

### 11. No `FAQPage` or `speakable` schema anywhere in the codebase
- **What I checked:** Searched all JSON-LD emission points (`index.html`, `App.jsx`, `generate-project-static.mjs`) — no `FAQPage` or `speakable` type exists. Blog content (`src/data/blog.js`) is essay-form paragraphs/headings/pullquotes, not Q&A-structured, so `FAQPage` doesn't have an honest home in current content without restructuring it (flagging as a gap, not necessarily a quick add — content would need to actually be FAQ-shaped, which it currently isn't).
- **Why it matters for GEO specifically:** `speakable` is the schema.org property built for voice/AI-assistant extraction — marking a `SpeakableSpecification` on the homepage's short bio paragraph would give AI engines an explicit, low-ambiguity span to quote verbatim (the "one clear, quotable sentence" the task asks about). Right now no such explicit signal exists; engines have to infer which sentence is the canonical self-description.
- **Fix:** Add a `speakable` `cssSelector` pointing at the noscript bio paragraph (`index.html:95`) or an equivalent live-DOM element, since that sentence is already the most consistent, carefully-worded bio on the site.

### 12. GitHub README backlink surface: no evidence it was ever done
- **What I checked:** Searched the entire repo for `github.com/vassu-v` references — all 17 hits are this codebase linking *out* to GitHub (Footer, projects.js, static pages, llms.txt, add-content.md), none are anything that would populate or reference a GitHub profile README back toward the portfolio.
- **Why it matters:** Since the actual GitHub profile README lives outside this repository, I can't confirm or deny its current content — I can only confirm this repo carries no trace of that work having been done (no README file, no script that generates one, no mention in `add-content.md`).
- **Fix:** Not actionable from this repo; would need to check `github.com/vassu-v/vassu-v` (the special profile-README repo) directly.

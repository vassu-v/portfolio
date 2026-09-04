# Portfolio — Claude Instructions

## Stack

React + Vite. Framer Motion v12. **Inline styles throughout — no Tailwind utility classes** (Tailwind is in package.json but not used). Custom pushState SPA router at `src/router.jsx`.

## Content editing

All content lives in data files and component-level arrays — no logic changes needed to add posts, projects, or experience entries. Read `add-content.md` at the project root before touching any content.

## Static blog system

Two separate blog renderers exist, on purpose:

- **Live SPA** — `src/data/blog.js` + `src/pages/BlogPost.jsx` render what visitors see when browsing the site.
- **Static SEO shell** — `public/blog/<slug>/index.html` are standalone hand-written HTML files (no React, fully inline CSS) that Vercel serves directly for the same URL before the SPA rewrite fires. Exists purely so crawlers/link-unfurl bots that don't execute JS still get real content.

**Not auto-synced** — editing `blog.js` does not change the static HTML. Article prose in each static file is separately hand-written and must be manually kept in sync when post content changes.

**Auto-synced** — post numbering (`nav-counter`, "N / total"), the hero-ghost category label, and the "More from the log" related-post links are regenerated FROM `blog.js` by running `npm run generate:blog` (`scripts/generate-blog-static.mjs`). This only touches the delimited `<!-- GEN:... -->` regions in each static file — never hand-written body content.

**CRT tag widget** — static posts include a small canvas readout (`.crt-widget` / `#crtCanvas`) showing the post's category in phosphor-green retro terminal style, a vanilla-JS/2D-canvas equivalent of the SPA's 3D `CRTMonitor` (`src/three/CRTMonitor3D.jsx`), deliberately lightweight (no three.js) since these pages are SEO-first. `npm run generate:blog` keeps its `data-tag` attribute synced to category.

**Adding a new post:**
1. Add an entry to `POSTS` in `src/data/blog.js` — this alone makes it live on the SPA/homepage cards.
2. Copy `public/blog/template.html` → `public/blog/<new-slug>/index.html`.
3. Fill every `[FILL: ...]` placeholder (title, meta, OG/Twitter tags, JSON-LD, hero image, article prose, pullquotes).
4. Remove the `<meta name="robots" content="noindex, nofollow">` line — only `template.html` itself stays noindexed; real posts must not have this.
5. Run `npm run generate:blog` to auto-fill numbering, hero-ghost, more-posts links, and CRT tag text.

**File locations** — template: `public/blog/template.html`; generator: `scripts/generate-blog-static.mjs`; live posts: `public/blog/<slug>/index.html`.

## Design rules

- **Color system via CSS variables** — always use `var(--cu)`, `var(--text)`, `var(--border)` etc. Never hardcode colors except for rgba overlays.
- **Typography** — JetBrains Mono for labels/mono/nav, Instrument Serif italic weight 300 for display/headings.
- **Animations** — Framer Motion only. No CSS keyframe animations on interactive elements. RAF loops are acceptable for continuous SVG attribute manipulation (see Footer liquid effect, Ticker).
- **No hooks inside `.map()`** — use a separate component or `scrollYProgress.on('change', cb)` pattern instead.
- **No comments** unless the WHY is non-obvious. No docstrings.

## Git

- Branch: `underdevelop` (working), `main` (production)
- Identity: name = `vassu-v`, email = `shoryavardhaans2@gmail.com`
- Never add Claude as co-author. Never push automatically — only on explicit instruction.

## File map (quick reference)

```
src/
  data/
    blog.js          ← blog posts (keep newest first)
    projects.js      ← project case studies
  components/
    Experience.jsx   ← EXP array — horizontal sticky scroll panels
    Highlights.jsx   ← CARDS array — bento award grid
    Currently.jsx    ← CARDS array — 3 active-now cards
    Footer.jsx       ← LINKS array — social links; LiquidHeading with RAF loop
    Nav.jsx          ← scroll-anchor links + Log link → /blog
    Hero.jsx         ← scramble names, tagline, auto-age from utils/meta.js
    About.jsx        ← ReadingPara scroll-brightening paragraphs
    Blog.jsx         ← 3-column card grid section on portfolio homepage
    Projects.jsx     ← sticky two-panel layout with ScatterStack
    Ticker.jsx       ← constant-speed marquee, no scroll reactivity
    Highlights.jsx   ← bento grid with FloatingImg polaroids + Lightbox
    Lightbox.jsx     ← shared fullscreen image overlay
  pages/
    ProjectPage.jsx  ← individual project case study
    BlogPost.jsx     ← individual blog post reading experience
    BlogIndex.jsx    ← standalone /blog homepage
  utils/
    meta.js          ← AGE (auto from 2009-09-02) + YEAR (auto)
  router.jsx         ← pushState SPA router, useRoute() hook
  App.jsx            ← section order, route matching, cursor, smooth scroll
public/
  projects/          ← project images (buy4chai_*, sarkarsathi_*, lifi_*)
  *.jpg/png          ← root-level personal images (syi.png, preprint.jpg, etc.)
add-content.md       ← full guide for adding/editing all content
```

## Section order (App.jsx → Portfolio component)

Hero → About → ZoneDivider → Experience → ZoneDivider → Projects → ZoneDivider → Blog → Ticker → Highlights → ZoneDivider → Currently → ZoneDivider → Footer

## Routes

| Path | Component |
|---|---|
| `/` | Portfolio (homepage) |
| `/project/:slug` | ProjectPage |
| `/blog` | BlogIndex |
| `/blog/:slug` | BlogPost |

## Key patterns

**Scroll reveal** — `useScroll({ target: ref, offset: ['start 95%', 'start 50%'] })` + `useTransform` on opacity/y. Standard across all sections.

**Page transitions** — `AnimatePresence mode="wait"` in AppShell wraps all page-level components.

**Hooks in map** — illegal in React. Use a child component per item, or use `scrollYProgress.on('change', cb)` with `useEffect` + `useState`.

**SVG filter effects** — Footer `LiquidHeading`: feTurbulence + feGaussianBlur + feDisplacementMap, animated via RAF. The highlighter mark on "Let's build" sits inside the same `filter` div so both text and mark distort in sync.

**ScatterStack** — preset STACKED/SCATTERED positions to avoid re-render jitter. Spring animations between states. Click → Lightbox.

# Portfolio — Claude Instructions

## Stack

React + Vite. Framer Motion v12. **Inline styles throughout — no Tailwind utility classes** (Tailwind is in package.json but not used). Custom pushState SPA router at `src/router.jsx`.

## Content editing

All content lives in data files and component-level arrays — no logic changes needed to add posts, projects, or experience entries. Read `add-content.md` at the project root before touching any content.

## Static blog system

**One source of truth: `src/data/blog.js` + `src/pages/BlogPost.jsx`.** There is no hand-written HTML anywhere in the blog pipeline anymore. `public/blog/<slug>/index.html` is fully generated at build time by server-rendering the real `BlogPost` React component — the exact same component the live SPA uses — via `react-dom/server`'s `renderToStaticMarkup`, run in Node through Vite's `ssrLoadModule` (`scripts/prerender-blog.mjs`). The static file's `<div id="root">` is pre-filled with that real output, so a crawler or a browser with JS disabled gets fully-formed, correctly-styled content immediately; `<script src="/src/main.jsx">` then boots the SPA on top, which re-renders over it via the normal `createRoot().render()` client mount — same content, now interactive.

This replaced an earlier design (hand-written static HTML + a GEN-marker patcher) that could drift from the live SPA and required copying `template.html` for every new post. Both are gone. There is nothing left to hand-author or keep in sync.

**Adding a new post:**
1. Add an entry to `POSTS` in `src/data/blog.js` (content as `content: [{ type: 'paragraph' | 'heading' | 'pullquote' | 'divider', text }]` blocks).
2. Run `npm run generate:blog`.

That's it — the new `public/blog/<slug>/index.html` is created from scratch, meta/OG/JSON-LD are derived from the same fields `App.jsx`'s SPA route effect uses (so static and live meta can never disagree), every other post's numbering/cross-links are re-synced, and `npm run generate:projects` regenerates `public/sitemap.xml` to include it. Every file is safe to delete and regenerate at any time — regenerating never has anything hand-written to lose. Run `npm run generate:blog` again any time `blog.js` changes to pick it up.

**Why this is safe to prerender in plain Node (no jsdom needed):** every component in `BlogPost.jsx`'s tree is SSR-safe by construction — no unguarded `window`/`document` calls outside effects, and the 3D CRT widget (`src/components/CRTMonitor.jsx`) simply renders `null` until a client-only `useEffect` flips it on, so it never touches three.js/WebGL during prerendering. Framer Motion is designed to render safely with no browser present, using each animated value's initial/resting state.

**File locations** — prerenderer: `scripts/prerender-blog.mjs`; generator: `scripts/generate-blog-static.mjs`; live posts: `public/blog/<slug>/index.html`.

## Static project pages

`public/project/<slug>/index.html` takes a lighter-weight version of the same idea as the blog's static shell: a noscript-friendly page with real title/meta/OG/Twitter tags and JSON-LD, served before the SPA rewrite. Unlike blog (which prerenders the real React component), project pages leave `#root` empty and put crawler content in a hand-written `<noscript>` block instead — `npm run generate:projects` (`scripts/generate-project-static.mjs`) builds any `public/project/<slug>/index.html` that doesn't already exist yet from `projects.js` directly (problem/solution/how/impact fields become the noscript article body). A file that already exists is left alone and treated as hand-maintained from that point on — delete it and re-run the script to regenerate from source. (Bringing project pages onto the same real-prerender approach as blog is a reasonable future cleanup, not yet done.)

The same script also regenerates `public/sitemap.xml` from `blog.js` + `projects.js` every run, so a new post or project is never missing from the sitemap. Run `npm run generate:projects` after adding a new project to `PROJECTS`.

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

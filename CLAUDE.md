# Portfolio — Claude Instructions

## Stack

React + Vite. Framer Motion v12. **Inline styles throughout — no Tailwind utility classes** (Tailwind is in package.json but not used). Custom pushState SPA router at `src/router.jsx`.

## Content editing

All content lives in data files and component-level arrays — no logic changes needed to add posts, projects, or experience entries. Read `add-content.md` at the project root before touching any content.

## Static blog + project pages

**One source of truth each — no hand-written HTML anywhere in either pipeline.** Blog: `src/data/blog.js` + `src/pages/BlogPost.jsx`. Projects: `src/data/projects.js` + `src/pages/ProjectPage.jsx`. `public/blog/<slug>/index.html` and `public/project/<slug>/index.html` are BOTH fully generated at build time by server-rendering the real page component — the exact same component the live SPA uses — via `react-dom/server`'s `renderToStaticMarkup`, run in Node through Vite's `ssrLoadModule`. The shared engine for this is `scripts/prerender.mjs` (`createPrerenderer()`, with `renderPost(slug)` and `renderProject(slug)`). Each static file's `<div id="root">` is pre-filled with that real output, so a crawler or a browser with JS disabled gets fully-formed, correctly-styled content immediately; `<script src="/src/main.jsx">` then boots the SPA on top, which re-renders over it via the normal `createRoot().render()` client mount — same content, now interactive.

This replaced two earlier designs: blog used hand-written static HTML + a GEN-marker patcher (required copying `template.html` for every new post); projects left `#root` empty and hand-wrote a `<noscript>` paraphrase of `problem`/`solution`/`how`/`impact`. Both could drift from the live SPA. All of that is gone — there is nothing hand-authored left in either `public/blog/` or `public/project/` to keep in sync, and **no file under either directory should ever be hand-edited** — both generators overwrite their output wholesale on every run, so anything typed directly into a generated file is silently lost the next time someone regenerates.

**Adding a new post:**
1. Add an entry to `POSTS` in `src/data/blog.js` — title, subtitle, category, date/isoDate, readTime, hero, featured/personal flags, `keywords` (SEO array, see below), and `content: [{ type: 'paragraph' | 'heading' | 'pullquote' | 'divider', text }]` blocks.
2. Run `npm run generate:blog`.

**Adding a new project:**
1. Add an entry to `PROJECTS` in `src/data/projects.js` — `name`, `tagline`, `tags`, `desc`, `stat`, `github`/`live`, `period`, `problem`/`solution`/`how`/`impact` content, `keywords` (SEO array, see below), and `images: [{ src, alt }, ...]` (alt text is real and hand-written per image, not derivable — see below).
2. Run `npm run generate:projects`.

Both scripts create the new static file from scratch, derive meta/OG/JSON-LD from the same fields their respective SPA route effect uses in `App.jsx` (so static and live meta can never disagree), and `generate:projects` additionally regenerates `public/sitemap.xml` from both `blog.js` + `projects.js` every run so nothing new is ever missing from it. Every generated file is safe to delete and regenerate at any time. Both are idempotent — running either twice in a row with no data change reports everything "Unchanged" — so it's safe to run either defensively whenever in doubt. Run `generate:blog`/`generate:projects` again any time the corresponding data file changes to pick it up.

Neither script is part of `npm run build` — they're manual content-authoring steps, never something a deploy waits on. Both accept an optional slug to regenerate just one item instead of everything: `npm run generate:blog -- why-i-build` / `npm run generate:projects -- buy4chai`. Useful while iterating on one post/project's content so you're not waiting through every other one on each save. **But posts and projects cross-reference each other** — the "N / total" counter and the "More from the log" / "More projects" sidebar links embed *other* posts' current titles into every page. A single-slug run doesn't touch those other pages, so if you change a title (or add/remove an entry, which changes the total count) via a scoped run, every other already-generated page can end up showing a stale cross-reference until it's next regenerated. Rule: scope to one slug freely while drafting, but always do one full no-argument run (`npm run generate:blog` / `npm run generate:projects`) before treating the content as done — that's what actually guarantees no stale cross-references ship.

**Why this is safe to prerender in plain Node (no jsdom needed):** every component in `BlogPost.jsx`'s and `ProjectPage.jsx`'s trees is SSR-safe by construction — no unguarded `window`/`document` calls outside effects, and the 3D CRT widget (`src/components/CRTMonitor.jsx`) simply renders `null` until a client-only `useEffect` flips it on, so it never touches three.js/WebGL during prerendering. Framer Motion is designed to render safely with no browser present, using each animated value's initial/resting state.

**Fields that aren't single-sourced — all SEO-curated by hand, none derivable from other fields:**
- **Blog `keywords`** — every post has a `keywords: [...]` array (5-8 lowercase-natural phrases, not comma-stuffed SEO terms) used only in JSON-LD `BlogPosting.keywords`. Read by `scripts/generate-blog-static.mjs`'s `metaFor()` AND `src/App.jsx`'s `blogMatch` JSON-LD effect — both must be updated by hand together if this field's handling ever changes.
- **Project `keywords`** — same idea, same style, for projects. Write real search-intent phrases someone would actually type (what problem does this solve, who searches for it, what's the specific angle), never generic tech-stack terms — those already live in `tags` and get folded in automatically as a fallback (`project.keywords ?? project.tags ?? []`) only if `keywords` is missing. Read by `scripts/generate-project-static.mjs`'s `metaFor()` AND `src/App.jsx`'s `projectMatch` JSON-LD effect — same hand-sync requirement as blog's `keywords`.
- **Project `images[].alt`** — every project image is `{ src, alt }`, not a bare path string. `alt` is a real, specific, hand-written description (not "ProjectName photo 1") — read by `src/components/Projects.jsx`, `src/pages/ProjectPage.jsx`, and `scripts/generate-project-static.mjs`'s OG/Twitter image tags (via `.src`). When adding project images, write real alt text describing what's actually in the image.
- **`speakable` target sentences** — blog posts point `speakable.cssSelector` at `#post-subtitle` (the post's `subtitle` field, rendered with that id in `BlogPost.jsx`) — this one IS safely automatic across all posts since `subtitle` is already a clean one-sentence summary by convention. The homepage points it at `#bio` in `index.html`'s noscript block. Neither needs hand-curation the way `keywords`/`alt` do, but if a post's rendered structure ever changes such that `#post-subtitle` moves or disappears, the `speakable` selectors in `generate-blog-static.mjs` and `App.jsx` (and the `id` itself in `BlogPost.jsx`) need updating together.

**File locations** — shared prerenderer: `scripts/prerender.mjs`; blog generator: `scripts/generate-blog-static.mjs` (output: `public/blog/<slug>/index.html`); project generator: `scripts/generate-project-static.mjs` (output: `public/project/<slug>/index.html`, also regenerates `public/sitemap.xml`).

**Planned: better post recommendations.** `MorePosts` in `src/pages/BlogPost.jsx` currently picks related posts via `POSTS.filter(p => p.slug !== currentSlug).slice(0, 2)` — whatever sits next in array order, with no topical relevance. A better version would match by shared `category` first, then by overlap in `keywords`, falling back to array order only when neither yields enough posts. Not yet built.

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

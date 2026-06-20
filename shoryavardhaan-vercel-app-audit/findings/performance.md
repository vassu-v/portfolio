# Performance (CWV) — Findings
**Agent:** seo-performance | **Score:** 38/100

## Summary
Two critical performance blockers dominate: a hard-coded 950ms preloader and a render-blocking Font Awesome CDN stylesheet. Together they push LCP well above the "good" threshold (2,500ms) before a single byte of page content renders. 5 concurrent RAF loops compound the problem on mid-range devices.

## Core Web Vitals Estimates (Lab)

| Metric | Estimate | Threshold | Status |
|---|---|---|---|
| LCP | ~3,200ms (mobile) | Good: <2,500ms | Poor |
| INP | ~180ms (mobile w/5 RAFs) | Good: <200ms | Needs Improvement |
| CLS | ~0.02 | Good: <0.1 | Good |

> Note: These are lab estimates. Field data (CrUX) was not available for this audit (insufficient traffic volume for public dataset).

## Critical Findings

### C4: 950ms Preloader Hard-Blocks LCP
The preloader uses `setTimeout(950)` to hold the page blank before revealing content. LCP measurement begins at navigation start, not after the preloader exits. On mobile:
- JS parse time: ~200–400ms
- Preloader: 950ms minimum
- **Total before LCP-eligible paint: ~1,150–1,350ms**
- First JS-rendered frame: adds another 200–500ms
- **Real-world mobile LCP: ~1,400–1,900ms above the 2,500ms good threshold → 3,400–4,400ms**

No `<link rel="preload">` for the hero image — so even after the preloader, the browser discovers the image from JS and starts a new network request.

**Fixes (in order of impact):**
1. Reduce setTimeout to ≤300ms or make it event-driven (fires when fonts are loaded via `document.fonts.ready`)
2. Add to `index.html`:
   ```html
   <link rel="preload" as="image" href="/syi.png" fetchpriority="high">
   ```
3. Add `fetchpriority="high"` to the hero `<img>` in `Hero.jsx`

### C5: Font Awesome — Render-Blocking CDN Stylesheet
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```
This is synchronous (`rel="stylesheet"`) and:
- Blocks all rendering until the 102 KB CSS is parsed
- Triggers 3 additional woff2 font file requests from `cdnjs.cloudflare.com`
- Adds a third-party origin DNS+TLS round-trip (~80–150ms)
- Downloads icon definitions for ~2,000 icons when only 8 are used

**Fix:** Remove the CDN link. Replace each `<i className="fa-...">` usage with inline SVG. The complete set of 8 icons is ~2 KB total, inlined in the component files.

After removing Font Awesome, also add:
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```
(This saves ~200–400ms for Google Fonts woff2 file loading.)

## High Findings

### H7: 5 Concurrent RAF Loops — INP Risk
Active RAF loops on main thread at the same time:
1. **DotGrid** — canvas physics + particle rendering
2. **Smooth scroll** — scrollTop interpolation
3. **Cursor glow** — cursor position tracking + CSS var updates
4. **Hero parallax** — scroll-driven transform calculations
5. **Footer LiquidHeading** — SVG feTurbulence attribute animation

On desktop (fast CPUs), this is typically fine. On budget Android devices (Snapdragon 4xx, MediaTek Helio):
- Each RAF callback costs ~3–8ms
- Combined: ~15–40ms per frame, which exceeds the 16ms budget
- Result: dropped frames, elevated INP, jank on scroll

**Fixes (in priority order):**
1. **DotGrid → OffscreenCanvas + Web Worker**: removes the highest-cost loop from the main thread entirely
2. **Mobile early return for DotGrid**: `if (window.matchMedia('(max-width: 767px)').matches) return` at the top of the DotGrid RAF — removes physics on mobile where it's least visible anyway
3. **Merge cursor + hero parallax**: these both read mouse/scroll position; merge into one RAF loop
4. **Delay DotGrid RAF start until preloader exits**: currently DotGrid starts during the preloader phase when the canvas isn't even visible

## Medium Findings

### M6: 1758438412149.png is 746 KB
PNG photograph format, ~746 KB. WebP at equivalent quality: ~70–90 KB. This is a ~8–10x payload reduction for this one image.

### M7: syi.png is 309 KB
PNG photograph, ~309 KB. WebP target: <40 KB.

### M12: DotGrid RAF Runs During Preloader
The DotGrid canvas RAF loop starts when the component mounts, which is during the preloader phase (before the 950ms reveal). This burns CPU cycles on canvas physics while the page is being held invisible — the worst possible time given that LCP is being measured during this window.

**Fix:** Expose a `ready` prop or context from the preloader state. Only start DotGrid RAF after `ready === true`.

## Low Findings

### L7: No srcset on Hero Image
`Hero.jsx` renders a single `<img src="/syi.png">`. Mobile visitors (375px viewport) download the same image as desktop (1440px). A WebP srcset:
```html
<img srcset="/syi-480.webp 480w, /syi-800.webp 800w, /syi.webp 1200w"
     sizes="(max-width: 768px) 100vw, 50vw"
     src="/syi.png" alt="Shoryavardhaan Gupta">
```
…would halve the payload for most mobile visitors.

### L8: loading='lazy' Absent on Below-Fold Images
Images in Highlights, About, and Projects sections load eagerly on pageload. Adding `loading="lazy"` defers them until they enter the viewport, reducing initial page weight.

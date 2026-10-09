# Homepage redesign — the desk is the website

Branch `redesign-room` (local, uncommitted). Old homepage still reachable at `/?classic`.
Frames from the verification pass are in [`docs/shots/`](shots/). References + lighting
research the build leaned on: [`docs/references.md`](references.md).

---

## 1. Review of what was there

**Codebase.** React 19 + Vite, Framer Motion, inline styles, a custom pushState router,
static prerendering for blog/project pages (one source of truth in `src/data/`). Healthy
and well documented. The 3D (`src/three/DeskScene.jsx`) was a single 455-line file:
hand-built boxes for desk/laptop/props, 4 point lights + ambient, black fog, camera
stages keyed off which DOM section is on screen.

**Visual.** Text-first page with the 3D as a backdrop. The backdrop's problems:

- **Void, not a room.** Black fog + no walls means the desk floats in space — that's the
  "lots of space and height" feeling. Nothing for light to bounce off.
- **Unmotivated light.** Point lights hang in the air with no source; ambient 0.18 flattens
  everything; no shadows anywhere, so objects don't sit on the desk.
- **Not interactive.** The whole canvas sits behind `pointer-events: none`, so even the
  laptop click (to CLI mode) never fires (documented in `CLAUDE.md`).
- **Mid-page dead zones.** During Projects/Writing the 3D is zoomed into a black screen and
  the page reads as near-empty black.

## 2. What's built now (homepage only)

| Piece | What it does |
|---|---|
| **Intro** | Page opens dollying into the laptop; screen shows your name (Instrument Serif, gold). |
| **Dissolve** | Scrolling breaks the name into particles that drift up and away left→right, revealing a desktop (terminal with `whoami`, a "ship real things." widget, the visitor's real clock). |
| **Pull-back** | Camera retreats over the keyboard, then rises to the establishing shot of the room corner. One line of copy floats in mid-way. |
| **Room** | Real corner: plaster walls, oak floor, skirting, ceiling, rug, wall shelf with books, socket, cables. |
| **Window = local time** | Sky gradient, sun colour/angle/strength, stars and a two-layer city skyline (lit windows at night) all follow the visitor's local hour. The sun physically shines *through* the window opening, so the mullion shadows land on the wall/desk. Dust motes drift in daylight. `?hour=17.5` previews any time; `?debug` adds a time slider. |
| **Lamp switch** | Copper button on the lamp base (or the "lamp off/on" chip). Toggles the real spotlight + bulb, and sets `data-theme` on `<html>` (`warm`/`dark`) — ready for the light/dark theme. |
| **Drawer → projects** | Pedestal drawer slides out; hanging files with handwritten tabs, one per project. Pick one and a sheet rises out of it: project number, name, tagline, photo, stat, tags. Panel links to the case study. |
| **Corkboard → experience** | Index card per role, polaroids, push pins, red string running oldest → newest. Hover lifts a card; click brings it to you; panel shows the full description. |
| **Diary → blog** | Leather diary on the desk opens; pages list the log + latest post. Panel links to `/blog`. |
| **Phone → contact** | Lock screen with the visitor's real time and two notifications; lifts toward you; panel has email, call booking, socials. |
| **Laptop → terminal** | Focuses the screen; panel links to CLI mode (finally clickable). |
| **Sticky notes** | Handwritten (Caveat): "hi, i'm shorya · 17 · kolkata", "open to collab →", "ship it.", and a `curl` note on the desk. |
| **Also** | Mechanical keyboard, mouse + mousepad, headphones hanging on a desk hook (click → they swing), office chair (click → spins), snake plant, chai mug with steam, pen. |
| **Accessibility / skimmers** | Chips bar (projects · log · experience · contact · terminal · lamp) reaches every object without hunting; `Esc` returns to the desk. |

**Lighting stack.** Physically based materials; image-based light from Lightformers (window
panel in the sky colour + soft ceiling/wall bounce, re-baked when time/lamp changes); the
sun is the main shadow caster (2048 map, fitted frustum); the lamp is a real spotlight with
its own soft shadow; laptop screen spills light via a rect-area light. Post: N8AO ambient
occlusion → bloom (threshold 1, so only bulb/screen/city glow) → AgX tone mapping → subtle
vignette → SMAA. Tiering: touch / ≤4-core devices skip AO; a performance monitor drops AO
quality if FPS falls.

**Reuse.** Library models from `models/src/` (laptop, mechanical keyboard, headphones, desk
lamp, phone, mug, book→diary) are copied into `src/three/room/lib/` and restyled at load
(`prepModel` strips their stylised amber glow/flat shading/own lights). New: chair, mouse,
mousepad, plant (`src/three/room/props/`), plus desk/drawer/corkboard/room built in-scene.

**Bundle.** Eager JS 487 KB → 496 KB. The room (three + r3f + post) is a separate lazy
chunk (~318 KB gzip) that the existing preloader already waits on.

## 3. How the corkboard works (the demo you asked for)

1. Visible in the overview, upper right above the desk — reads as "this person has history"
   before anyone clicks.
2. Click it (or the *experience* chip) → camera squares up to the board. Panel: "Roles pinned
   in order, string runs oldest → newest."
3. Hover a card → it lifts off the cork and straightens. Click → it unpins and comes toward
   you, enlarged; the panel shows role, dates and the full description.
4. Polaroids are wins (Quantum Qubit, India Innovates, the soldering bench). Natural next
   step: make polaroids clickable to open the Lightbox, and pin Highlights (awards) as a
   second cluster.

See `shots/07-corkboard.jpg`, `shots/08-corkboard-card.jpg`.

## 4. Open decisions for you

1. **Section content.** Next phase is integrating sections. Proposal: the scroll story stays
   short (name → room); after it, the *objects* are the sections, and a plain long-form page
   lives below/behind for SEO + recruiters (the noscript/prerender already covers crawlers).
2. **Light/dark theme.** The lamp sets `data-theme` but the CSS only has a dark palette.
   Want a true light theme for the overlay UI, or keep UI dark and let the lamp only change
   the room?
3. **Dissolve effect.** Current particle dissolve is custom canvas code. The `vapour-text`
   component from the 2D library is the closer match to what you described — porting it to
   draw into the screen texture is a contained follow-up.
4. **Chair placement** costs a little of the left desk in some framings; it's a deliberate
   "someone just got up" pose. Easy to push further away if you'd rather.

## 5. Known gaps / next steps

- Midday sky reads slightly washed-out; no visible sun patch at noon (sun is high). Could
  add a faint fake light-shaft plane for midday.
- Diary page typography is the library book's (bold Georgia); should be redrawn in the site's
  fonts with proper post cards.
- Headphones/diary partially hidden behind the chair from some angles.
- Not yet tested on a real phone / real iGPU frame-rate; tiers are heuristic.
- `hover` cursor: site hides the native cursor; 3D hover shows a label chip but the custom
  cursor dot doesn't change state yet.
- New props (chair, mouse, plant) should be added back to the `models/` library per the
  workshop's reuse rule (they're in meters; library models use a different scale).

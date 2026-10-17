# Room performance, devices & roam mode

Measured on the dev machine (Ryzen 5 7430U, AMD Radeon integrated, 16 GB) with
headless Chrome on the real GPU, camera moving, overview shot. "Phone" = 390×844
@3×, touch, CPU throttled 4× (mid-range Android) / 6× (budget). Phone GPUs can't be
emulated, so phone numbers are CPU-realistic, GPU-optimistic.

| Case | v1 (`room-v1`) | now |
|---|---|---|
| Laptop 1440×900 | 95 ms/frame (~11 fps) | 6.7 ms (mid) |
| Laptop 1920×1080 | 109 ms (~9 fps) | 7.8 ms (mid) · 10.9 ms (high) |
| Phone, 4× CPU | 95 ms (~11 fps) | 17 ms (~58 fps, low) |
| Phone, 6× CPU | — | 29 ms (~35 fps, low) |
| Draw calls, overview | 2,156 | ~300–450 |
| Meshes | 589 | 221 |

## What was slow, and the fix

1. **Draw calls.** Library models are dozens of tiny parts (keyboard alone: 190 meshes);
   each part is drawn in the main pass *and* every shadow pass. → `bake.js` /
   `<Baked>` merge static meshes into one mesh per material; keyboard drops its 60
   per-key legend materials.
2. **Lens glass `transmission` on the phone model.** Forces a full second render of
   the whole scene every frame, and with renderer tone mapping it rebuilt shader
   programs every frame (30% of CPU on phones). → replaced with plain transparency
   in `prepModel`. Single biggest phone win (43 → 20 ms).
3. **Rendering 60×/s while nothing moves.** → `frameloop="demand"`: full rate only
   while something moves (scroll, pointer, camera easing, focus transitions),
   otherwise an idle cap (24–30 fps) that just keeps steam/dust alive.
4. **Shadow maps re-rendered every frame.** → static; re-rendered only when a caster
   moves (drawer, phone, card, chair spin, headphone swing, time change). The lamp's
   idle sway was removed (it forced constant re-renders).
5. **Per-frame texture uploads** (phone screen 900×1860 every frame; hidden library
   laptop desktop every frame). → phone redraws once a minute; library render off.
6. **Resolution.** Cost is fill-rate bound (frame time scales ~linearly with pixels).
   → each tier has a **pixel budget** (`tier.js`), DPR is derived from it.

## Tiers (`src/three/room/tier.js`)

| Tier | Who | What they get |
|---|---|---|
| **high** | discrete / Apple-silicon GPUs | AO, bloom, SMAA, 2k sun shadow + lamp shadow, ≤3.6 MP |
| **mid** | integrated laptop GPUs (this machine) | bloom + SMAA, no AO, 1k shadows, ≤1.6 MP |
| **low** | phones/tablets, ≤4 GB RAM, ≤4 cores | no post-processing (renderer AgX), sun shadow only, no dust/curtain sway, ≤0.9 MP |
| **poster** | no WebGL2, data-saver, ≤2 GB RAM, software GPU | still image of the room (`public/room-poster*.jpg`) + the same chips; every section still one tap away |

Detection: GPU name + RAM + cores + touch + screen → initial guess; an FPS probe after
the intro steps down once if the device can't hold it, and the result is remembered
per device (`localStorage room-tier-v3`). Override: `?tier=high|mid|low|poster`.

## Roam mode — `/?roam`

Free orbit around the whole setup. Walls between you and the desk cut away
(dollhouse view) but keep casting shadows, so daylight stays correct. Objects stay
clickable (drawer opens, chair spins…). Inspector panel: fps, draw calls, triangles,
render resolution, heap, tier switcher, time-of-day slider, lamp.

Other switches: `?debug` (inspector on the normal page), `?hour=18.5`,
`?off=gpu` (true per-frame cost via `gl.finish()`), `?off=shadow,rect,post,env,fill`
(profiling), `?capture` (no overlay — used to render the posters).

## Re-running the numbers

`scripts/perf/*.mjs` drive headless Chrome on the real GPU. They need
`puppeteer-core` (not a site dependency): `npm i --no-save puppeteer-core` then e.g.
`VP=1440x900 node scripts/perf/rafbench.mjs "http://localhost:5173/?debug" label`.

Shots: `docs/shots/perf/` (roam angles, phone journey).

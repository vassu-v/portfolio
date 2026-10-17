# 3D Desk Portfolio: References & Technique Notes

Research for the "desk/room IS the website" redesign (React + Vite, R3F 9, drei 10,
three r185, @react-three/postprocessing 3). Target: mild, realistic, soft light,
no bake, smooth on AMD iGPUs and phones. Palette: near-black, copper `#C57B2B`,
gold `#D4983A`. Type: Instrument Serif italic + JetBrains Mono.

Researched 2026-10-09. URLs checked live unless marked *(unverified)*.

---

## 1. Reference sites

| # | Site | URL |
|---|------|-----|
| 1 | Henry Heffernan, Portfolio 2022 | https://henryheffernan.com (source: https://github.com/henryjeff/portfolio-website) |
| 2 | Bruno Simon, My Room in 3D | https://my-room-in-3d.vercel.app |
| 3 | Bruno Simon, Bruno's Home (2025 folio) | https://bruno-simon.com |
| 4 | Jesse Zhou, "Jesse's Ramen" | https://jesse-zhou.com |
| 5 | Andrew Woan, Sooah's Room Folio | http://sooahs-room-folio.com (source: https://github.com/andrewwoan/sooahs-room-folio) |
| 6 | Taha Shajarian, R3F room portfolio | https://taha-shajarian.ir (thread: https://discourse.threejs.org/t/an-interactive-3d-portfolio-room/93515) |
| 7 | Igloo Inc (Awwwards Site of the Year 2024) | https://www.igloo.inc |
| 8 | Andrew Woan, room portfolio course (YouTube via freeCodeCamp) | https://www.freecodecamp.org/news/create-a-cute-room-portfolio-with-threejs-blender-javascript/ |

### 1. Henry Heffernan: the closest match to our concept
- **What it does well:** You arrive at a desk with a retro PC. Clicking the monitor
  makes the camera dolly into the screen, and the screen is a **real, working DOM
  site** (a 2D "OS" in a separate repo, `portfolio-inner-site`) shown in an iframe
  with CSS3D alignment. Room ambience sounds and keyboard clicks give it life.
  The lighting is baked and moody, mostly lit by the screen glow.
- **How text is shown:** All real content lives on the in-screen 2D site, so it
  stays crawlable and readable. The 3D scene is only the frame around it.
- **Steal:** *The screen is a real DOM page.* Our "zoomed into the laptop showing my
  name" opening should be HTML (drei `<Html transform occlude="blending">`), not a
  canvas texture. The text stays sharp, selectable and indexable, and the scroll
  pull-back reveals it was sitting in a room all along.

### 2. Bruno Simon, My Room in 3D
- **What it does well:** Photoreal *soft* light from one Blender bake, plus a
  **runtime light-mix**: the bake is split into channels (TV light, desk light, PC
  RGB) that a shader adds back with adjustable colour and strength. A night/day
  slider and coffee-cup steam (a scrolling noise texture on a plane) complete it.
  The camera is an orbit with tight limits, and its slow idle drift reads as
  "alive".
- **Steal:** *Light-mixing as the theme switch.* Without a bake we can copy the
  idea: our lamp switch should lerp **several** values together (lamp intensity,
  window/sun intensity, env intensity, exposure, bloom). A single toggle that
  only flips a background colour would miss it. Add steam over the mug, and give
  the idle camera a slow ±1–2° breathing sway.

### 3. Bruno Simon, Bruno's Home (2025)
- **What it does well:** A playful drivable world (Three.js + Rapier + Howler).
  It always offers a **non-3D escape hatch** (an "about/info" panel and links), and
  it is honest about its stack and source code.
- **Steal:** *An always-visible skip-to-content control.* A small fixed mono
  label in the corner, like `[ classic view ]`, that leads recruiters to the plain
  page.

### 4. Jesse Zhou, Jesse's Ramen
- **What it does well:** A loader screen ("Cooking your ramen… %") with a START
  button gates audio and sets the mood. After that, scroll and clicks move the
  camera between stations of one baked diorama. Each content section is a
  physical thing in the world (vending machine, screens, arcade). It won web design
  awards that launched his career (ZTM instructor bio).
- **Steal:** *Every section is an object with its own place to stand.* This is
  our drawer→projects, diary→blog, corkboard→experience, phone→contact. Also steal
  the **themed loader copy**, for example "warming up the lamp… 72%".

### 5. Andrew Woan, Sooah's Room Folio
- **What it does well:** A cute isometric room, GSAP hover tweens, a theme toggle,
  and project "trails". The README lists real-world lessons: hover flicker happens
  when a hover animation moves the mesh out from under the cursor, so he raycasts
  against **invisible static hitboxes**. Objects with intro animations only get
  hitboxes after the intro. Ship `.mp3` fallbacks for Safari.
- **Steal:** *Raycast against invisible proxy boxes, never the animated mesh.*
  Each clickable (drawer, diary, phone…) gets a simple `boxGeometry` hitbox with
  `visible={false}`, which is cheaper and stops jitter.

### 6. Taha Shajarian, R3F room
- **What it does well:** An R3F room with a guided tour mode, interactive
  books/chess/canvas, interactive lighting (fireplace, curtain, monitor), heavy
  work on loading, and **automatic quality scaling for weaker devices**.
- **Steal:** *Guided tour plus free exploration.* Scroll runs the guided tour,
  clicks allow free focus. Also copy the auto-quality tiers (section 3 below).

### 7. Igloo Inc
- **What it does well:** Scroll-driven camera through a few hero "chapters", with
  strong restraint: one palette, one material language, and UI text in a crisp
  mono overlay that is never baked into 3D. Transitions are scrubbed by scroll
  with heavy easing.
- **Steal:** *Text in DOM overlays, 3D for mood.* Section headings in Instrument
  Serif italic float in HTML over the canvas and are synced to scroll progress.
  No `<Text3D>` for body copy.

### 8. Woan / freeCodeCamp room course
- **What it does well:** A worked recipe: GSAP ScrollTrigger, theme toggle, camera
  moves along curves (`CatmullRomCurve3`), mobile-responsive raycasting, asset
  compression.
- **Steal:** *Drive the intro pull-back along a spline, not a straight lerp.*
  `curve.getPointAt(p)` for position plus a second curve for the look-at target
  gives the cinematic arc out of the laptop screen.

---

## 2. Realistic-but-cheap lighting (no bake)

### 2.1 Renderer baseline (R3F 9 / three r185)
```jsx
<Canvas
  shadows="soft"                       // PCFSoftShadowMap
  dpr={[1, 1.75]}                      // cap; PerformanceMonitor adjusts inside
  gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
  camera={{ fov: 35, near: 0.05, far: 40 }}   // 30–40° fov = "photographic" look
  onCreated={({ gl }) => {
    gl.toneMapping = THREE.AgXToneMapping   // softest highlight roll-off
    gl.toneMappingExposure = 1.0            // drive per time-of-day (0.7–1.2)
  }}
>
```
- **Physically correct lights are the default** since r155 (`useLegacyLights`
  removed in r165). Intensities are in real units: Point/Spot in **candela**,
  Directional in **lux**-like, RectArea in **nits**. Decay must stay `2`.
- **Tonemapping choice:** **AgX** gives the most "mild, filmic" result. Highlights
  desaturate gracefully and copper does not go neon. ACES Filmic is punchier, with
  more contrast and an orange shift in highlights that can make copper look
  orange. `NeutralToneMapping` (Khronos PBR Neutral) keeps brand colours closest
  to sRGB. **Pick AgX**, and use Neutral for UI-colour-critical screen content.
- **With postprocessing:** set tonemapping in the effect chain instead, using
  `<ToneMapping mode={ToneMappingMode.AGX} />` as the last effect. Then
  `gl.toneMapping = NoToneMapping`, or you tonemap twice.
- Use `colorSpace = SRGBColorSpace` on colour textures and leave roughness/normal
  maps linear. Turn on `texture.anisotropy = 4` for the desk-top wood (8 is
  wasted on an iGPU).

### 2.2 Light rig (room corner, metres; desk ≈ 1.6 × 0.75 m)
| Light | Type | Intensity (physical units) | Shadows | Notes |
|---|---|---|---|---|
| Sun / moon through window | `directionalLight` | day 2.5–4, golden 1.5, night moon 0.15–0.3 | **yes**, the only big caster | colour from Kelvin table below |
| Window fill (sky bounce) | `rectAreaLight` 1.2×1.4 at window plane, facing in | 2–6 (nits-ish) day, 0.3 night | no (RectArea can't) | call `RectAreaLightUniformsLib.init()` once; MeshStandard/Physical only |
| Desk lamp | `spotLight` angle 0.6, penumbra 0.8, decay 2, distance 3 | 6–15 cd (on), 0 (off) | yes, 512 map (or off on mobile) | 2700 K `#FFA957`; also an emissive bulb mesh (`emissiveIntensity` 4–8) so bloom picks it up |
| Laptop screen glow | `rectAreaLight` 0.3×0.2 | 0.5–1.5 | no | colour = screen avg; key light at night |
| Ambient | **no `ambientLight`** | — | — | use env map (below); ambient flattens everything |

### 2.3 Environment from Lightformers (replaces HDRI, ~0 runtime cost)
```jsx
<Environment resolution={256} frames={1} environmentIntensity={envI}>
  {/* window: big soft rect, colour = sky colour */}
  <Lightformer form="rect" intensity={2} color={skyColor} scale={[3, 2]} position={[-3, 1.5, 0]} rotation-y={Math.PI / 2} />
  {/* ceiling bounce: warm, dim */}
  <Lightformer form="rect" intensity={0.4} color="#f0e2cf" scale={[6, 6]} position={[0, 4, 0]} rotation-x={Math.PI / 2} />
  {/* lamp hotspot for copper/metal reflections */}
  <Lightformer form="circle" intensity={lampOn ? 6 : 0} color="#ffb46b" scale={0.6} position={[0.8, 1.6, 0.4]} />
  {/* rim on the opposite wall, keeps blacks from going dead */}
  <Lightformer form="ring" intensity={0.3} color="#C57B2B" scale={2} position={[3, 1, -2]} target={[0, 0, 0]} />
</Environment>
```
- `frames={1}` bakes once. When time of day or the lamp changes, re-render by
  changing the `key` (or use `frames={2}` for a moment). Never use `Infinity` on
  mobile.
- `environmentIntensity`: day 0.6–1.0, golden hour 0.5, night 0.12–0.2 (lamp-lit
  rooms should look mostly dark).
- Metals (copper accents, lamp, headphone band) look fake **only** without an env
  map. This is the single biggest realism win.

### 2.4 Soft shadows
- Use **one** shadow-casting directional light. Fit its ortho camera **tightly**
  to the desk area. Every extra metre lowers texel density.
  ```jsx
  <directionalLight castShadow shadow-mapSize={[1024, 1024]}
    shadow-camera-left={-1.4} shadow-camera-right={1.4}
    shadow-camera-top={1.4} shadow-camera-bottom={-1.4}
    shadow-camera-near={0.5} shadow-camera-far={8}
    shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-radius={4} />
  ```
- **Acne vs peter-panning:** start `bias -0.0001…-0.0005`, `normalBias
  0.01…0.04` (scene-scale dependent; the desk is metre-scale). Raise
  `normalBias` first, because it fixes acne on curved surfaces (mug, headphones)
  without detaching contact shadows.
- `shadow-radius` only has an effect with `PCFShadowMap` or `VSMShadowMap`.
  `PCFSoftShadowMap` ignores it, so `shadows="soft"` gives a fixed softness. In
  practice drei `<SoftShadows size={20} samples={10} focus={0.5} />` (PCSS)
  gives contact-hardening soft shadows. It is **desktop only** (≈ +1–3 ms on an
  iGPU), so skip it on mobile.
- Static scene → `gl.shadowMap.autoUpdate = false`. Then set
  `gl.shadowMap.needsUpdate = true` only when the sun/lamp moves. This is huge
  for iGPUs.
- Cheap contact grounding for small props (mouse, mug, phone): drei
  `<ContactShadows opacity={0.45} blur={2.2} far={0.25} resolution={256} frames={1} />`
  under the desk-top plane, or a pre-made blurred-dark-ellipse PNG decal per prop
  (free).
- Only big objects cast shadows: laptop, lamp, monitor-ish items, chair,
  headphones. Small clutter is `castShadow={false}` and grounded by AO/decals.

### 2.5 Ambient occlusion (N8AO, via `@react-three/postprocessing`'s `<N8AO>`)
| Tier | Settings |
|---|---|
| Desktop | `aoRadius={0.35}` (world m) `distanceFalloff={1}` `intensity={2.5}` `quality="medium"` (16 samples / 8 denoise) `halfRes` |
| iGPU | same but `quality="performance"` (8/4), `halfRes`, intensity 2 |
| Phone | **off**, rely on ContactShadows + darkened texture creases |
- `intensity` is a `pow()`. A value of 2 is soft and 5 is heavy. For "mild",
  stay at **2–3**.
- Use `color="#0a0705"` (warm near-black), not pure black, so corners blend with the
  copper palette.
- Changing quality **recompiles shaders**, so pick the tier once at boot and don't
  toggle it during play. Use SMAA (`<SMAA />`), because MSAA does not work through
  AO.
- `halfRes` gives roughly a 2–4× speedup; depth-aware upsampling adds about 1 ms
  of fixed cost and should stay on.

### 2.6 Bloom (keep it subtle)
```jsx
<Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.2} intensity={0.35} radius={0.6} />
```
- With `threshold = 1.0`, only HDR values bloom: the lamp bulb (`emissiveIntensity`
  4–8, `toneMapped={false}`), the screen edge, and the sun hotspot through the
  window. Nothing else glows, which avoids the "everything is fuzzy" defect.
- Night mode: bump the intensity to 0.5. Day: 0.25.

### 2.7 Fake light shafts through the window (cheap)
1. **Additive volume planes:** 2–3 thin planes (or one open cone/box) from the
   window toward the floor, `MeshBasicMaterial` with a vertical-gradient alpha
   texture, `blending={AdditiveBlending}`, `depthWrite={false}`,
   `transparent`, opacity 0.04–0.10. Colour = sun colour. Slowly scroll a noise
   texture (UV offset) for dust motes. Cost is close to zero.
2. **Floor/desk light patch:** a decal plane with a soft window-pane-shaped
   texture (cross-bars) in sun colour, additive, positioned from the sun
   direction. It sells "sunlight on the desk" more than real shadows do. Add a
   `cookie`-like effect by giving the directional light's shadow a window-frame
   caster.
3. Dust: `<Sparkles count={40} scale={[1,1.5,1]} size={1.5} speed={0.15} opacity={0.4} color={sun} />`
   placed inside the beam only. Desktop only.
4. Skip `GodRays` from postprocessing. It needs an extra pass and a sun mesh, and
   it looks gamey at this scale.

### 2.8 Time-of-day: sun colour (Kelvin → sRGB, blackbody approximations)
| Moment (local) | Kelvin | Sun hex | Sun intensity | Exposure | Notes |
|---|---|---|---|---|---|
| Night (22:00–05:00) | moon, render ~**7500–8000 K** perceptual | `#C9D6FF` (blue-shifted for Purkinje effect) | 0.15–0.3 | 0.75 | lamp/screen are key lights |
| Dawn / blue hour (05:00–06:30) | 7000–9000 K sky, sun 2000 K at horizon | sun `#FF890E` → `#FFA14A` | 0.5–1.0 | 0.85 | very low sun angle 5–10° |
| Sunrise / early (06:30–08:30) | 3000–3500 K | `#FFB46B` → `#FFC489` | 1.5–2.5 | 0.95 | |
| Morning (08:30–11:00) | 4500–5000 K | `#FFDBBA` → `#FFE4CE` | 3.0 | 1.0 | |
| Noon (11:00–15:00) | 5500–6500 K | `#FFECE0` → `#FFF9FD` | 3.5–4 | 1.0 | sun high, short shadows; shafts barely visible |
| Golden hour (16:30–18:30) | 2500–3000 K | `#FFA148` → `#FFB46B` | 1.5–2.0 | 0.95 | **hero look**, matches copper palette |
| Dusk (18:30–19:30) | 2000 K sun, sky 10000 K+ | sun `#FF890E` low, fill `#CCDBFF` | 0.4–0.8 | 0.85 | warm/cool split |

Reference points: 2000 K `#FF890E`, 2700 K `#FFA957`, 3000 K `#FFB46B`,
3500 K `#FFC489`, 4000 K `#FFD1A3`, 5000 K `#FFE4CE`, 6500 K `#FFF9FD`,
8000 K `#E3E9FF`, 10000 K `#CCDBFF`. Always set colours via
`color.set(hex)` (three converts sRGB to linear). Interpolate in **linear** space
with `Color.lerp` between keyframes, not in hex.

### 2.9 Sky gradient (what's visible through the window), top → horizon
| Time | Zenith | Horizon | Window glass tint |
|---|---|---|---|
| Night | `#05070F` | `#121A2E` | stars as tiny points, opacity 0.6 |
| Dawn | `#1E2A4A` | `#E8A07A` | |
| Morning | `#6FA3D8` | `#D8E7F2` | |
| Noon | `#4F8FD6` | `#BFDCF2` | |
| Golden | `#5A6E9A` | `#F2B36B` | |
| Dusk | `#2A2A52` | `#D9735A` | |
Render the sky as a big plane behind the window with a 2-stop `ShaderMaterial`
(mix by `vUv.y`, `toneMapped={false}`, intensity ×1.5–3 in daytime so it reads as
"brighter than the room" and blooms slightly at the frame edge). Time source:
`new Date().getHours() + minutes/60`. Re-evaluate every 60 s, and add a hidden
`?t=17.5` query override for QA. Ease into night: lerp over 0.5 h windows,
never hard-switch.

### 2.10 Lamp switch = light/dark mode (one state, many knobs)
`lampOn` (dark-mode = lamp is the hero) tweens over 400–600 ms with
`maath/easing.damp`. It drives the lamp spot (0→12 cd), bulb emissive (0→6), the
Lightformer hotspot, `environmentIntensity` (×0.6 when room-dark), exposure ±0.1,
bloom intensity, and the DOM theme via `document.documentElement.dataset.theme`.
Add a 30 ms flicker at turn-on and a click sound.

---

## 3. Performance for iGPU and phones

### 3.1 Quality tiers (pick at boot, then adapt DPR only)
| | Desktop dGPU | iGPU (Radeon 7430U-class) | Phone |
|---|---|---|---|
| DPR | [1, 2] | [1, 1.5] | [0.75, 1.25] |
| Shadow map | 2048 (sun) + 512 (lamp) | 1024 sun, lamp no shadow | 512 sun, or baked-ish ContactShadows only |
| Shadows | SoftShadows (PCSS) | PCFSoft | `shadows={false}` + ContactShadows `frames={1}` |
| AO | N8AO medium halfRes | N8AO performance halfRes | off |
| Bloom | mipmap | mipmap | mipmap, or off on low-end |
| Env | Lightformers 256 | 128 | 64 |
| Dust/sparkles, steam | on | on | off |
| AA | SMAA | SMAA | none (DPR handles it) |
Detect the tier with `detect-gpu` (`getGPUTier()`, tiers 0–3) plus
`navigator.hardwareConcurrency` and `matchMedia('(pointer: coarse)')`. Fall back to
the classic DOM page for tier 0 or no WebGL2.

### 3.2 Adaptive DPR
```jsx
const [dpr, setDpr] = useState(tier.maxDpr)
<Canvas dpr={dpr}>
  <PerformanceMonitor
    bounds={(r) => (r > 90 ? [50, 80] : [45, 58])}
    flipflops={3}
    onChange={({ factor }) => setDpr(round(tier.minDpr + (tier.maxDpr - tier.minDpr) * factor, 2))}
    onFallback={() => setDpr(tier.minDpr)}
  />
  <AdaptiveDpr pixelated={false} />   {/* drops DPR while camera is moving */}
  <AdaptiveEvents />
```
- PerformanceMonitor defaults: samples every 250 ms ×10, threshold 0.75, step
  0.1. `flipflops={3}` stops oscillation.
- Note that the drei docs example uses `Math.floor(x, 1)`, which ignores the
  second argument. Use a proper round.
- `<AdaptiveDpr>` relies on `performance.regress()`. Call `regress()` from
  camera-transition code so DPR dips during fly-tos and recovers when still.

### 3.3 Frameloop strategy
- `frameloop="demand"` once the scene is settled. Call `invalidate()` on scroll
  progress change, pointer move (for parallax), and tweens. Idle cost is
  roughly 0 W, which matters a lot on laptops and phones.
- Continuous-only effects (steam, dust, clock second hand) are the enemy of
  demand. Either drop them when `document.hidden` / idle > 5 s, or run a 30 fps
  ticker that invalidates.
- Pause entirely when the tab is hidden or the canvas is off-screen
  (IntersectionObserver).

### 3.4 Asset budget
- Target **< 150k triangles total**, **< 60 draw calls** on mobile, textures
  ≤ 1024² (2048 only for desk-top and wall), KTX2/Basis + Draco/Meshopt GLB
  (`gltf-transform optimize --compress meshopt --texture-compress ktx2`).
- Merge static clutter into one mesh per material. Use `<Instances>` for repeated
  items (keycaps, pens, sticky notes).
- Use `MeshStandardMaterial` everywhere. `MeshPhysical` only for the laptop
  screen glass / mug glaze (clearcoat). No `transmission` (expensive extra pass)
  on mobile, so fake glass with opacity + env reflection.

---

## 4. Interaction, accessibility, content surfacing

### 4.1 Click-to-focus camera
- Use drei `<CameraControls>` (camera-controls lib): `controls.setLookAt(px,py,pz,
  tx,ty,tz, true)` for smooth damped transitions, `smoothTime = 0.6`. Or
  `fitToBox(mesh, true, { paddingTop: .1, ... })` for automatic framing per
  object.
- Store a **named shot list**: `{ id:'drawer', pos:[…], target:[…], fov:30 }`.
  Scroll sections and clicks both resolve to a shot id, so there is one source of
  truth.
- Hitboxes: invisible proxy boxes (see Woan). Use `onPointerOver` to set
  `document.body.style.cursor='pointer'`, add a subtle rim/emissive lift
  (`emissiveIntensity` 0→0.15 copper), and show a mono tooltip label.
- Esc / back / click-empty-space returns to the overview shot. Mirror the focused
  object in the URL hash (`#projects`) so deep links and the browser Back button
  work.
- Limit free orbit to ±15° azimuth / ±8° polar around the current shot. Strict
  limits keep the composition authored.
- Mobile: tap = focus, no hover states. Raise hitbox sizes by 1.3×.

### 4.2 Surfacing text
| Content | Technique | Why |
|---|---|---|
| Laptop screen (hero name) | `<Html transform occlude="blending" distanceFactor={…}>` inside screen group | real DOM, crisp, selectable, occluded by geometry |
| Project list in drawer / blog in diary | camera focuses → **DOM overlay panel** (fixed, outside canvas) with GSAP fade | long text must be DOM: readable, scrollable, accessible |
| Sticky notes, corkboard labels | drei `<Text>` (troika SDF) with JetBrains Mono `.woff`, ≤ 10 words each | sharp at any zoom, cheap |
| Phone screen | `CanvasTexture` or `<Html transform>` | small, decorative; real contact links in overlay |
- `<Html transform>` can be blurry on some browsers. The fix is to scale the
  `Html` group down (e.g. 0.1) and its child CSS up (×10).
- Keep `<Html>` count low (≤ 3 mounted). Each one is per-frame matrix work.
  Unmount when the object is far from focus.
- Never put critical text only in textures. Recruiters, screen readers and SEO
  can't read it.

### 4.3 Accessibility / recruiter fallback
- A **semantic DOM layer always exists**: `<header>` nav (Work, Writing,
  Experience, Contact), plus `<main>` sections with real `h1/h2` content. The 3D
  scene is visually primary but the DOM is the source of truth. 3D objects are
  shortcuts into it.
- Provide a visible `[ skip 3D / classic view ]` toggle. Persist it in
  localStorage.
- Auto-select the classic view when: no WebGL2, GPU tier 0,
  `prefers-reduced-motion: reduce` (show a static render instead of scroll
  flights), or `navigator.connection.saveData`.
- Keyboard: Tab cycles focusable objects in a fixed order (laptop → drawer →
  diary → corkboard → phone → lamp). Focus triggers the same camera shot. Each
  has an `aria-label`. `canvas` gets `role="img"` + description, with interactive
  equivalents in the DOM.
- Loader ≤ 3 s target. Show the DOM name/title immediately (LCP is text, not
  WebGL), then fade the canvas in behind it.

---

## 5. Quick "realism checklist" (common quality defects to avoid)
1. No pure black or pure white anywhere. Floor the room at `#0a0806`, highlights
   tonemapped.
2. Every prop touches something. Contact shadow or AO under it, or it floats.
3. Bevel every edge (0.5–2 mm `RoundedBox` radius). Perfectly sharp edges read
   as CG.
4. Roughness 0.4–0.9 for most surfaces. Nothing at 0 except screen glass.
   Add a faint roughness noise map for fingerprints/wear.
5. Slight disorder: rotate clutter 2–8°, offset from grid, cable sag.
6. Single dominant light direction per time of day. Fill comes from the env,
   not extra lights.
7. Camera: fov 30–40°, no roll, idle sway ±1°, subtle DOF only in focus shots (`<DepthOfField focusDistance bokehScale={2}>`, desktop only).
8. Check shadow acne on curved props and peter-panning at the desk/laptop seam
   after every bias change.

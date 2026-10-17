/*
 * MECHANICAL KEYBOARD — dark 60% board, sculpted blank keycaps, amber accents,
 * with a tactile key-press animation: fast travel down, bottom-out, pop back
 * up with a slight overshoot bounce — plus an idle "ghost typist" that types
 * in human bursts, and an amber underglow that pulses under every keystroke.
 *
 * Exports:
 *   createModel(options?) → THREE.Group  (call group.userData.update(elapsed, delta) each frame)
 *   getModelInfo()        → { name, dimensions, suggestedScale, tags }
 *
 * ============================================================================
 * ANIMATION MAP — everything that can move on this model, and what to tune
 * ============================================================================
 *
 * 1. KEY PRESS (the tactile click — built-in, also manual via API)
 *    Each press runs a 3-phase curve over PRESS_DUR seconds:
 *      0–30%   travel down  (ease-out cubic → fast attack, like a real strike)
 *      30–50%  bottomed out (held at -KEY_TRAVEL)
 *      50–100% release      (ease-out-BACK → pops ~8% past rest = tactile bounce)
 *    → tune:
 *      - KEY_TRAVEL (0.045)  deeper = clackier, shallower = laptop-ish
 *      - PRESS_DUR  (0.16 s) shorter = frantic, longer = deliberate
 *      - BACK_OVERSHOOT (1.7) in easeOutBack: raise toward 3 for springier pop,
 *        set 0 for a dead linear release (membrane keyboard energy)
 *    → API: userData.pressKey(row, col) or userData.pressKey('random')
 *
 * 2. GHOST TYPIST (built-in idle animation)
 *    Types in human bursts: 3–9 keys at 60–130 ms apart, then a 0.4–1.4 s
 *    "thinking" pause. Weighted toward the letter rows; hits space at burst
 *    ends like real word breaks.
 *    → tune: BURST_KEYS min/max, BURST_GAP min/max, PAUSE min/max
 *    → API: userData.setTyping(false) to stop it (manual pressKey still works)
 *
 * 3. UNDERGLOW PULSE (userData.parts.underglow — THREE.PointLight,
 *    and userData.parts.glowStrip — emissive strip mesh)
 *    Base amber glow under the case; every keystroke bumps it +GLOW_KICK and
 *    it decays back at GLOW_DECAY per second. The light also slides toward
 *    the pressed key's x position, so the glow follows the typist's hands.
 *    → tune: GLOW_BASE (0.35), GLOW_KICK (0.55), GLOW_DECAY (4.0)
 *    → set GLOW_KICK = 0 for a static premium underglow, or animate
 *      glowStrip.material.emissiveIntensity for RGB-gamer breathing.
 *
 * 4. ACCENT KEYS (userData.parts.accentKeys — Esc + Enter meshes)
 *    Amber caps with faint emissive (0.18). Ideas: pulse emissiveIntensity
 *    on press, or swap .material.color for a caps-lock state light.
 *
 * 5. CLICK SOUND (optional, off by default — createModel({ sound: true }))
 *    A 4 ms noise burst through a bandpass filter ≈ tactile switch click.
 *    Browsers require a user gesture before audio: the module lazily creates
 *    the AudioContext on the first press after any pointerdown.
 *    → tune in click(): filter frequency 2400 Hz (higher = thocky → clicky),
 *      gain 0.12, decay 0.05 s.
 *
 * 6. BACKLIT LEGENDS (createModel({ legends: false }) for blank caps)
 *    Amber characters glow softly through the caps (emissiveIntensity 0.85);
 *    Esc/Enter get dark printed legends since they sit on amber caps.
 *    → breathing backlight: collect the legend materials
 *      (parts.keys.flat().map(k => k.mesh.children[1]?.material)) and drift
 *      emissiveIntensity 0.5–1.1 with a slow sine — classic backlight breathe.
 *    → tune: text color '#ffb054', emissiveIntensity 0.85 in legendMaterial().
 *
 * 7. WHOLE-BOARD FLOURISHES (not built-in, easy)
 *    - Case shake: on each press nudge parts.board.position.y by -0.002 and
 *      spring back — heavy typist energy.
 *    - Wave test: loop pressKey(r, c) diagonally with 30 ms offsets for a
 *      keycap wave (the classic keyboard-review shot).
 * ============================================================================
 *
 * Note: keycaps are intentionally blank (no legends) — sculpted blanks read
 * as premium at cinematic distance and keep the draw-call count at 1 material
 * per color. Legends would need a canvas-texture atlas per row if ever wanted.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const AMBER = 0xff9500;

// --- key press feel ---
const KEY_TRAVEL = 0.045;
const PRESS_DUR = 0.16;
const BACK_OVERSHOOT = 1.7;

// --- ghost typist rhythm ---
const BURST_KEYS = [3, 9];      // keys per burst (min, max)
const BURST_GAP = [0.06, 0.13]; // seconds between keys in a burst
const PAUSE = [0.4, 1.4];       // seconds of thinking between bursts

// --- underglow ---
const GLOW_BASE = 0.35;
const GLOW_KICK = 0.55;
const GLOW_DECAY = 4.0;

// 60% layout — each row is a list of key widths in "units" (1u = one letter key)
const LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],                 // esc + numbers + backspace
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],             // tab row
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],              // home row + enter
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],                 // shift row
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],           // bottom row + spacebar
];
// legends matched 1:1 to LAYOUT ('' = blank, e.g. spacebar)
const LEGENDS = [
  ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'bksp'],
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
  ['ctrl', 'win', 'alt', '', 'alt', 'fn', 'menu', 'ctrl'],
];
const U = 0.14;        // one key unit in scene units
const GAP = 0.018;     // gap between caps
const CAP_H = 0.055;   // keycap height
// slight per-row tilt = sculpted profile
const ROW_TILT = [-0.10, -0.05, 0, 0.04, 0.07];

const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeOutBack = x => 1 + (BACK_OVERSHOOT + 1) * Math.pow(x - 1, 3) + BACK_OVERSHOOT * Math.pow(x - 1, 2);
const rand = (a, b) => a + Math.random() * (b - a);

export function createModel({ sound = false, typing = true, legends = true } = {}) {
  const group = new THREE.Group();
  group.name = 'mechanical-keyboard';

  // `board` carries the ergonomic tilt; outer group stays clean for the scene
  const board = new THREE.Group();
  board.rotation.x = -0.07;
  group.add(board);

  const boardW = 15 * U + 0.16;
  const boardD = 5 * U + 0.14;

  // ---------------- Case ----------------
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x17161a, roughness: 0.6, metalness: 0.1 });
  const kbCase = new THREE.Mesh(new RoundedBoxGeometry(boardW, 0.11, boardD, 4, 0.03), caseMat);
  kbCase.position.y = 0.055;
  board.add(kbCase);

  // top plate the switches sit in — a shade lighter so the case reads as two-part
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(boardW - 0.06, 0.012, boardD - 0.06),
    new THREE.MeshStandardMaterial({ color: 0x211f24, roughness: 0.55, metalness: 0.15 })
  );
  plate.position.y = 0.115;
  board.add(plate);

  // amber underglow strip peeking out under the case rim
  const glowStrip = new THREE.Mesh(
    new RoundedBoxGeometry(boardW - 0.02, 0.014, boardD - 0.02, 2, 0.007),
    new THREE.MeshStandardMaterial({ color: 0x1a0f00, emissive: AMBER, emissiveIntensity: GLOW_BASE, roughness: 0.8, toneMapped: false })
  );
  glowStrip.position.y = 0.004;
  board.add(glowStrip);

  const underglow = new THREE.PointLight(AMBER, GLOW_BASE, 1.6, 2);
  underglow.position.set(0, 0.02, boardD / 2 + 0.05);
  board.add(underglow);

  // little rubber feet
  const footMat = new THREE.MeshStandardMaterial({ color: 0x0c0b0d, roughness: 0.9 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.02, 12), footMat);
    foot.position.set(sx * (boardW / 2 - 0.12), -0.005, sz * (boardD / 2 - 0.1));
    board.add(foot);
  });

  // braided cable arcing out the back
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-boardW / 2 + 0.25, 0.08, -boardD / 2 + 0.02),
    new THREE.Vector3(-boardW / 2 + 0.22, 0.16, -boardD / 2 - 0.18),
    new THREE.Vector3(-boardW / 2 + 0.3, 0.02, -boardD / 2 - 0.42),
    new THREE.Vector3(-boardW / 2 + 0.55, 0.01, -boardD / 2 - 0.55),
  ]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 24, 0.016, 8),
    new THREE.MeshStandardMaterial({ color: 0x232028, roughness: 0.75 })
  );
  board.add(cable);

  // ---------------- Keycaps ----------------
  const capMat = new THREE.MeshStandardMaterial({ color: 0x4a4753, roughness: 0.52, metalness: 0.1 });
  const capDarkMat = new THREE.MeshStandardMaterial({ color: 0x322f38, roughness: 0.55, metalness: 0.1 }); // modifier keys
  const accentMat = new THREE.MeshStandardMaterial({
    color: AMBER, roughness: 0.5, metalness: 0.05,
    emissive: AMBER, emissiveIntensity: 0.18,
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x0e0d10, roughness: 0.8 });

  const geoCache = new Map(); // shared geometry per keycap width
  const capGeo = w => {
    if (!geoCache.has(w)) geoCache.set(w, new RoundedBoxGeometry(w * U - GAP, CAP_H, U - GAP, 3, 0.016));
    return geoCache.get(w);
  };
  const stemGeo = new THREE.BoxGeometry(0.04, 0.05, 0.04);

  // Backlit legends — amber characters glowing through the caps. One canvas
  // texture per unique (label, width) pair, shared across repeats (shift, ctrl…).
  // Accent caps (Esc/Enter) get dark printed legends instead — light-on-amber
  // would wash out. See ANIMATION MAP §7 for the backlight-breathing recipe.
  const legendCache = new Map();
  function legendMaterial(label, w, accent) {
    const cacheKey = `${label}|${w}|${accent}`;
    if (legendCache.has(cacheKey)) return legendCache.get(cacheKey);
    const cw = Math.max(64, Math.round(64 * w));
    const cnv = document.createElement('canvas');
    cnv.width = cw;
    cnv.height = 64;
    const c2 = cnv.getContext('2d');
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    c2.font = `600 ${label.length > 2 ? 20 : 30}px monospace`;
    c2.fillStyle = accent ? '#3a2408' : '#ffb054';
    c2.fillText(label, cw / 2, 34);
    const tex = new THREE.CanvasTexture(cnv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.6,
      // backlit: the legend itself emits a soft amber — reads in the dark world
      emissive: accent ? 0x000000 : 0xff9500,
      emissiveMap: accent ? null : tex,
      emissiveIntensity: accent ? 0 : 0.85,
      toneMapped: false,
      depthWrite: false,
    });
    legendCache.set(cacheKey, mat);
    return mat;
  }

  const keys = [];        // keys[row][col] = { mesh, restY, row, col }
  const accentKeys = [];
  const REST_Y = 0.115 + CAP_H / 2 + 0.028;

  LAYOUT.forEach((row, r) => {
    const rowKeys = [];
    const z = -boardD / 2 + 0.07 + (r + 0.5) * U;
    let x = -15 * U / 2;
    row.forEach((w, c) => {
      const isAccent = (r === 0 && c === 0) || (r === 2 && c === row.length - 1); // Esc + Enter
      const isMod = !isAccent && (w > 1 || r === 4);
      const cap = new THREE.Mesh(capGeo(w), isAccent ? accentMat : isMod ? capDarkMat : capMat);
      cap.position.set(x + (w * U) / 2, REST_Y, z);
      cap.rotation.x = ROW_TILT[r];

      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = -CAP_H / 2 - 0.015;
      cap.add(stem); // stem travels with the cap — the "switch" underneath

      const label = legends && (LEGENDS[r]?.[c] || '');
      if (label) {
        const legend = new THREE.Mesh(
          new THREE.PlaneGeometry(w * U - GAP - 0.02, U - GAP - 0.02),
          legendMaterial(label, w, isAccent)
        );
        legend.position.y = CAP_H / 2 + 0.002; // just above the cap top
        legend.rotation.x = -Math.PI / 2;
        cap.add(legend); // child of the cap — travels and tilts with it
      }

      board.add(cap);
      rowKeys.push({ mesh: cap, restY: REST_Y, row: r, col: c });
      if (isAccent) accentKeys.push(cap);
      x += w * U;
    });
    keys.push(rowKeys);
  });

  // ------------------------------------------------------------------
  // Click sound (optional) — 4 ms filtered noise burst ≈ tactile switch
  // ------------------------------------------------------------------
  let audioCtx = null;
  let gestureSeen = false;
  if (sound && typeof window !== 'undefined') {
    window.addEventListener('pointerdown', () => { gestureSeen = true; }, { once: true, passive: true });
  }
  function click() {
    if (!sound || !gestureSeen) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      const len = audioCtx.sampleRate * 0.03;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 1.2;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
      src.connect(bp).connect(g).connect(audioCtx.destination);
      src.start(t0);
    } catch { /* audio unavailable — stay silent */ }
  }

  // ------------------------------------------------------------------
  // Animation state
  // ------------------------------------------------------------------
  const state = {
    typing,
    presses: [],          // { key, start } — in-flight press animations
    nextKeyAt: 0,         // elapsed time of the next ghost-typist keystroke
    burstLeft: 0,         // keystrokes remaining in the current burst
    glow: GLOW_BASE,
    glowX: 0,             // underglow light slides toward the last pressed key
    lastT: 0,             // clock of the most recent update() — pressKey stamps with this
  };

  function firePress(key, now) {
    // restart cleanly if this key is already mid-press
    state.presses = state.presses.filter(p => p.key !== key);
    state.presses.push({ key, start: now });
    state.glow = Math.min(GLOW_BASE + GLOW_KICK * 1.6, state.glow + GLOW_KICK);
    state.glowX = key.mesh.position.x;
    click();
  }

  // weighted random key: letter rows mostly, spacebar on burst ends
  function randomKey(burstEnd) {
    if (burstEnd && Math.random() < 0.7) return keys[4][3]; // spacebar
    const r = [1, 1, 2, 2, 2, 3, 0][Math.floor(Math.random() * 7)];
    const row = keys[r];
    return row[1 + Math.floor(Math.random() * (row.length - 2))];
  }

  group.userData.parts = { board, keys, accentKeys, underglow, glowStrip, cable };

  // pressKey(row, col) | pressKey('random') — returns false for a bad index
  group.userData.pressKey = (row, col) => {
    const key = row === 'random' ? randomKey(false) : keys[row]?.[col];
    if (!key) return false;
    firePress(key, state.lastT);
    return true;
  };

  group.userData.setTyping = on => { state.typing = on; };

  group.userData.update = (t, delta = 0.016) => {
    state.lastT = t;

    // --- ghost typist scheduling ---
    if (state.typing && t >= state.nextKeyAt) {
      if (state.burstLeft <= 0) {
        state.burstLeft = Math.round(rand(...BURST_KEYS));
        state.nextKeyAt = t + rand(...PAUSE);
      } else {
        state.burstLeft--;
        firePress(randomKey(state.burstLeft === 0), t);
        state.nextKeyAt = t + rand(...BURST_GAP);
      }
    }

    // --- key travel curves (see ANIMATION MAP §1) ---
    state.presses = state.presses.filter(({ key, start }) => {
      const p = (t - start) / PRESS_DUR;
      if (p >= 1) { key.mesh.position.y = key.restY; return false; }
      let y;
      if (p < 0.3) y = -KEY_TRAVEL * easeOutCubic(p / 0.3);          // strike
      else if (p < 0.5) y = -KEY_TRAVEL;                             // bottom-out
      else y = -KEY_TRAVEL * (1 - easeOutBack((p - 0.5) / 0.5));     // pop + bounce
      key.mesh.position.y = key.restY + y;
      return true;
    });

    // --- underglow decay + slide (§3) ---
    state.glow = Math.max(GLOW_BASE, state.glow - GLOW_DECAY * delta * (state.glow - GLOW_BASE + 0.1));
    underglow.intensity = state.glow;
    glowStrip.material.emissiveIntensity = state.glow;
    underglow.position.x += (state.glowX - underglow.position.x) * Math.min(1, delta * 8);
  };

  return group;
}

export function getModelInfo() {
  return {
    name: 'Mechanical Keyboard',
    dimensions: { width: 2.26, height: 0.28, depth: 0.98 }, // scene units, incl. tilt + caps
    suggestedScale: 1,
    tags: ['keyboard', 'mechanical', 'desk', 'peripheral', 'tactile', 'animated'],
  };
}

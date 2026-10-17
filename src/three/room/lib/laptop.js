// ============================================================================
// LAPTOP — low-poly laptop with live screen, keyboard, and a movable cursor
// ----------------------------------------------------------------------------
// ANIMATION MAP
//   cursor        — wanders the desktop on an idle path; userData.setCursor(x,y)
//                   (0..1 screen space) parks it; userData.freeCursor() resumes
//   screen        — CanvasTexture desktop (dock, windows, clock). Replace the
//                   whole display with userData.display(stringOrDrawFn):
//                     display('hello')            → big centered text
//                     display((ctx,w,h,t)=>{...}) → custom draw, called each frame
//                     display(null)               → back to dummy desktop
//   lid           — userData.setLid(true/false) or toggleLid(): eased open/close
//                   animation; screen dims and keyboard glow dies as it shuts
//   power LED     — soft amber pulse, 3s
// TUNING
//   LID_ANGLE 1.85 (rad from flat, ~106°) · SCREEN_W/H 512x320 canvas
//   CURSOR_SPEED 0.55 · KEY_GAP 0.02
// ============================================================================
import * as THREE from 'three';

const AMBER = 0xff9500;

export function getModelInfo() {
  return {
    name: 'Laptop',
    description: 'Low-poly laptop: keyboard, trackpad, live canvas screen with a wandering cursor. userData.display(...) puts anything on screen.',
    animationClips: ['cursor', 'screenClock', 'powerLED'],
  };
}

function key(w, d, mat) {
  const g = new THREE.BoxGeometry(w, 0.06, d);
  return new THREE.Mesh(g, mat);
}

export function createModel() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.45, metalness: 0.6, flatShading: true, emissive: AMBER, emissiveIntensity: 0.03 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.6, metalness: 0.3 });
  const keyMat  = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.7, metalness: 0.1 });

  // ---- base ----
  const BASE_W = 4.4, BASE_D = 3.0, BASE_H = 0.16;
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE_W, BASE_H, BASE_D), bodyMat);
  base.position.y = BASE_H / 2 + 0.06;
  group.add(base);
  // little rubber feet
  for (const [x, z] of [[-1.9, -1.2], [1.9, -1.2], [-1.9, 1.2], [1.9, 1.2]]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8), darkMat);
    f.position.set(x, 0.03, z);
    group.add(f);
  }

  // ---- keyboard ----
  const kb = new THREE.Group();
  const KEY = 0.26, GAP = 0.02, ROWS = 5, COLS = 14;
  const kbW = COLS * (KEY + GAP);
  for (let r = 0; r < ROWS; r++) {
    let x = -kbW / 2 + KEY / 2;
    for (let c = 0; c < COLS; c++) {
      let w = KEY;
      if (r === 0 && c === 0) w = KEY * 1.5;              // esc-ish
      if (r === 4 && c === 5) w = KEY * 4 + GAP * 3;      // spacebar
      if (r === 4 && c > 5 && c < 9) { x += 0; continue } // eaten by spacebar
      const k = key(w, KEY * 0.85, keyMat);
      k.position.set(x + (w - KEY) / 2, BASE_H + 0.09, -BASE_D / 2 + 0.55 + r * (KEY + GAP));
      kb.add(k);
      x += w + GAP;
    }
  }
  kb.position.x = 0;
  group.add(kb);

  // trackpad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.95), darkMat);
  pad.position.set(0, BASE_H + 0.08, BASE_D / 2 - 0.62);
  group.add(pad);

  // power LED
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x332200, emissive: AMBER, emissiveIntensity: 1 });
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.05), ledMat);
  led.position.set(BASE_W / 2 - 0.3, BASE_H + 0.075, BASE_D / 2 - 0.15);
  group.add(led);

  // ---- lid + screen ----
  const LID_ANGLE = 1.85;
  const lid = new THREE.Group();
  lid.position.set(0, BASE_H + 0.06, -BASE_D / 2 + 0.05);
  const LID_H = 2.9;
  const lidPanel = new THREE.Mesh(new THREE.BoxGeometry(BASE_W, LID_H, 0.1), bodyMat);
  lidPanel.position.y = LID_H / 2;
  lid.add(lidPanel);
  // hinge cylinder
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, BASE_W * 0.85, 10), darkMat);
  hinge.rotation.z = Math.PI / 2;
  lid.add(hinge);

  // screen canvas
  const SW = 512, SH = 320;
  const canvas = document.createElement('canvas');
  canvas.width = SW; canvas.height = SH;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(BASE_W - 0.35, LID_H - 0.35), screenMat);
  screen.position.set(0, LID_H / 2, 0.051 + 0.005);
  lid.add(screen);
  // bezel face (behind screen)
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(BASE_W - 0.08, LID_H - 0.08), darkMat);
  bezel.position.set(0, LID_H / 2, 0.051);
  lid.add(bezel);

  lid.rotation.x = -(LID_ANGLE - Math.PI / 2); // open: 0 = vertical, lean back past 90°
  group.add(lid);

  // faint screen glow onto the keyboard
  const glow = new THREE.PointLight(0x88aaff, 0.5, 5, 2);
  glow.position.set(0, 1.6, 0.4);
  group.add(glow);

  // ---- screen drawing ----
  const cursor = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, parked: false, next: 0 };
  let custom = null; // string | function | null

  function drawDesktop(t) {
    // wallpaper
    const grad = ctx.createLinearGradient(0, 0, SW, SH);
    grad.addColorStop(0, '#26304a'); grad.addColorStop(1, '#40301c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, SW, SH);
    // sun blob
    ctx.fillStyle = 'rgba(255,149,0,0.18)';
    ctx.beginPath(); ctx.arc(SW * 0.78, SH * 0.3, 70, 0, 7); ctx.fill();
    // fake window
    ctx.fillStyle = '#1d1f26'; ctx.fillRect(40, 46, 260, 170);
    ctx.fillStyle = '#2b2e38'; ctx.fillRect(40, 46, 260, 22);
    ctx.fillStyle = '#ff9500'; ctx.beginPath(); ctx.arc(52, 57, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(68, 57, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a3d47';
    for (let i = 0; i < 6; i++) ctx.fillRect(54, 84 + i * 20, 180 - (i % 3) * 40, 8);
    // blinking terminal caret
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#ff9500'; ctx.fillRect(54, 84 + 6 * 20, 10, 12); }
    // dock
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(SW / 2 - 110, SH - 34, 220, 26);
    const cols = ['#ff9500', '#7aa2ff', '#7fd18a', '#d17fd1', '#e5c07b'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(SW / 2 - 98 + i * 44, SH - 30, 18, 18); });
    // menu bar + clock
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, SW, 18);
    ctx.fillStyle = '#ccc'; ctx.font = '12px monospace';
    const s = Math.floor(t) % 60, m = Math.floor(t / 60) % 60;
    ctx.fillText(`⌘  fable os`, 8, 13);
    ctx.fillText(`${String(10 + Math.floor(t / 3600)).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, SW - 70, 13);
  }

  function drawCursor() {
    const x = cursor.x * SW, y = cursor.y * SH;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + 15); ctx.lineTo(x + 4, y + 11);
    ctx.lineTo(x + 7, y + 17); ctx.lineTo(x + 9.5, y + 15.5); ctx.lineTo(x + 6.5, y + 10);
    ctx.lineTo(x + 11, y + 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  const CURSOR_SPEED = 0.55;
  function render(t, dt) {
    if (typeof custom === 'function') custom(ctx, SW, SH, t);
    else if (typeof custom === 'string') {
      ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, SW, SH);
      ctx.fillStyle = '#ff9500'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 42px monospace';
      const lines = custom.split('\n');
      lines.forEach((l, i) => ctx.fillText(l, SW / 2, SH / 2 + (i - (lines.length - 1) / 2) * 52));
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    } else drawDesktop(t);

    // cursor wander
    if (!cursor.parked) {
      if (t > cursor.next) {
        cursor.tx = 0.1 + Math.abs(Math.sin(t * 1.7)) * 0.8;
        cursor.ty = 0.12 + Math.abs(Math.cos(t * 1.1)) * 0.75;
        cursor.next = t + 1.5 + Math.abs(Math.sin(t * 3)) * 2;
      }
      cursor.x += (cursor.tx - cursor.x) * Math.min(1, dt * 2.2 * CURSOR_SPEED * 4);
      cursor.y += (cursor.ty - cursor.y) * Math.min(1, dt * 2.2 * CURSOR_SPEED * 4);
    }
    drawCursor();
    tex.needsUpdate = true;
  }
  render(0, 0.016);

  // lid open/close: 1 = fully open (LID_ANGLE), 0 = closed flat on the base
  const OPEN_ROT = -(LID_ANGLE - Math.PI / 2), CLOSED_ROT = Math.PI / 2 - 0.04;
  let lidTarget = OPEN_ROT;
  group.userData.setLid = (open) => { lidTarget = open ? OPEN_ROT : CLOSED_ROT; };
  group.userData.toggleLid = () => { lidTarget = lidTarget === OPEN_ROT ? CLOSED_ROT : OPEN_ROT; };

  group.userData.update = (t, dt) => {
    render(t, dt || 0.016);
    ledMat.emissiveIntensity = 0.7 + 0.3 * Math.sin((t / 3) * Math.PI * 2);
    // ease lid toward target; screen dims as it shuts
    lid.rotation.x += (lidTarget - lid.rotation.x) * Math.min(1, (dt || 0.016) * 4);
    const openness = THREE.MathUtils.clamp((CLOSED_ROT - lid.rotation.x) / (CLOSED_ROT - OPEN_ROT), 0, 1);
    screenMat.color.setScalar(0.15 + 0.85 * openness);
    glow.intensity = 0.5 * openness;
  };
  group.userData.display = (what) => { custom = what; };
  group.userData.setCursor = (x, y) => { cursor.parked = true; cursor.x = cursor.tx = x; cursor.y = cursor.ty = y; };
  group.userData.freeCursor = () => { cursor.parked = false; };
  group.userData.parts = { lid, screen, keyboard: kb, canvas, ctx };

  group.position.y = -1.2;
  return group;
}

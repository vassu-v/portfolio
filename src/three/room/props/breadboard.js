// Maker's breadboard with an ESP32 dev board, jumpers, LEDs and resistors —
// procedural, real meters. Origin: bottom center, Y-up, long axis along X,
// front (row j side) faces +Z.
// createBreadboard() -> Group, 0.165 W x ~0.02 H (board 0.0095) x 0.055 D
//   group.userData.leds = [MeshStandardMaterial x3]  (red, green, amber) —
//     emissive materials; animate .emissiveIntensity to blink.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const BW = 0.165, BD = 0.055, BH = 0.0095;
const PITCH = 0.00254;
const TOP = BH;

// hole grid (meters): 63 columns along X, rows a..j across Z, 2 rails per side
const colX = (c) => -0.0787 + c * PITCH;
const ROWS = { a: -0.01397, b: -0.01143, c: -0.00889, d: -0.00635, e: -0.00381, f: 0.00381, g: 0.00635, h: 0.00889, i: 0.01143, j: 0.01397 };
const RAIL = { bp: -0.022, bn: -0.0195, fn: 0.0195, fp: 0.022 };
const rowZ = (r) => (r in ROWS ? ROWS[r] : RAIL[r]);
const hole = (c, r, y = TOP) => new THREE.Vector3(colX(c), y, rowZ(r));

function shadowed(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function prep(g) {
  g = g.index ? g.toNonIndexed() : g;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  return g;
}
const merge = (list) => mergeGeometries(list.map(prep));

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function topTexture() {
  const PX = 8; // px per mm
  const c = document.createElement('canvas');
  c.width = Math.round(BW * 1000 * PX);
  c.height = Math.round(BD * 1000 * PX);
  const x = c.getContext('2d');
  x.fillStyle = '#efece4';
  x.fillRect(0, 0, c.width, c.height);
  const P = (mx, mz) => [(mx * 1000 + BW * 500) * PX, (mz * 1000 + BD * 500) * PX];
  // centre channel
  {
    const [, y0] = P(0, -0.0012);
    const [, y1] = P(0, 0.0012);
    const g = x.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#d9d5cc');
    g.addColorStop(0.5, '#bdb8ae');
    g.addColorStop(1, '#d9d5cc');
    x.fillStyle = g;
    x.fillRect(P(-0.08, 0)[0], y0, (0.16 * 1000) * PX, y1 - y0);
  }
  // rail stripes
  const stripe = (z, col) => {
    x.fillStyle = col;
    const [x0, y] = P(-0.077, z);
    x.fillRect(x0, y - 0.25 * PX, 0.154 * 1000 * PX, 0.5 * PX);
  };
  stripe(-0.0245, '#c8352c');
  stripe(-0.0168, '#2c58b8');
  stripe(0.0168, '#2c58b8');
  stripe(0.0245, '#c8352c');
  // holes
  const s = 1.05 * PX;
  const dot = (mx, mz) => {
    const [px, py] = P(mx, mz);
    x.fillStyle = '#a9a49a';
    x.fillRect(px - s / 2 - 1, py - s / 2 - 1, s + 2, s + 2);
    x.fillStyle = '#1d1c1a';
    x.fillRect(px - s / 2, py - s / 2, s, s);
  };
  for (let col = 0; col < 63; col++) for (const r of Object.values(ROWS)) dot(colX(col), r);
  for (let k = 0; k < 50; k++) {
    if (k % 5 === 4) continue; // rails come in groups of 5
    const mx = -0.0705 + k * PITCH;
    for (const r of Object.values(RAIL)) dot(mx, r);
  }
  // row letters / column numbers
  x.fillStyle = '#8f8a80';
  x.font = `${Math.round(1.5 * PX)}px sans-serif`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  'abcde'.split('').forEach((l) => x.fillText(l, P(-0.0812, 0)[0], P(0, ROWS[l])[1]));
  'fghij'.split('').forEach((l) => x.fillText(l, P(-0.0812, 0)[0], P(0, ROWS[l])[1]));
  for (let col = 0; col < 63; col += 5) {
    x.fillText(String(col + 1), P(colX(col), 0)[0], P(0, -0.0168)[1] + 1.6 * PX);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function resistorTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#d8c7a0';
  x.fillRect(0, 0, 8, 128);
  // 220R: red red brown, gold tolerance (v runs along the body)
  [[30, '#b3261e'], [46, '#b3261e'], [62, '#5a3416'], [92, '#c9a03c']].forEach(([y, col]) => {
    x.fillStyle = col;
    x.fillRect(0, y, 8, 9);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createBreadboard() {
  const group = new THREE.Group();
  group.name = 'Breadboard';

  const plasticSide = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.62 });
  const plasticTop = new THREE.MeshStandardMaterial({ map: topTexture(), roughness: 0.62 });
  const pcb = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.55, metalness: 0.1 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cbce, roughness: 0.32, metalness: 1 });
  const wireMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 });
  const resMat = new THREE.MeshStandardMaterial({ map: resistorTexture(), roughness: 0.55 });

  // board body: one mesh, textured top group
  {
    const g = new THREE.BoxGeometry(BW, BH, BD);
    g.translate(0, BH / 2, 0);
    group.add(shadowed(new THREE.Mesh(g, [plasticSide, plasticSide, plasticTop, plasticSide, plasticSide, plasticSide])));
  }

  const dark = [];
  const metals = [];

  // ---------------------------------------------------------------- ESP32 dev board
  const C0 = 3; // first header column
  const PINS = 15;
  const bx = (colX(C0) + colX(C0 + PINS - 1)) / 2;
  const HDR = 0.0025;
  const PCB_Y = TOP + HDR;
  const PCB_T = 0.0016;
  const PL = 0.052, PWID = 0.0225;
  for (const r of ['c', 'h']) {
    dark.push(box(PINS * PITCH, HDR, PITCH, bx, TOP + HDR / 2, rowZ(r)));
    for (let k = 0; k < PINS; k++) metals.push(box(0.0007, 0.0012, 0.0007, colX(C0 + k), PCB_Y + PCB_T + 0.0005, rowZ(r)));
  }
  dark.push(box(PL, PCB_T, PWID, bx, PCB_Y + PCB_T / 2, 0));
  // WROOM module at +X end, antenna overhanging slightly
  const modX = bx + PL / 2 - 0.0255 / 2 + 0.003;
  const MOD_Y = PCB_Y + PCB_T;
  dark.push(box(0.0255, 0.0008, 0.018, modX, MOD_Y + 0.0004, 0));
  metals.push(box(0.0176, 0.0024, 0.0158, modX - 0.0035, MOD_Y + 0.0008 + 0.0012, 0));
  // chips, regulator, buttons
  dark.push(box(0.005, 0.001, 0.005, bx - 0.006, MOD_Y + 0.0005, 0.004));
  dark.push(box(0.0065, 0.0016, 0.0035, bx - 0.004, MOD_Y + 0.0008, -0.008));
  for (const z of [-0.009, 0.009]) {
    metals.push(box(0.0035, 0.0012, 0.0035, bx - PL / 2 + 0.006, MOD_Y + 0.0006, z));
    dark.push(box(0.0016, 0.0007, 0.0016, bx - PL / 2 + 0.006, MOD_Y + 0.0015, z));
  }
  // micro-USB port at -X end
  metals.push(box(0.0055, 0.0026, 0.0075, bx - PL / 2 + 0.0022, MOD_Y + 0.0013, 0));

  group.add(shadowed(new THREE.Mesh(merge(dark), pcb)));

  // ---------------------------------------------------------------- jumper wires
  const wireGeos = [];
  const wire = (a, b, h, color) => {
    const up = (p, dy) => p.clone().setY(TOP + dy);
    const mid = a.clone().lerp(b, 0.5).setY(TOP + h);
    const pts = [up(a, -0.0015), up(a, 0.002), mid, up(b, 0.002), up(b, -0.0015)];
    const len = a.distanceTo(b);
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), Math.max(10, Math.round(len * 500)), 0.00065, 6, false);
    const col = new THREE.Color(color);
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.toArray(cols, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    wireGeos.push(g);
  };
  wire(hole(4, 'a'), hole(5, 'bp'), 0.006, 0xc4261d);
  wire(hole(6, 'j'), hole(7, 'fn'), 0.005, 0x1b1b1b);
  wire(hole(10, 'j'), hole(52, 'j'), 0.02, 0xe0b416);
  wire(hole(12, 'j'), hole(46, 'j'), 0.013, 0x2457c9);
  wire(hole(15, 'b'), hole(53, 'b'), 0.014, 0x2f9e4f);
  wire(hole(42, 'a'), hole(58, 'bn'), 0.008, 0x1b1b1b);
  group.add(shadowed(new THREE.Mesh(merge(wireGeos), wireMat)));

  // ---------------------------------------------------------------- resistors (anode feed)
  const resGeos = [];
  const lead = (pts) => metals.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.0003, 5, false));
  const resistor = (c0, c1, r) => {
    const a = hole(c0, r), b = hole(c1, r);
    const H = TOP + 0.0032;
    const prof = [];
    const L = 0.0064;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const bulge = 0.00105 + 0.00022 * (Math.cos(t * Math.PI * 2) * 0.5 + 0.5);
      prof.push(new THREE.Vector2(i === 0 || i === 10 ? 0.0003 : bulge, -L / 2 + t * L));
    }
    const g = new THREE.LatheGeometry(prof, 12);
    g.rotateZ(-Math.PI / 2);
    g.translate((a.x + b.x) / 2, H, a.z);
    resGeos.push(g);
    const e0 = new THREE.Vector3((a.x + b.x) / 2 - L / 2, H, a.z);
    const e1 = new THREE.Vector3((a.x + b.x) / 2 + L / 2, H, a.z);
    lead([e0, new THREE.Vector3(a.x + 0.0006, H, a.z), new THREE.Vector3(a.x, H - 0.0012, a.z), a.clone().setY(TOP - 0.001)]);
    lead([e1, new THREE.Vector3(b.x - 0.0006, H, b.z), new THREE.Vector3(b.x, H - 0.0012, b.z), b.clone().setY(TOP - 0.001)]);
  };
  resistor(36, 40, 'c');
  resistor(44, 48, 'd');
  group.add(shadowed(new THREE.Mesh(merge(resGeos), resMat)));

  // ---------------------------------------------------------------- LEDs (separate meshes, blinkable)
  const leds = [];
  const LEG = 0.0042;
  [[40, 0xff2a1a], [46, 0x2bff5a], [52, 0xffa21a]].forEach(([c, hex]) => {
    const a = hole(c, 'g'), b = hole(c + 1, 'g');
    const cx = (a.x + b.x) / 2;
    for (const p of [a, b]) {
      const leg = new THREE.CylinderGeometry(0.00024, 0.00024, LEG + 0.001, 5);
      leg.translate(p.x, TOP + (LEG - 0.001) / 2, p.z);
      metals.push(leg);
    }
    const y0 = TOP + LEG;
    const flange = new THREE.CylinderGeometry(0.0029, 0.0029, 0.001, 20);
    flange.translate(cx, y0 + 0.0005, a.z);
    const body = new THREE.CylinderGeometry(0.0025, 0.0025, 0.0055, 20, 1, true);
    body.translate(cx, y0 + 0.001 + 0.00275, a.z);
    const dome = new THREE.SphereGeometry(0.0025, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(cx, y0 + 0.0065, a.z);
    const col = new THREE.Color(hex);
    const mat = new THREE.MeshStandardMaterial({
      color: col.clone().multiplyScalar(0.55),
      emissive: col,
      emissiveIntensity: 0.9,
      roughness: 0.22,
      metalness: 0,
    });
    const led = shadowed(new THREE.Mesh(merge([flange, body, dome]), mat));
    led.castShadow = true;
    group.add(led);
    leds.push(mat);
  });

  group.add(shadowed(new THREE.Mesh(merge(metals), metal)));

  group.userData.leds = leds;
  return group;
}

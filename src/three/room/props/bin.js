// Perforated-steel wastepaper bin + crumpled paper balls — procedural, real meters.
// Origin: bottom center, Y-up, front faces +Z.
// createWasteBin()            -> Group, 0.25 dia (top) x 0.30 H, open top, hollow
// createPaperBall({ seed })   -> Mesh,  ~0.06 dia crumpled ruled paper, resting on y = 0
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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

function rng(seed) {
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// staggered round perforations; white = metal, black = hole
function perfTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, S, S);
  x.fillStyle = '#000';
  const n = 4, cell = S / n, r = cell * 0.31;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i <= n; i++) {
      const ox = (j % 2) * cell * 0.5;
      x.beginPath();
      x.arc(i * cell + ox, j * cell + cell / 2, r, 0, Math.PI * 2);
      x.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function createWasteBin() {
  const group = new THREE.Group();
  group.name = 'WasteBin';

  const R_TOP = 0.123, R_BOT = 0.106, H = 0.3, BAND = 0.024;
  const color = 0x1f1f21;

  const alphaMap = perfTexture();
  const pitch = 0.0095; // hole pitch (m)
  alphaMap.repeat.set(Math.round((Math.PI * 2 * 0.115) / (pitch * 4)), Math.round((H - BAND - 0.006) / (pitch * 4)));
  const perfMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.55,
    roughness: 0.5,
    alphaMap,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  const solidMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45, side: THREE.DoubleSide });

  // perforated wall (open cylinder, both faces visible)
  const wallH = H - BAND - 0.004;
  const rAt = (y) => THREE.MathUtils.lerp(R_BOT, R_TOP, y / H);
  const wall = new THREE.CylinderGeometry(rAt(H - 0.004), rAt(BAND), wallH, 72, 1, true);
  wall.translate(0, BAND + wallH / 2, 0);
  group.add(shadowed(new THREE.Mesh(wall, perfMat)));

  // solid parts: base band, floor, rolled top rim, band bead
  const solids = [];
  const band = new THREE.CylinderGeometry(rAt(BAND), R_BOT, BAND, 72, 1, true);
  band.translate(0, BAND / 2, 0);
  solids.push(band);
  const floor = new THREE.CircleGeometry(R_BOT - 0.0005, 72);
  floor.rotateX(-Math.PI / 2);
  floor.translate(0, 0.004, 0);
  solids.push(floor);
  const under = new THREE.CircleGeometry(R_BOT - 0.0005, 72);
  under.rotateX(Math.PI / 2);
  under.translate(0, 0.0004, 0);
  solids.push(under);
  const rim = new THREE.TorusGeometry(R_TOP - 0.0005, 0.0035, 8, 96);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, H - 0.0035, 0);
  solids.push(rim);
  const bead = new THREE.TorusGeometry(rAt(BAND) + 0.0003, 0.0018, 6, 96);
  bead.rotateX(Math.PI / 2);
  bead.translate(0, BAND, 0);
  solids.push(bead);
  const foot = new THREE.TorusGeometry(R_BOT - 0.0012, 0.0016, 6, 96);
  foot.rotateX(Math.PI / 2);
  foot.translate(0, 0.0016, 0);
  solids.push(foot);
  group.add(shadowed(new THREE.Mesh(mergeGeometries(solids.map(prep)), solidMat)));

  return group;
}

// ---------------------------------------------------------------- paper ball

let paperTex = null;
function paperTexture() {
  if (paperTex) return paperTex;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#f1eee6';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(90,130,190,0.3)';
  x.lineWidth = 2;
  for (let y = 20; y < 512; y += 34) {
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(512, y);
    x.stroke();
  }
  x.strokeStyle = 'rgba(205,80,80,0.32)';
  x.beginPath();
  x.moveTo(90, 0);
  x.lineTo(90, 512);
  x.stroke();
  // faint pencil scribble
  x.strokeStyle = 'rgba(60,60,60,0.25)';
  x.lineWidth = 1.5;
  for (let l = 0; l < 4; l++) {
    x.beginPath();
    for (let k = 0; k < 18; k++) x.lineTo(120 + k * 18, 52 + l * 34 + Math.sin(k * 1.7 + l) * 5);
    x.stroke();
  }
  paperTex = new THREE.CanvasTexture(c);
  paperTex.colorSpace = THREE.SRGBColorSpace;
  paperTex.wrapS = paperTex.wrapT = THREE.RepeatWrapping;
  return paperTex;
}

let paperMat = null;
export function createPaperBall({ seed = 1 } = {}) {
  const rnd = rng(seed * 7919 + 13);
  const R = 0.03;
  let g = new THREE.IcosahedronGeometry(1, 5);
  g.deleteAttribute('normal');
  const p = g.attributes.position;
  // displacement field: ridged plane waves (creases) + broad lumps
  const waves = [];
  for (let k = 0; k < 9; k++) {
    const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    waves.push({ d, f: 2 + rnd() * 5, ph: rnd() * 6.28, a: 0.035 + rnd() * 0.045 });
  }
  const lumps = [];
  for (let k = 0; k < 5; k++) {
    lumps.push({ d: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(), a: (rnd() - 0.5) * 0.25 });
  }
  const squash = new THREE.Vector3(0.92 + rnd() * 0.16, 0.86 + rnd() * 0.12, 0.92 + rnd() * 0.16);
  const v = new THREE.Vector3();
  const field = (dir) => {
    let r = 1;
    for (const w of waves) r -= w.a * Math.abs(Math.sin(w.f * dir.dot(w.d) + w.ph));
    for (const l of lumps) r += l.a * Math.max(0, dir.dot(l.d)) ** 3;
    return r;
  };
  // IcosahedronGeometry is non-indexed: identical positions get identical
  // displacement, so the faceted crumple stays watertight.
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const r = field(v) * R;
    p.setXYZ(i, v.x * r * squash.x, v.y * r * squash.y, v.z * r * squash.z);
  }
  g.computeVertexNormals(); // per-face normals -> crisp crumple facets
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y, 0);
  // fit to ~0.06 across
  g.computeBoundingBox();
  const size = g.boundingBox.getSize(new THREE.Vector3());
  const s = 0.06 / Math.max(size.x, size.z);
  g.scale(s, s, s);
  g.rotateY(rnd() * Math.PI * 2);
  g.computeBoundingBox();
  g.computeBoundingSphere();

  if (!paperMat) paperMat = new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: 0.95, metalness: 0 });
  const m = shadowed(new THREE.Mesh(g, paperMat));
  m.name = 'PaperBall';
  return m;
}

// Small polished-gold cup trophy on a dark stepped base with an engraved
// plaque — procedural, real meters. Origin: bottom center, Y-up, plaque faces +Z.
// createTrophy() -> Group, ~0.115 W (handle to handle) x 0.18 H x 0.075 D
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PLAQUE_TEXT = "QUANTUM QUBIT '25 · 3RD";

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

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x0 = -w / 2, y0 = -h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r);
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h);
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

// rounded block standing on y = y0, footprint w x d, height h
function block(w, d, h, r, bevel, y0 = 0) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, d - bevel * 2, r), {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 4,
  });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

function plaqueTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 240;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1024, 240);
  g.addColorStop(0, '#c9a24f');
  g.addColorStop(0.5, '#e6c977');
  g.addColorStop(1, '#b8903f');
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 240);
  x.strokeStyle = '#6b4f1c';
  x.lineWidth = 6;
  x.strokeRect(18, 18, 1024 - 36, 240 - 36);
  x.fillStyle = '#3b2a0e';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  let size = 96;
  do {
    x.font = `600 ${size}px "Instrument Serif", Georgia, "Times New Roman", serif`;
    size -= 2;
  } while (x.measureText(PLAQUE_TEXT).width > 900 && size > 20);
  x.fillText(PLAQUE_TEXT, 512, 124);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createTrophy() {
  const group = new THREE.Group();
  group.name = 'Trophy';

  const gold = new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: 1, roughness: 0.25 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x151414, metalness: 0.1, roughness: 0.32 });
  const plaqueMat = new THREE.MeshStandardMaterial({ map: plaqueTexture(), metalness: 0.75, roughness: 0.35 });

  // ---------------------------------------------------------------- base
  const B1 = 0.03, B2 = 0.012;
  const base = merge([block(0.075, 0.075, B1, 0.004, 0.0015), block(0.058, 0.058, B2, 0.003, 0.0012, B1 - 0.0004)]);
  group.add(shadowed(new THREE.Mesh(base, baseMat)));

  const plaque = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.0135, 0.0008), [
    gold, gold, gold, gold, plaqueMat, gold,
  ]));
  plaque.position.set(0, B1 / 2, 0.075 / 2 + 0.0003);
  group.add(plaque);

  // ---------------------------------------------------------------- cup (lathe) + handles
  const Y0 = B1 + B2 - 0.0008;
  const prof = [
    [0.0, 0.0],
    [0.021, 0.0],
    [0.0222, 0.0015],
    [0.0215, 0.0038],
    [0.0135, 0.0075],
    [0.0062, 0.013],
    [0.0048, 0.022],
    [0.0088, 0.0285],
    [0.009, 0.031],
    [0.0052, 0.036],
    [0.0048, 0.044],
    [0.0085, 0.05],
    [0.019, 0.06],
    [0.0285, 0.075],
    [0.0345, 0.095],
    [0.0375, 0.115],
    [0.0392, 0.13],
    [0.0402, 0.1345],
    [0.0396, 0.1368],
    [0.038, 0.1372],
    [0.0368, 0.1355],
    [0.0362, 0.13],
    [0.0345, 0.112],
    [0.031, 0.092],
    [0.022, 0.072],
    [0.008, 0.06],
    [0.0, 0.0585],
  ].map(([r, y]) => new THREE.Vector2(r, y + Y0));
  const parts = [new THREE.LatheGeometry(prof, 48)];

  // outer radius of the bowl at height y (outer half of the profile only)
  const outer = prof.slice(11, 18);
  const rAt = (y) => {
    for (let i = 0; i < outer.length - 1; i++) {
      const a = outer[i], b = outer[i + 1];
      if (y >= a.y && y <= b.y) return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
    }
    return outer[outer.length - 1].x;
  };
  for (const s of [-1, 1]) {
    const yTop = Y0 + 0.118, yBot = Y0 + 0.08;
    const pts = [
      [rAt(yTop) - 0.002, yTop],
      [rAt(yTop) + 0.012, yTop + 0.004],
      [0.0565, yTop - 0.006],
      [0.0575, Y0 + 0.098],
      [0.049, Y0 + 0.086],
      [rAt(yBot) + 0.006, yBot - 0.001],
      [rAt(yBot) - 0.002, yBot],
    ].map(([x, y]) => new THREE.Vector3(s * x, y, 0));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const tube = new THREE.TubeGeometry(curve, 28, 0.0026, 8, false);
    // squash to a flatter ribbon-like ear (thinner in Z)
    tube.scale(1, 1, 0.75);
    parts.push(tube);
    // small ball caps closing the tube ends (buried in the bowl, but tidy)
    for (const p of [pts[0], pts[pts.length - 1]]) {
      const cap = new THREE.SphereGeometry(0.0028, 10, 6);
      cap.translate(p.x, p.y, p.z);
      parts.push(cap);
    }
  }
  group.add(shadowed(new THREE.Mesh(merge(parts), gold)));

  return group;
}

function merge(list) {
  return mergeGeometries(list.map(prep));
}

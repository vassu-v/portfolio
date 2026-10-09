// Speckled stoneware pen cup with pencils, pens, a highlighter and a steel
// ruler fanned out of it — procedural, real meters.
// Origin: bottom center, Y-up, front faces +Z.
// createPenCup() -> Group, cup 0.075 dia x 0.10 H (contents reach ~0.18)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const CUP_H = 0.1, R_OUT = 0.0375, FLOOR = 0.008, R_IN = 0.0338;

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

function tint(g, hex) {
  g = prep(g);
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

function cyl(r0, r1, h, y0, seg = 14, open = false) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, open);
  g.translate(0, y0 + h / 2, 0);
  return g;
}

function cupTexture(nPts) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#e7e1d5';
  x.fillRect(0, 0, 512, 512);
  // unglazed clay foot: first profile segments (v near 0 -> canvas bottom)
  const footV = 2.6 / (nPts - 1);
  x.fillStyle = '#b88f6c';
  x.fillRect(0, 512 * (1 - footV), 512, 512 * footV);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    const v = rnd();
    if (v < footV) continue;
    x.fillStyle = `rgba(${60 + rnd() * 40},${45 + rnd() * 30},${35},${0.35 + rnd() * 0.5})`;
    const r = 0.6 + rnd() * 1.6;
    x.beginPath();
    x.arc(rnd() * 512, (1 - v) * 512, r, 0, 7);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function rulerTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#d9dadc';
  x.fillRect(0, 0, 1024, 96);
  x.fillStyle = '#2b2b2b';
  for (let mm = 0; mm <= 150; mm++) {
    const px = 12 + mm * (1000 / 150);
    const len = mm % 10 === 0 ? 34 : mm % 5 === 0 ? 24 : 14;
    x.fillRect(px - 0.8, 0, 1.6, len);
  }
  x.font = '18px sans-serif';
  x.textAlign = 'center';
  for (let cm = 1; cm < 15; cm++) x.fillText(String(cm), 12 + cm * (1000 / 15), 58);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// place an item built along +Y (bottom at origin) so its bottom sits on the
// cup floor at polar (rb, az) and it leans outward along az, touching the rim.
function placement(rb, az, rItem, extraTilt = 0) {
  const tan = (R_IN - rItem - rb) / (CUP_H - FLOOR) + extraTilt;
  const th = Math.atan(tan);
  const dir = new THREE.Vector3(Math.sin(th) * Math.cos(az), Math.cos(th), Math.sin(th) * Math.sin(az));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const p = new THREE.Vector3(rb * Math.cos(az), FLOOR + rItem * Math.sin(th) + 0.0003, rb * Math.sin(az));
  return new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1));
}

export function createPenCup() {
  const group = new THREE.Group();
  group.name = 'PenCup';

  // ---------------------------------------------------------------- cup
  const prof = [
    [0.0, 0.0],
    [R_OUT - 0.004, 0.0],
    [R_OUT - 0.0012, 0.0009],
    [R_OUT - 0.0004, 0.004],
    [R_OUT, CUP_H - 0.003],
    [R_OUT - 0.0006, CUP_H - 0.0006],
    [R_OUT - 0.0019, CUP_H],
    [R_IN + 0.0003, CUP_H - 0.0007],
    [R_IN, CUP_H - 0.003],
    [R_IN - 0.0008, FLOOR + 0.003],
    [R_IN - 0.0035, FLOOR],
    [0.0, FLOOR],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const cupMat = new THREE.MeshStandardMaterial({ map: cupTexture(prof.length), roughness: 0.62, metalness: 0 });
  const cupGeo = new THREE.LatheGeometry(prof, 48);
  // lathe winds inward-facing for an outward-going profile: flip
  {
    const idx = cupGeo.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    cupGeo.computeVertexNormals();
  }
  group.add(shadowed(new THREE.Mesh(cupGeo, cupMat)));

  // ---------------------------------------------------------------- contents
  const painted = [];
  const metalParts = [];

  const add = (list, geos, m) => {
    for (const g of geos) {
      g.applyMatrix4(m);
      list.push(g);
    }
  };

  // pencil: hex body, sharpened wood cone, graphite tip (tip up)
  const pencil = (m, paint, len = 0.15) => {
    const r = 0.0036;
    const body = prep(new THREE.CylinderGeometry(r, r, len, 6));
    body.translate(0, len / 2, 0);
    body.computeVertexNormals(); // flat facets on the hex
    add(painted, [tint(body, paint), tint(cyl(r * 0.95, 0.0012, 0.017, len, 6), 0xd8b088), tint(cyl(0.0012, 0.00005, 0.004, len + 0.017, 8), 0x2e2e30)], m);
  };
  // click pen: body, grip, clip + clicker in metal (tip down in the cup)
  const pen = (m, color, len = 0.135) => {
    const r = 0.0046;
    add(painted, [tint(cyl(0.0032, r, 0.012, 0, 14), 0x1a1a1c), tint(cyl(r, r, len - 0.012, 0.012, 14), color), tint(cyl(r, 0.0035, 0.004, len, 14), color)], m);
    const clip = new THREE.BoxGeometry(0.0022, 0.045, 0.0012);
    clip.translate(0, len - 0.024, r + 0.0006);
    add(metalParts, [cyl(0.0022, 0.0022, 0.007, len + 0.003, 12), clip], m);
  };
  // chisel highlighter with cap
  const highlighter = (m) => {
    const r = 0.0072;
    add(painted, [tint(cyl(r, r, 0.088, 0, 16), 0xf3d23a), tint(cyl(r + 0.0006, r + 0.0006, 0.034, 0.088, 16), 0xff7a1a), tint(cyl(r + 0.0006, 0.004, 0.004, 0.122, 16), 0xff7a1a)], m);
  };

  pencil(placement(0.016, 0.5, 0.0036), 0xe9b326, 0.15);
  pencil(placement(0.012, 2.3, 0.0036, 0.05), 0x2c2c2e, 0.138);
  pen(placement(0.015, 3.6, 0.0046), 0x1e3f7a);
  pen(placement(0.006, 1.35, 0.0046, 0.08), 0xe8e6e1, 0.142);
  highlighter(placement(0.018, 4.7, 0.0072));

  // steel ruler, flat face roughly facing outward
  const rulerMat = new THREE.MeshStandardMaterial({ map: rulerTexture(), metalness: 0.9, roughness: 0.38 });
  {
    const az = 5.75;
    const rg = new THREE.BoxGeometry(0.015, 0.155, 0.0008);
    rg.translate(0, 0.0775, 0);
    // the box's z faces carry the scale (UVs 0..1 across width/length): rotate UVs so mm run along length
    const uv = rg.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
    rg.rotateY(-az + Math.PI / 2);
    rg.applyMatrix4(placement(0.014, az, 0.001, 0.02));
    group.add(shadowed(new THREE.Mesh(rg, rulerMat)));
  }

  group.add(shadowed(new THREE.Mesh(mergeGeometries(painted), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0 }))));
  group.add(shadowed(new THREE.Mesh(mergeGeometries(metalParts.map(prep)), new THREE.MeshStandardMaterial({ color: 0xc9cbcf, metalness: 1, roughness: 0.3 }))));

  return group;
}

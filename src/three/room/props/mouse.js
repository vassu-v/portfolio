// Ergonomic wireless mouse + cloth mousepad — procedural, real meters.
// Origin: bottom center, Y-up, front (buttons) faces +Z.
// createMouse()    -> Group, ~0.065 W x 0.040 H x 0.120 L
// createMousepad() -> Group, 0.36 W x 0.003 H x 0.30 D (top surface at y = 0.003)
import * as THREE from 'three';

const MW = 0.065, MH = 0.04, ML = 0.12;

// Raw sculpted shell: an ellipsoid with poles along Z (so z-rings and the top
// centerline are grid lines), squared-off cross-section, flat underside, peak
// toward the palm and a lower, narrower nose.
function rawShell(u, phi) {
  const th = u * Math.PI;
  const c0 = -Math.cos(th), s0 = Math.sin(th);
  const s = Math.sign(c0) * Math.pow(Math.abs(c0), 0.8);
  const rr = Math.pow(s0, 0.8);
  const cx = Math.cos(phi), cy = Math.sin(phi);
  const ex = Math.sign(cx) * Math.pow(Math.abs(cx), 0.78);
  const ey = Math.sign(cy) * Math.pow(Math.abs(cy), 0.78);
  const x = ex * rr * (1 - 0.09 * s);
  let y = ey * rr;
  if (y > 0) y *= 1 - 0.34 * ((s + 0.25) / 1.25) ** 2;
  else y *= 0.2;
  return [x, y, s * (1 - 0.04 * rr)];
}

let NORM = null;
function norm() {
  if (NORM) return NORM;
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i <= 200; i++) {
    for (let j = 0; j < 200; j++) {
      const p = rawShell(i / 200, (j / 200) * Math.PI * 2);
      for (let a = 0; a < 3; a++) {
        mn[a] = Math.min(mn[a], p[a]);
        mx[a] = Math.max(mx[a], p[a]);
      }
    }
  }
  const dims = [MW, MH, ML];
  NORM = { mn, sc: dims.map((d, a) => d / (mx[a] - mn[a])), dims };
  return NORM;
}

function shellPoint(u, phi, out = new THREE.Vector3()) {
  const { mn, sc, dims } = norm();
  const p = rawShell(u, phi);
  return out.set(
    (p[0] - mn[0]) * sc[0] - dims[0] / 2,
    (p[1] - mn[1]) * sc[1],
    (p[2] - mn[2]) * sc[2] - dims[2] / 2
  );
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
function shellNormal(u, phi, out = new THREE.Vector3()) {
  const e = 1e-4;
  shellPoint(u + e, phi, _a);
  shellPoint(u - e, phi, _b);
  shellPoint(u, phi + e, _c);
  shellPoint(u, phi - e, _d);
  const du = _a.sub(_b);
  const dp = _c.sub(_d);
  return out.crossVectors(dp, du).normalize();
}

// Grid patch over (u, phi). `wrap` closes the phi direction. `offset` pushes the
// patch out along the surface normal (used to lift the button caps).
function shellPatch(u0, u1, nu, p0, p1, np, { wrap = false, offset = 0 } = {}) {
  const cols = wrap ? np : np + 1;
  const pos = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i <= nu; i++) {
    const u = u0 + ((u1 - u0) * i) / nu;
    for (let j = 0; j < cols; j++) {
      const phi = p0 + ((p1 - p0) * j) / np;
      shellPoint(u, phi, v);
      if (offset) v.addScaledVector(shellNormal(u, phi, n), offset);
      pos.push(v.x, v.y, v.z);
    }
  }
  const idx = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < np; j++) {
      const j1 = wrap ? (j + 1) % np : j + 1;
      const a = i * cols + j, b = (i + 1) * cols + j, c = i * cols + j1, d = (i + 1) * cols + j1;
      idx.push(a, c, b, c, d, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function shadowed(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createMouse() {
  const group = new THREE.Group();
  group.name = 'Mouse';

  const shellMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, roughness: 0.68, metalness: 0.02 });
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55, metalness: 0.0 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f0f11, roughness: 0.75, metalness: 0 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8d9097, roughness: 0.35, metalness: 1 });
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.4 });

  // poles are left open by a hair (0.1 mm) — invisible, avoids pinched normals
  const shell = shellPatch(0.002, 0.998, 34, 0, Math.PI * 2, 36, { wrap: true });
  group.add(shadowed(new THREE.Mesh(shell, shellMat)));

  const TOP = Math.PI / 2;
  const U_SPLIT = 0.47, U_GAP = 0.012, CENTER_GAP = 0.13, SIDE = 1.02;
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? TOP + CENTER_GAP : TOP - SIDE;
    const a1 = s > 0 ? TOP + SIDE : TOP - CENTER_GAP;
    const g = shellPatch(U_SPLIT + U_GAP, 0.985, 14, a0, a1, 10, { offset: 0.0007 });
    const btn = shadowed(new THREE.Mesh(g, buttonMat));
    btn.name = s > 0 ? 'ButtonLeft' : 'ButtonRight';
    group.add(btn);
  }

  // scroll wheel sitting in the center channel
  const uw = U_SPLIT + 0.13;
  const top = shellPoint(uw, TOP);
  const wheelR = 0.0105;
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.0068, 28, 1);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheel = shadowed(new THREE.Mesh(wheelGeo, wheelMat));
  wheel.position.set(0, top.y - wheelR + 0.0034, top.z);
  wheel.name = 'ScrollWheel';
  group.add(wheel);
  const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(wheelR + 0.0002, 0.0005, 4, 28).rotateY(Math.PI / 2), metalMat));
  ring.position.copy(wheel.position);
  group.add(ring);

  // small DPI/status dot behind the wheel
  const dotP = shellPoint(U_SPLIT - 0.035, TOP);
  const dot = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.0008, 10, 6), ledMat));
  dot.position.copy(dotP).add(new THREE.Vector3(0, -0.0004, 0));
  dot.scale.set(1, 0.5, 1);
  group.add(dot);

  // thumb buttons on the left flank (+X)
  const thumbGeo = new THREE.CapsuleGeometry(0.0022, 0.009, 2, 8);
  thumbGeo.rotateX(Math.PI / 2);
  for (const [u, k] of [[0.5, 0], [0.63, 1]]) {
    const phi = 0.42;
    const p = shellPoint(u, phi);
    const n = shellNormal(u, phi);
    const b = shadowed(new THREE.Mesh(thumbGeo, buttonMat));
    b.position.copy(p).addScaledVector(n, -0.0008);
    b.name = 'ThumbButton' + k;
    group.add(b);
  }

  group.userData.wheel = wheel;
  return group;
}

// ---------------------------------------------------------------- mousepad

const PW = 0.36, PD = 0.3, PT = 0.003, PR = 0.022;

function padTexture() {
  const W = 1024, H = Math.round((1024 * PD) / PW);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const weave = ((x ^ y) & 1) * 4 + ((x + y) % 3 === 0 ? 3 : 0);
      const v = 30 + weave + Math.random() * 10;
      const o = (y * W + x) * 4;
      img.data[o] = v;
      img.data[o + 1] = v;
      img.data[o + 2] = v + 2;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const pxPerM = W / PW;
  const inset = 0.0035 * pxPerM;
  const r = (PR - 0.0035) * pxPerM;
  ctx.strokeStyle = 'rgba(95,95,100,0.9)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.roundRect(inset, inset, W - inset * 2, H - inset * 2, r);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, PR * pxPerM);
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

export function createMousepad() {
  const group = new THREE.Group();
  group.name = 'Mousepad';

  const bevel = 0.0008;
  const shape = new THREE.Shape();
  const hw = PW / 2 - bevel, hd = PD / 2 - bevel;
  shape.moveTo(-hw + PR, -hd);
  shape.lineTo(hw - PR, -hd);
  shape.absarc(hw - PR, -hd + PR, PR, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hd - PR);
  shape.absarc(hw - PR, hd - PR, PR, 0, Math.PI / 2, false);
  shape.lineTo(-hw + PR, hd);
  shape.absarc(-hw + PR, hd - PR, PR, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hd + PR);
  shape.absarc(-hw + PR, -hd + PR, PR, Math.PI, Math.PI * 1.5, false);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: PT - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, bevel);
  // shape XY plane -> XZ floor; extrusion goes up +Y
  geo.rotateX(-Math.PI / 2);

  // planar UVs from the top view so the stitch line lands on the border
  const p = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, p.getX(i) / PW + 0.5, 0.5 - p.getZ(i) / PD);
  }

  const map = padTexture();
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = padTexture();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    bumpMap: bump,
    bumpScale: 0.4,
    roughness: 0.96,
    metalness: 0,
  });
  const pad = new THREE.Mesh(geo, mat);
  pad.castShadow = true;
  pad.receiveShadow = true;
  group.add(pad);
  group.userData.topY = PT;
  return group;
}

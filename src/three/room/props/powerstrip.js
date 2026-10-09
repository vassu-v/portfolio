// Floor power strip — 4 universal (Indian-style) sockets, lit rocker switch,
// two plugs inserted (sockets 1 and 3). Procedural, real meters.
// Origin: bottom center, Y-up, long axis along X, front faces +Z.
// createPowerStrip() -> Group, 0.28 L x 0.035 H x 0.045 D (plugs rise to ~0.07)
//   group.userData.plugCableEnds = [Vector3, Vector3]  local points where the two
//     plug cables leave the plugs' rear boots (cable direction ~ -Z)
//   group.userData.mainCableEnd  = Vector3  local point where the strip's own
//     cable leaves its strain relief at the -X end (cable direction ~ -X)
//   group.userData.switchMaterial  emissive rocker material
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const L = 0.28, D = 0.045, H = 0.035;
const SOCKETS = [-0.1, -0.05, 0.0, 0.05];
const SWITCH_X = 0.108;
const SOCKET_R = 0.0165;

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

// rounded block standing on y = 0, footprint w (X) x d (Z), height h
function block(w, d, h, r, bevel) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, d - bevel * 2, r), {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2); // extrusion -> +Y, shape y -> -Z
  return g;
}

function topTexture() {
  const PX = 6000; // px per meter
  const c = document.createElement('canvas');
  c.width = Math.round(L * PX);
  c.height = Math.round(D * PX);
  const x = c.getContext('2d');
  x.fillStyle = '#ebe9e3';
  x.fillRect(0, 0, c.width, c.height);
  const P = (mx, mz) => [(mx + L / 2) * PX, (mz + D / 2) * PX];
  for (const sx of SOCKETS) {
    const [cx, cy] = P(sx, 0);
    const g = x.createRadialGradient(cx, cy, SOCKET_R * PX * 0.2, cx, cy, SOCKET_R * PX);
    g.addColorStop(0, '#e2dfd8');
    g.addColorStop(1, '#d3cfc6');
    x.fillStyle = g;
    x.beginPath();
    x.arc(cx, cy, SOCKET_R * PX, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#141414';
    // universal: earth pin hole (top), two round live/neutral holes with flat-pin slots
    const hole = (dx, dz, r) => {
      x.beginPath();
      x.arc(cx + dx * PX, cy + dz * PX, r * PX, 0, Math.PI * 2);
      x.fill();
    };
    hole(0, -0.0085, 0.0024);
    for (const s of [-1, 1]) {
      hole(s * 0.0063, 0.0035, 0.0019);
      x.save();
      x.translate(cx + s * 0.0063 * PX, cy + 0.0035 * PX);
      x.rotate(s * 0.35);
      x.fillRect(-0.0008 * PX, -0.0042 * PX, 0.0016 * PX, 0.0084 * PX);
      x.restore();
    }
    // shutter hint
    x.strokeStyle = 'rgba(0,0,0,0.12)';
    x.lineWidth = 2;
    x.beginPath();
    x.arc(cx, cy, SOCKET_R * PX - 3, 0, Math.PI * 2);
    x.stroke();
  }
  // switch recess + small "ON" mark
  {
    const [cx, cy] = P(SWITCH_X, 0);
    x.fillStyle = '#1a1a1b';
    x.fillRect(cx - 0.0085 * PX, cy - 0.0125 * PX, 0.017 * PX, 0.025 * PX);
    x.fillStyle = '#8e8a82';
    x.font = `${Math.round(0.0035 * PX)}px sans-serif`;
    x.textAlign = 'center';
    x.fillText('I / O', cx, cy + 0.0175 * PX);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // extrude cap UVs are shape coords (meters): map the strip footprint onto 0..1
  t.repeat.set(1 / L, 1 / D);
  t.offset.set(0.5, 0.5);
  return t;
}

export function createPowerStrip() {
  const group = new THREE.Group();
  group.name = 'PowerStrip';

  const sideMat = new THREE.MeshStandardMaterial({ color: 0xe6e4de, roughness: 0.5, metalness: 0 });
  const topMat = new THREE.MeshStandardMaterial({ map: topTexture(), roughness: 0.5, metalness: 0 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.55, metalness: 0 });
  const switchMat = new THREE.MeshStandardMaterial({ color: 0xd2401c, roughness: 0.35, emissive: 0xff4a1a, emissiveIntensity: 0.35 });

  // body: caps (top/bottom) textured, sides plain
  const body = block(L, D, H, 0.008, 0.0035);
  group.add(shadowed(new THREE.Mesh(body, [topMat, sideMat])));

  // raised socket rings
  const rings = [];
  for (const sx of SOCKETS) {
    const r = new THREE.TorusGeometry(SOCKET_R + 0.0009, 0.0011, 6, 40);
    r.rotateX(Math.PI / 2);
    r.translate(sx, H - 0.0002, 0);
    rings.push(r);
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(rings.map(prep)), sideMat)));

  const dark = [];
  // main cable strain relief at -X end
  const relief = new THREE.CylinderGeometry(0.0034, 0.0058, 0.02, 16, 1);
  relief.rotateZ(Math.PI / 2); // axis along X, wide end (+Y side before rotation) -> -X
  relief.translate(-L / 2 - 0.01 + 0.001, H * 0.45, 0);
  dark.push(relief);
  const mainCableEnd = new THREE.Vector3(-L / 2 - 0.019, H * 0.45, 0);

  // switch bezel
  dark.push(prep(block(0.019, 0.027, 0.0025, 0.002, 0.0008)).translate(SWITCH_X, H - 0.0006, 0));

  // plugs in sockets 1 and 3: rounded upright body, rear boot leading the cable out to -Z
  const plugCableEnds = [];
  for (const sx of [SOCKETS[0], SOCKETS[2]]) {
    const PH = 0.034;
    const bodyG = block(0.028, 0.024, PH, 0.006, 0.003);
    // slight taper toward the top
    const p = bodyG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / PH;
      const k = 1 - 0.12 * t;
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    bodyG.computeVertexNormals();
    bodyG.translate(sx, H - 0.0004, 0);
    dark.push(bodyG);
    // grip ribs
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const rib = new THREE.BoxGeometry(0.0012, 0.014, 0.0014);
        rib.translate(sx + s * 0.0133, H + 0.014, -0.0054 + k * 0.0036);
        dark.push(rib);
      }
    }
    const by = H + PH * 0.68;
    const boot = new THREE.CylinderGeometry(0.0032, 0.0052, 0.016, 14, 1);
    boot.rotateX(-Math.PI / 2); // axis along Z, narrow end -> -Z
    boot.translate(sx, by, -0.0085 - 0.008);
    dark.push(boot);
    plugCableEnds.push(new THREE.Vector3(sx, by, -0.0085 - 0.016));
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(dark.map(prep)), darkMat)));

  // rocker switch, tilted to "on"
  const rocker = new THREE.BoxGeometry(0.0145, 0.004, 0.021, 1, 1, 1);
  const rk = shadowed(new THREE.Mesh(rocker, switchMat));
  rk.position.set(SWITCH_X, H + 0.0028, 0);
  rk.rotation.x = 0.16;
  group.add(rk);

  group.userData.plugCableEnds = plugCableEnds;
  group.userData.mainCableEnd = mainCableEnd;
  group.userData.switchMaterial = switchMat;
  return group;
}

// Desk phone stand — dark anodized aluminium, procedural, real meters.
// Origin: bottom center, Y-up, front (phone screen side) faces +Z.
// createPhoneStand() -> Group, ~0.090 W x 0.116 H x 0.090 D
//   group.userData.cradle = { position: Vector3, rotation: Euler }
//     local transform for a phone (0.071 x 0.150 x 0.008, origin at its center,
//     screen toward +Z) resting on the lip, leaning back TILT from vertical.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TILT = THREE.MathUtils.degToRad(17);

function roundedRect(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x0 = cx - w / 2, y0 = cy - h / 2;
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

// extruded slab, total thickness t along +Z (z in [0, t]), soft bevelled edges
function slab(shape, t, bevel = 0.0009) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: t - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 5,
  });
  g.translate(0, 0, bevel);
  return g;
}

function merge(list) {
  return mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
}

function shadowed(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createPhoneStand() {
  const group = new THREE.Group();
  group.name = 'PhoneStand';

  const alu = new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.85, roughness: 0.36 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x111112, metalness: 0, roughness: 0.85 });

  const PAD = 0.0015, BASE_T = 0.006, BW = 0.09, BD = 0.09;
  const BASE_TOP = PAD + BASE_T;
  const PW = 0.074, PL = 0.112, PT = 0.005;

  const aluParts = [];
  const rubberParts = [];

  // base plate (shape drawn in XY, laid flat into XZ)
  {
    const b = 0.0012;
    const g = slab(roundedRect(BW - b * 2, BD - b * 2, 0.012), BASE_T, b);
    g.rotateX(-Math.PI / 2); // extrusion +Z -> +Y, shape Y -> -Z
    g.translate(0, PAD, 0);
    aluParts.push(g);
    const pad = slab(roundedRect(BW - 0.008, BD - 0.008, 0.009), PAD + 0.0004, 0.0003);
    pad.rotateX(-Math.PI / 2);
    rubberParts.push(pad);
  }

  // support plate frame: pivot near the front of the base, top leaning back
  const plateM = new THREE.Matrix4().compose(
    new THREE.Vector3(0, BASE_TOP, 0.014),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(-TILT, 0, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const P = (y, z) => new THREE.Vector3(0, y, z).applyMatrix4(plateM);

  // plate with a rounded cable slot (front face at local z = 0)
  {
    const s = roundedRect(PW - 0.0018, PL - 0.0018, 0.008, 0, PL / 2);
    s.holes.push(roundedRect(0.026, 0.032, 0.006, 0, 0.05));
    const g = slab(s, PT);
    g.translate(0, 0, -PT);
    g.applyMatrix4(plateM);
    aluParts.push(g);
  }

  // lip / ledge: hook profile in (z, y), extruded across X
  const LEDGE_TOP = 0.011, LIP_IN = 0.0125, LIP_OUT = 0.0165, LIP_TOP = 0.0175;
  {
    const s = new THREE.Shape();
    const b = 0.0008;
    s.moveTo(-0.002 + b, b);
    s.lineTo(LIP_OUT - b, b);
    s.lineTo(LIP_OUT - b, LIP_TOP - b);
    s.lineTo(LIP_IN + b, LIP_TOP - b);
    s.lineTo(LIP_IN + b, LEDGE_TOP - b);
    s.lineTo(-0.002 + b, LEDGE_TOP - b);
    s.closePath();
    const g = slab(s, PW, b); // shape x->z, shape y->y, extrusion -> x
    g.rotateY(-Math.PI / 2);
    g.translate(PW / 2, 0, 0);
    g.applyMatrix4(plateM);
    aluParts.push(g);

    // rubber strips: on the ledge and up the plate face
    const ls = new THREE.BoxGeometry(PW - 0.01, 0.001, LIP_IN - 0.001);
    ls.translate(0, LEDGE_TOP + 0.0004, (LIP_IN - 0.001) / 2);
    ls.applyMatrix4(plateM);
    rubberParts.push(ls);
    for (const x of [-0.026, 0.026]) {
      const fs = new THREE.BoxGeometry(0.008, 0.07, 0.0012);
      fs.translate(x, 0.055, 0.0005);
      fs.applyMatrix4(plateM);
      rubberParts.push(fs);
    }
  }

  // rounded fillet where the plate meets the base
  {
    const g = new THREE.CylinderGeometry(0.0045, 0.0045, PW, 14, 1);
    g.rotateZ(Math.PI / 2);
    g.translate(0, BASE_TOP, 0.012);
    aluParts.push(g);
  }

  // rear brace: plate back -> base
  {
    const a = P(0.07, -PT + 0.001);
    const b = new THREE.Vector3(0, BASE_TOP - 0.001, -0.036);
    const len = a.distanceTo(b);
    const g = new THREE.BoxGeometry(0.03, len, 0.004, 1, 1, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
    g.applyQuaternion(q);
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    aluParts.push(g);
    const foot = new THREE.CylinderGeometry(0.004, 0.004, 0.03, 12, 1);
    foot.rotateZ(Math.PI / 2);
    foot.translate(0, BASE_TOP, -0.036);
    aluParts.push(foot);
  }

  group.add(shadowed(new THREE.Mesh(merge(aluParts), alu)));
  group.add(shadowed(new THREE.Mesh(merge(rubberParts), rubber)));

  // phone: bottom edge on the ledge rubber, back on the face strips
  const PHONE_T = 0.008, PHONE_H = 0.15;
  const cradlePos = P(LEDGE_TOP + 0.0009 + PHONE_H / 2, 0.0011 + PHONE_T / 2);
  group.userData.cradle = {
    position: cradlePos,
    rotation: new THREE.Euler(-TILT, 0, 0),
  };

  return group;
}

// Minimalist round wall clock — procedural, real meters.
// Origin: BACK center (mounts flat on a wall), face toward +Z, Y-up.
// createWallClock() -> Group, 0.26 dia x 0.04 deep
//   group.userData.setTime(date)   rotates hour / minute / second hands
//   group.userData.hands = { hour, minute, second }
import * as THREE from 'three';

const R = 0.13, DEPTH = 0.04, FACE_Z = 0.027, FACE_R = 0.1215;

function shadowed(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function faceTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#f3f0ea');
  g.addColorStop(1, '#e8e4dc');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.translate(S / 2, S / 2);
  const r = S / 2; // canvas edge = FACE_R
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    x.save();
    x.rotate((i / 60) * Math.PI * 2);
    x.fillStyle = major ? '#2a2a2c' : '#9a978f';
    const len = major ? r * 0.085 : r * 0.035;
    const w = major ? r * 0.018 : r * 0.007;
    x.fillRect(-w / 2, -r * 0.92, w, len);
    x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// flat hand in XY pointing +Y from the pivot, extruded along +Z
function handGeo(len, wBase, wTip, tail, thick, round = 0) {
  const s = new THREE.Shape();
  s.moveTo(-wBase / 2, -tail);
  s.lineTo(wBase / 2, -tail);
  s.lineTo(wTip / 2, len);
  s.lineTo(-wTip / 2, len);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  if (round > 0) {
    const hub = new THREE.CylinderGeometry(round, round, thick, 20);
    hub.rotateX(Math.PI / 2);
    hub.translate(0, 0, thick / 2);
    return [g, hub];
  }
  return [g];
}

function hand(parts, mat, z) {
  const grp = new THREE.Group();
  for (const g of parts) grp.add(shadowed(new THREE.Mesh(g, mat)));
  grp.position.z = z;
  return grp;
}

export function createWallClock() {
  const group = new THREE.Group();
  group.name = 'WallClock';

  const caseMat = new THREE.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.48, metalness: 0.35 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.82, metalness: 0 });
  const handMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5, metalness: 0.2 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xc57b2b, roughness: 0.32, metalness: 0.75 });

  // case: lathe profile (r, depth) revolved, then turned so depth runs along +Z
  const prof = [
    [0.0, 0.0],
    [R - 0.006, 0.0],
    [R - 0.0015, 0.0015],
    [R, 0.006],
    [R, DEPTH - 0.006],
    [R - 0.0008, DEPTH - 0.0022],
    [R - 0.003, DEPTH - 0.0002],
    [R - 0.006, DEPTH],
    [R - 0.0085, DEPTH - 0.0012],
    [FACE_R - 0.0005, DEPTH - 0.004],
    [FACE_R - 0.0005, FACE_Z - 0.002],
    [0.0, FACE_Z - 0.002],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const caseGeo = new THREE.LatheGeometry(prof.reverse(), 72);
  caseGeo.rotateX(Math.PI / 2);
  group.add(shadowed(new THREE.Mesh(caseGeo, caseMat)));

  const face = shadowed(new THREE.Mesh(new THREE.CircleGeometry(FACE_R, 72), faceMat));
  face.position.z = FACE_Z;
  group.add(face);

  const hourH = hand(handGeo(0.058, 0.0075, 0.0045, 0.012, 0.0012, 0.006), handMat, FACE_Z + 0.0015);
  const minH = hand(handGeo(0.092, 0.0055, 0.003, 0.014, 0.0012), handMat, FACE_Z + 0.003);
  const secParts = handGeo(0.1, 0.0016, 0.0011, 0.026, 0.0008);
  const weight = new THREE.CylinderGeometry(0.004, 0.004, 0.0008, 18);
  weight.rotateX(Math.PI / 2);
  weight.translate(0, -0.024, 0.0004);
  const secH = hand([...secParts, weight], copper, FACE_Z + 0.0045);
  group.add(hourH, minH, secH);

  const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0016, 18).rotateX(Math.PI / 2), copper));
  cap.position.z = FACE_Z + 0.0057;
  group.add(cap);

  const setTime = (date = new Date()) => {
    const s = date.getSeconds() + date.getMilliseconds() / 1000;
    const m = date.getMinutes() + s / 60;
    const h = (date.getHours() % 12) + m / 60;
    secH.rotation.z = -(s / 60) * Math.PI * 2;
    minH.rotation.z = -(m / 60) * Math.PI * 2;
    hourH.rotation.z = -(h / 12) * Math.PI * 2;
  };
  setTime(new Date());

  group.userData.setTime = setTime;
  group.userData.hands = { hour: hourH, minute: minH, second: secH };
  return group;
}

// Standing desk photo frame with a rear kickstand — procedural, real meters.
// Origin: bottom center at the back-bottom edge it rests on, Y-up, picture faces +Z.
// createPhotoFrame({ texture, w = 0.13, h = 0.18, style = 'wood' | 'black' }) -> Group
//   leans back ~12°. `texture` fills the picture opening (MeshStandardMaterial map;
//   set its colorSpace yourself). group.userData.picture = the picture mesh.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TILT = THREE.MathUtils.degToRad(12);

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

function rectPath(path, w, h, x0, y0) {
  path.moveTo(x0, y0);
  path.lineTo(x0 + w, y0);
  path.lineTo(x0 + w, y0 + h);
  path.lineTo(x0, y0 + h);
  path.closePath();
  return path;
}

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#9a6a40';
  x.fillRect(0, 0, 256, 256);
  let s = 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const y = rnd() * 256;
    x.strokeStyle = `rgba(${rnd() < 0.5 ? '70,40,20' : '190,140,90'},${0.12 + rnd() * 0.2})`;
    x.lineWidth = 0.6 + rnd() * 2.2;
    x.beginPath();
    for (let px = 0; px <= 256; px += 16) x.lineTo(px, y + Math.sin(px * 0.02 + i) * 3);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 0.12, 1 / 0.12); // extrude UVs are in meters
  return t;
}

function placeholderTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 176;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 176);
  g.addColorStop(0, '#d9c7a8');
  g.addColorStop(1, '#6f7f8f');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 176);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createPhotoFrame({ texture, w = 0.13, h = 0.18, style = 'wood' } = {}) {
  const group = new THREE.Group();
  group.name = 'PhotoFrame';

  const B = Math.min(w, h) * 0.11; // moulding width
  const FD = 0.014; // frame depth
  const frameMat =
    style === 'black'
      ? new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: 0.55, metalness: 0 })
      : new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.6, metalness: 0 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x2b2522, roughness: 0.85, metalness: 0 });
  const picMat = new THREE.MeshStandardMaterial({ map: texture || placeholderTexture(), roughness: 0.55, metalness: 0 });

  // panel: back face at z = 0, front at z = FD, bottom at y = 0; tilted about
  // its back-bottom edge (the contact line, = group origin)
  const panel = new THREE.Group();
  panel.rotation.x = -TILT;
  group.add(panel);

  // moulding: outer rect with the picture opening, bevelled front
  {
    const shape = rectPath(new THREE.Shape(), w - 0.003, h - 0.003, -(w - 0.003) / 2, 0.0015);
    shape.holes.push(rectPath(new THREE.Path(), w - 2 * B + 0.003, h - 2 * B + 0.003, -(w - 2 * B + 0.003) / 2, B - 0.0015));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: FD - 0.003,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 2,
    });
    g.translate(0, 0, 0.0015);
    panel.add(shadowed(new THREE.Mesh(g, frameMat)));
  }

  // picture, inset behind the moulding lip
  const picW = w - 2 * B + 0.006, picH = h - 2 * B + 0.006;
  const pic = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(picW, picH), picMat));
  pic.position.set(0, B - 0.003 + picH / 2, FD - 0.005);
  panel.add(pic);

  // backing board + kickstand (+ hinge strip), one mesh
  const backs = [];
  {
    const bw = w - 0.008, bh = h - 0.008, bt = 0.0025;
    const board = new THREE.BoxGeometry(bw, bh, bt);
    board.translate(0, 0.004 + bh / 2, 0.0008 + bt / 2);
    backs.push(board);

    // kickstand: hinged on the board at ~62% height, foot on the floor behind
    const panelM = new THREE.Matrix4().makeRotationX(-TILT);
    const hingeL = new THREE.Vector3(0, h * 0.62, 0.0006);
    const hinge = hingeL.clone().applyMatrix4(panelM);
    const T = 0.003;
    const foot = new THREE.Vector3(0, T * 0.3, hinge.z - h * 0.36);
    const len = hinge.distanceTo(foot);
    const dir = hinge.clone().sub(foot).normalize();
    const shape = new THREE.Shape();
    const wTop = w * 0.18, wBot = w * 0.26;
    shape.moveTo(-wBot / 2, 0);
    shape.lineTo(wBot / 2, 0);
    shape.lineTo(wTop / 2, len);
    shape.lineTo(-wTop / 2, len);
    shape.closePath();
    const st = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
    st.translate(0, 0, -T / 2);
    // orient: shape +Y along foot->hinge, shape normal (+Z) pointing away from the panel
    const yAxis = dir;
    const xAxis = new THREE.Vector3(1, 0, 0);
    const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
    st.applyMatrix4(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis).setPosition(foot));
    backs.push(st);

    const hingeBar = new THREE.BoxGeometry(wTop + 0.008, 0.008, 0.0016);
    hingeBar.translate(hingeL.x, hingeL.y - 0.002, -0.0001);
    hingeBar.applyMatrix4(panelM);
    backs.push(hingeBar);
  }
  // the board/hinge are built in panel space, the stand in group space:
  // merge in group space
  {
    const panelM = new THREE.Matrix4().makeRotationX(-TILT);
    backs[0].applyMatrix4(panelM);
  }
  group.add(shadowed(new THREE.Mesh(mergeGeometries(backs.map(prep)), backMat)));

  group.userData.picture = pic;
  return group;
}

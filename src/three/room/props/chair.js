// Ergonomic office chair — procedural, real meters.
// Origin: floor contact, bottom center. Y-up, front (seat edge) faces +Z.
// API: createChair() -> THREE.Group
//   group.userData.seat        Object3D above the gas lift (rotate .rotation.y to swivel)
//   group.userData.spin(dt, speed = 0.6)   convenience: swivels the seat by dt*speed rad
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- helpers

// Rounded box with evenly-distributed vertices on the flat faces (so it can be
// bent/deformed afterwards) and `band` segments around each rounded edge.
function roundedSlab(w, h, d, r, step = 0.03, band = 3) {
  const half = [w / 2, h / 2, d / 2];
  const flat = half.map((H) => Math.max(0, H - r));
  const segs = flat.map((f) => Math.max(1, Math.round((f * 2) / step)) + band * 2);
  const ks = flat.map((f, i) => (segs[i] - band * 2) / segs[i]);
  let g = new THREE.BoxGeometry(2, 2, 2, segs[0], segs[1], segs[2]);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-5);
  const p = g.attributes.position;
  const d3 = new THREE.Vector3();
  const inner = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const c = [p.getX(i), p.getY(i), p.getZ(i)];
    const inn = [0, 0, 0];
    const dv = [0, 0, 0];
    for (let a = 0; a < 3; a++) {
      const ac = Math.abs(c[a]);
      const k = ks[a];
      if (ac <= k + 1e-9) {
        inn[a] = (k > 0 ? c[a] / k : 0) * flat[a];
      } else {
        inn[a] = Math.sign(c[a]) * flat[a];
        dv[a] = Math.sign(c[a]) * ((ac - k) / (1 - k));
      }
    }
    d3.set(dv[0], dv[1], dv[2]);
    inner.set(inn[0], inn[1], inn[2]);
    if (d3.lengthSq() > 0) d3.normalize().multiplyScalar(r);
    inner.add(d3);
    p.setXYZ(i, inner.x, inner.y, inner.z);
  }
  return g;
}

function planarUV(g, axisU, axisV, scale) {
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const get = { x: (i) => p.getX(i), y: (i) => p.getY(i), z: (i) => p.getZ(i) };
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = get[axisU](i) / scale;
    uv[i * 2 + 1] = get[axisV](i) / scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

function fabricCanvas(ctx, s) {
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // fine twill weave + noise
      const weave = ((x + y) % 4 < 2 ? 1 : 0) * 0.06 + ((x % 2) ^ (y % 2)) * 0.03;
      const v = 0.8 + weave + (Math.random() - 0.5) * 0.12;
      const c = Math.max(0, Math.min(255, v * 255));
      const o = (y * s + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = c;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function meshCanvas(ctx, s) {
  // woven mesh: bright strands, dark open cells (8x8 cells per tile)
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, s, s);
  const n = 8;
  const cell = s / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const ox = (j % 2) * cell * 0.5;
      ctx.fillStyle = '#e6e6e6';
      ctx.beginPath();
      ctx.ellipse(i * cell + ox, j * cell + cell / 2, cell * 0.5, cell * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.ellipse(i * cell + ox, j * cell + cell / 2, cell * 0.3, cell * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- chair

export function createChair() {
  const group = new THREE.Group();
  group.name = 'OfficeChair';

  // materials -------------------------------------------------------------
  const fabricMap = canvasTex(256, fabricCanvas);
  fabricMap.colorSpace = THREE.SRGBColorSpace;
  const fabricBump = canvasTex(256, fabricCanvas);
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x2c2c2f,
    map: fabricMap,
    bumpMap: fabricBump,
    bumpScale: 0.6,
    roughness: 0.92,
    metalness: 0,
  });

  const meshMap = canvasTex(256, meshCanvas);
  meshMap.colorSpace = THREE.SRGBColorSpace;
  const meshBump = canvasTex(256, meshCanvas);
  const meshFabric = new THREE.MeshStandardMaterial({
    color: 0x2e2e31,
    map: meshMap,
    bumpMap: meshBump,
    bumpScale: 0.8,
    roughness: 0.88,
    metalness: 0,
  });

  const plastic = new THREE.MeshStandardMaterial({ color: 0x141415, roughness: 0.55, metalness: 0 });
  const plasticSatin = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.42, metalness: 0 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.8, metalness: 0 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.28, metalness: 1 });

  // ---------------------------------------------------------------- base (static)
  const base = new THREE.Group();
  base.name = 'ChairBase';
  group.add(base);

  // hub
  const hub = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, 0.065, 32), plasticSatin));
  hub.position.y = 0.0975;
  base.add(hub);

  // gas lift outer sleeve
  const sleeve = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.16, 32), plastic));
  sleeve.position.y = 0.205;
  base.add(sleeve);
  const sleeveRing = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0035, 6, 24), plasticSatin));
  sleeveRing.rotation.x = Math.PI / 2;
  sleeveRing.position.y = 0.284;
  base.add(sleeveRing);

  // legs: tapered, slightly arched, sloping down to the casters
  const LEG_L = 0.3;
  const legGeo = roundedSlab(LEG_L, 0.045, 0.05, 0.012, 0.1, 2);
  {
    const p = legGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getX(i) + LEG_L / 2) / LEG_L;
      let y = p.getY(i) * THREE.MathUtils.lerp(1, 0.66, t);
      const z = p.getZ(i) * THREE.MathUtils.lerp(1, 0.72, t);
      y += -0.026 * t + 0.006 * Math.sin(Math.PI * t);
      p.setY(i, y);
      p.setZ(i, z);
    }
    legGeo.computeVertexNormals();
  }

  // casters
  const wheelGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.013, 20);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubCapGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.0145, 12);
  hubCapGeo.rotateZ(Math.PI / 2);
  const housingGeo = roundedSlab(0.03, 0.026, 0.044, 0.009, 0.1, 2);
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 12);

  const LEGS = 5;
  for (let i = 0; i < LEGS; i++) {
    const a = (i / LEGS) * Math.PI * 2 + Math.PI / 2; // one leg points straight back
    const arm = new THREE.Group();
    arm.rotation.y = a;
    base.add(arm);

    const leg = shadowed(new THREE.Mesh(legGeo, plasticSatin));
    leg.position.set(0.035 + LEG_L / 2, 0.1, 0);
    arm.add(leg);

    const caster = new THREE.Group();
    caster.position.set(0.315, 0, 0);
    caster.rotation.y = 0.5 + i * 1.3; // casters at random-ish swivel angles
    arm.add(caster);

    const stem = shadowed(new THREE.Mesh(stemGeo, chrome));
    stem.position.y = 0.068;
    caster.add(stem);
    const housing = shadowed(new THREE.Mesh(housingGeo, plastic));
    housing.position.set(0, 0.046, -0.006);
    caster.add(housing);
    for (const sx of [-1, 1]) {
      const wheel = shadowed(new THREE.Mesh(wheelGeo, rubber));
      wheel.position.set(sx * 0.0105, 0.0245, -0.012);
      caster.add(wheel);
      const cap = shadowed(new THREE.Mesh(hubCapGeo, plasticSatin));
      cap.position.copy(wheel.position);
      caster.add(cap);
    }
  }

  // ---------------------------------------------------------------- seat (swivels)
  const seat = new THREE.Group();
  seat.name = 'ChairSeat';
  group.add(seat);

  // chrome piston
  const piston = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.1, 24), chrome));
  piston.position.y = 0.33;
  seat.add(piston);

  // tilt mechanism
  const mech = shadowed(new THREE.Mesh(roundedSlab(0.2, 0.045, 0.22, 0.012, 0.08, 2), plastic));
  mech.position.set(0, 0.375, -0.01);
  seat.add(mech);

  // height lever (right side from sitter's view = -X)
  const lever = shadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 10).rotateZ(Math.PI / 2), chrome)
  );
  lever.position.set(-0.15, 0.37, 0.04);
  seat.add(lever);
  const leverKnob = shadowed(new THREE.Mesh(roundedSlab(0.035, 0.016, 0.022, 0.007, 0.02, 2), plastic));
  leverKnob.position.set(-0.215, 0.37, 0.04);
  seat.add(leverKnob);

  // seat pan (plastic shell under the cushion)
  const pan = shadowed(new THREE.Mesh(roundedSlab(0.45, 0.018, 0.43, 0.008, 0.09, 2), plastic));
  pan.position.set(0, 0.405, 0);
  seat.add(pan);

  // seat cushion — rounded slab, domed top, waterfall front
  const SW = 0.48, SH = 0.065, SD = 0.46;
  const cushGeo = roundedSlab(SW, SH, SD, 0.026, 0.045, 3);
  {
    const p = cushGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const nx = x / (SW / 2), nz = z / (SD / 2);
      let ny = y;
      if (y > 0) ny += 0.009 * (1 - nx * nx) * (1 - nz * nz);
      if (nz > 0.55) ny -= 0.012 * ((nz - 0.55) / 0.45) ** 2;
      p.setY(i, ny);
    }
    cushGeo.computeVertexNormals();
    planarUV(cushGeo, 'x', 'z', 0.08);
  }
  const cushion = shadowed(new THREE.Mesh(cushGeo, fabric));
  cushion.position.set(0, 0.4475, 0.005); // bottom 0.415, top ~0.48 (seat height ~0.47 under load)
  seat.add(cushion);

  // backrest — mesh panel, curved horizontally, lumbar bulge, framed
  const BW = 0.44, BH = 0.54, BD = 0.032;
  function backGeo(w, h, d, r, inset, band) {
    const g = roundedSlab(w, h, d, r, 0.045, band);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const ny = y / (BH / 2);
      x *= 1 - 0.1 * Math.max(0, ny) - 0.05 * Math.max(0, -ny); // narrower at top & bottom
      const nx = x / (BW / 2);
      z += 0.055 * nx * nx; // wrap toward the sitter
      z += 0.022 * Math.exp(-(((y + 0.12) / 0.09) ** 2)) * (1 - 0.4 * nx * nx); // lumbar
      z += inset;
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }
  const back = new THREE.Group();
  back.position.set(0, 0.79, -0.255);
  back.rotation.x = -0.12; // slight recline
  seat.add(back);

  const backPanelGeo = backGeo(BW, BH, BD, 0.015, 0, 3);
  planarUV(backPanelGeo, 'x', 'y', 0.05);
  const backPanel = shadowed(new THREE.Mesh(backPanelGeo, meshFabric));
  back.add(backPanel);

  const frame = shadowed(new THREE.Mesh(backGeo(BW + 0.03, BH + 0.03, 0.022, 0.011, -0.014, 2), plasticSatin));
  back.add(frame);

  // spine — one continuous L-shaped blade: buried in the tilt mechanism, runs
  // back under the seat, bends up behind the cushion and follows the frame's
  // back surface (sampled through the backrest transform) so it sits flush.
  {
    const SPW = 0.072, SPD = 0.026, SPR = 0.009, EMBED = 0.003;
    back.updateMatrix();
    const backSurfZ = (y) => -0.025 + 0.022 * Math.exp(-(((y + 0.12) / 0.09) ** 2));
    const onBack = (y) => new THREE.Vector3(0, y, backSurfZ(y) - SPD / 2 + EMBED).applyMatrix4(back.matrix);
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0.372, -0.03),
        new THREE.Vector3(0, 0.372, -0.14),
        new THREE.Vector3(0, 0.377, -0.205),
        new THREE.Vector3(0, 0.398, -0.242),
        new THREE.Vector3(0, 0.432, -0.2525),
        onBack(-0.33),
        onBack(-0.26),
        onBack(-0.18),
        onBack(-0.1),
        onBack(-0.03),
      ],
      false,
      'centripetal'
    );

    // rounded-rectangle profile (x = across, n = toward seat/backrest)
    const prof = [];
    const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    corners.forEach(([sx, sn], ci) => {
      const a0 = (ci * Math.PI) / 2;
      for (let k = 0; k < 4; k++) {
        const a = a0 + (k / 3) * (Math.PI / 2);
        prof.push([sx * (SPW / 2 - SPR) + Math.cos(a) * SPR, sn * (SPD / 2 - SPR) + Math.sin(a) * SPR]);
      }
    });
    const NP = prof.length, NS = 26;
    const pos = [], idx = [];
    const X = new THREE.Vector3(1, 0, 0), T = new THREE.Vector3(), N = new THREE.Vector3(), C = new THREE.Vector3();
    const centers = [], normals = [];
    for (let i = 0; i <= NS; i++) {
      const u = i / NS;
      curve.getPointAt(u, C);
      curve.getTangentAt(u, T);
      N.crossVectors(X, T).normalize();
      centers.push(C.clone());
      normals.push(N.clone());
      for (const [px, pn] of prof) pos.push(C.x + px, C.y + N.y * pn, C.z + N.z * pn);
    }
    for (let i = 0; i < NS; i++) {
      for (let j = 0; j < NP; j++) {
        const a = i * NP + j, b = i * NP + ((j + 1) % NP), c = (i + 1) * NP + j, d = (i + 1) * NP + ((j + 1) % NP);
        idx.push(a, c, b, b, c, d);
      }
    }
    // end caps (separate verts → flat cap normals)
    for (const [ring, flip] of [[0, true], [NS, false]]) {
      const base0 = pos.length / 3;
      const cc = centers[ring];
      pos.push(cc.x, cc.y, cc.z);
      for (let j = 0; j < NP; j++) pos.push(pos[(ring * NP + j) * 3], pos[(ring * NP + j) * 3 + 1], pos[(ring * NP + j) * 3 + 2]);
      for (let j = 0; j < NP; j++) {
        const a = base0 + 1 + j, b = base0 + 1 + ((j + 1) % NP);
        if (flip) idx.push(base0, a, b);
        else idx.push(base0, b, a);
      }
    }
    const spineGeo = new THREE.BufferGeometry();
    spineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    spineGeo.setIndex(idx);
    spineGeo.computeVertexNormals();
    seat.add(shadowed(new THREE.Mesh(spineGeo, plasticSatin)));

    // four bolt heads on the back face where the blade meets the frame
    const bolts = [];
    for (const by of [-0.25, -0.08]) {
      for (const bx of [-0.019, 0.019]) {
        const b = new THREE.CylinderGeometry(0.0055, 0.006, 0.004, 10, 1);
        b.rotateX(Math.PI / 2);
        b.translate(bx, by, backSurfZ(by) - SPD + EMBED - 0.0012);
        b.applyMatrix4(back.matrix);
        bolts.push(b);
      }
    }
    seat.add(shadowed(new THREE.Mesh(mergeGeometries(bolts), chrome)));
  }

  // armrests
  const armPadGeo = roundedSlab(0.075, 0.026, 0.25, 0.012, 0.08, 2);
  for (const s of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.09, 0.385, -0.06),
      new THREE.Vector3(s * 0.2, 0.384, -0.06),
      new THREE.Vector3(s * 0.258, 0.405, -0.06),
      new THREE.Vector3(s * 0.272, 0.47, -0.065),
      new THREE.Vector3(s * 0.272, 0.65, -0.07),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.015, 10, false);
    const post = shadowed(new THREE.Mesh(tubeGeo, plastic));
    seat.add(post);
    const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), plasticSatin));
    cap.position.set(s * 0.272, 0.648, -0.07);
    seat.add(cap);
    const pad = shadowed(new THREE.Mesh(armPadGeo, plastic));
    pad.position.set(s * 0.272, 0.666, -0.04);
    seat.add(pad);
  }

  // ---------------------------------------------------------------- API
  group.userData.seat = seat;
  group.userData.base = base;
  group.userData.spin = (dt = 1 / 60, speed = 0.6) => {
    seat.rotation.y += dt * speed;
  };

  return group;
}

// Small desk snake plant in a matte ceramic pot — procedural, real meters.
// Origin: bottom center of the pot. Y-up, +Z front. ~0.29 m tall.
// API: createPlant() -> THREE.Group; group.userData.update(t) for a subtle leaf sway.
import * as THREE from 'three';

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shadowed(m) {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

// Sansevieria leaf: wavy cross-bands, optional yellow margin (laurentii).
function leafTexture(rand, { base, dark, light, margin }) {
  const t = canvas(128, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const y = rand() * h;
      const amp = 4 + rand() * 6;
      const thick = 2 + rand() * 5;
      ctx.strokeStyle = rand() < 0.55 ? dark : light;
      ctx.globalAlpha = 0.35 + rand() * 0.35;
      ctx.lineWidth = thick;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x * 0.08 + i) * amp;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (margin) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, margin);
      g.addColorStop(0.09, margin);
      g.addColorStop(0.14, 'rgba(0,0,0,0)');
      g.addColorStop(0.86, 'rgba(0,0,0,0)');
      g.addColorStop(0.91, margin);
      g.addColorStop(1, margin);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function leafGeometry({ length, width, cup, bend, twist }) {
  const NS = 16, NT = 6;
  const pos = [], uv = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS;
    const w = width * Math.pow(1 - s, 0.5) * (0.78 + 0.32 * Math.sin(Math.PI * Math.min(1, s * 1.4)));
    const tw = twist * s;
    const ct = Math.cos(tw), st = Math.sin(tw);
    for (let j = 0; j <= NT; j++) {
      const t = (j / NT) * 2 - 1;
      const lx = t * w;
      const lz = cup * (1 - t * t) * w;
      const x = lx * ct - lz * st;
      const z = lx * st + lz * ct + bend * s * s * length;
      const y = s * length * (1 - 0.08 * s * s * Math.abs(bend) * 4);
      pos.push(x, y, z);
      uv.push(j / NT, s);
    }
  }
  const idx = [];
  const cols = NT + 1;
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NT; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createPlant({ seed = 7 } = {}) {
  const rand = mulberry32(seed);
  const group = new THREE.Group();
  group.name = 'DeskPlant';

  // ---------------------------------------------------------------- pot
  const R_BOT = 0.05, R_TOP = 0.062, H = 0.11, WALL = 0.006, LIP_R = 0.0032;
  const pts = [];
  pts.push(new THREE.Vector2(0, 0));
  pts.push(new THREE.Vector2(R_BOT - 0.006, 0));
  for (let k = 1; k <= 4; k++) {
    const a = -Math.PI / 2 + (k / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R_BOT - 0.006 + Math.cos(a) * 0.006, 0.006 + Math.sin(a) * 0.006));
  }
  for (let k = 1; k <= 6; k++) {
    const t = k / 6;
    pts.push(new THREE.Vector2(R_BOT + (R_TOP - R_BOT) * t + 0.002 * Math.sin(Math.PI * t), 0.006 + (H - 0.006 - LIP_R) * t));
  }
  const lipC = new THREE.Vector2(R_TOP - LIP_R, H - LIP_R);
  for (let k = 1; k <= 7; k++) {
    const a = (k / 7) * Math.PI;
    pts.push(new THREE.Vector2(lipC.x + Math.cos(a) * LIP_R, lipC.y + Math.sin(a) * LIP_R));
  }
  const rIn = R_TOP - WALL;
  pts.push(new THREE.Vector2(rIn - 0.0006, H - 0.02));
  pts.push(new THREE.Vector2(rIn - 0.0015, H - 0.03));
  const potGeo = new THREE.LatheGeometry(pts, 56);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xe7e1d6,
    roughness: 0.86,
    metalness: 0,
    map: (() => {
      const t = canvas(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#f4f1ea';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          ctx.fillStyle = `rgba(${90 + rand() * 40},${80 + rand() * 30},${70},${0.04 + rand() * 0.12})`;
          const r = 0.4 + rand() * 1.1;
          ctx.beginPath();
          ctx.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 1);
      return t;
    })(),
  });
  const pot = shadowed(new THREE.Mesh(potGeo, potMat));
  pot.name = 'Pot';
  group.add(pot);

  // ---------------------------------------------------------------- soil
  const SOIL_Y = H - 0.012;
  const soilR = rIn - 0.0008;
  const soilPts = [
    new THREE.Vector2(0, SOIL_Y + 0.004),
    new THREE.Vector2(soilR * 0.5, SOIL_Y + 0.003),
    new THREE.Vector2(soilR * 0.85, SOIL_Y + 0.0012),
    new THREE.Vector2(soilR, SOIL_Y),
    new THREE.Vector2(soilR, SOIL_Y - 0.012),
  ];
  const soilGeo = new THREE.LatheGeometry(soilPts.reverse(), 48);
  const soilTex = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3b2a1e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) {
      const v = rand();
      ctx.fillStyle = v < 0.6 ? 'rgba(25,16,10,0.6)' : v < 0.9 ? 'rgba(85,62,42,0.5)' : 'rgba(170,150,120,0.5)';
      ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2.5, 1 + rand() * 2.5);
    }
  });
  soilTex.colorSpace = THREE.SRGBColorSpace;
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  soilTex.repeat.set(4, 1);
  const soil = shadowed(
    new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, map: soilTex, roughness: 1, metalness: 0 }))
  );
  soil.name = 'Soil';
  group.add(soil);

  const pebbleGeo = new THREE.IcosahedronGeometry(1, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x8b8378, roughness: 0.75, metalness: 0 });
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, r = 0.02 + rand() * (soilR - 0.026);
    const p = shadowed(new THREE.Mesh(pebbleGeo, pebbleMat));
    const sz = 0.0025 + rand() * 0.002;
    p.scale.set(sz * 1.3, sz * 0.7, sz);
    p.rotation.set(rand(), rand() * 6, rand());
    p.position.set(Math.cos(a) * r, SOIL_Y + 0.0035 - (r / soilR) * 0.0025, Math.sin(a) * r);
    group.add(p);
  }

  // ---------------------------------------------------------------- leaves
  const matDark = new THREE.MeshStandardMaterial({
    map: leafTexture(rand, { base: '#2f5a33', dark: '#1d3d22', light: '#5f8a56' }),
    roughness: 0.55,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const matLight = new THREE.MeshStandardMaterial({
    map: leafTexture(rand, { base: '#4b7d3e', dark: '#2c5229', light: '#86ad6a', margin: '#c9c26a' }),
    roughness: 0.5,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const leaves = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    const inner = i < 4;
    const yaw = (i / N) * Math.PI * 2 * 2.618 + rand() * 0.4;
    const length = inner ? 0.16 + rand() * 0.03 : 0.1 + rand() * 0.06;
    const geo = leafGeometry({
      length,
      width: 0.011 + rand() * 0.006,
      cup: 0.35 + rand() * 0.25,
      bend: inner ? 0.04 + rand() * 0.04 : 0.1 + rand() * 0.1,
      twist: (rand() - 0.5) * 0.9,
    });
    const leaf = shadowed(new THREE.Mesh(geo, rand() < 0.5 ? matDark : matLight));
    const pivot = new THREE.Group();
    pivot.rotation.order = 'YXZ';
    const r = inner ? rand() * 0.008 : 0.01 + rand() * 0.014;
    pivot.position.set(Math.cos(yaw) * r, SOIL_Y - 0.006, Math.sin(yaw) * r);
    pivot.rotation.y = Math.PI / 2 - yaw;
    const lean = inner ? 0.04 + rand() * 0.08 : 0.15 + rand() * 0.2;
    pivot.rotation.x = lean;
    pivot.add(leaf);
    group.add(pivot);
    leaves.push({ pivot, lean, phase: rand() * Math.PI * 2, freq: 0.6 + rand() * 0.5, amp: 0.008 + rand() * 0.008 });
  }

  group.userData.leaves = leaves.map((l) => l.pivot);
  group.userData.update = (t) => {
    for (const l of leaves) {
      l.pivot.rotation.x = l.lean + Math.sin(t * l.freq + l.phase) * l.amp;
      l.pivot.rotation.z = Math.sin(t * l.freq * 0.7 + l.phase * 1.3) * l.amp * 0.6;
    }
  };
  return group;
}

/*
 * HEADPHONES — AirPods Max style over-ears: knit mesh canopy, anodized
 * aluminum cups, telescoping stainless arms, memory-foam pads, digital crown.
 *
 * Exports:
 *   createModel() → THREE.Group  (call group.userData.update(elapsed, delta) each frame)
 *   getModelInfo() → { name, description, animationClips }
 *
 * ============================================================================
 * ANIMATION MAP
 * ============================================================================
 *
 * 1. FLOAT — whole unit bobs gently (±0.08, 4s period) like a product shot
 *    → tune: FLOAT_AMP (0.08), FLOAT_PERIOD (4.0)
 *
 * 2. STATUS LED — tiny LED under right cup pulses amber (3s period)
 *    → tune: LED_PERIOD (3.0), LED_BASE (0.3), LED_PEAK (1.0)
 *
 * 3. CUP SWIVEL (interactive) — cups can rotate ±15° on Y via userData.setSwivel(angle)
 *    Telescoping arms extend/retract via userData.setExtension(0–1)
 *
 * 4. DIGITAL CROWN (interactive) — userData.rotateCrown(delta) spins the crown,
 *    userData.pressCrown() triggers a click animation
 *    → tune: CROWN_CLICK_DUR (0.12s)
 *
 * ============================================================================
 * GEOMETRY NOTES
 *   Band arcs are half-tori left in their default XY plane — rotateX(90°)
 *   lays them flat/horizontal (the original bug). Cup detail geometries must
 *   scale BEFORE translate; scaling after multiplies the offsets too.
 * ============================================================================
 */
import * as THREE from 'three';

const AMBER = 0xff9500;
const ALU_DARK = 0x767c88;   // anodized "space gray" — keep well above 0x50
const ALU_MID  = 0x8b919d;   // or the whole unit renders near-black
const ALU_LIGHT = 0xaab0ba;
const STEEL = 0xc2c8d2;
const STEEL_DARK = 0x8e95a2;

const FLOAT_AMP = 0.08;
const FLOAT_PERIOD = 4.0;
const LED_PERIOD = 3.0;
const LED_BASE = 0.3;
const LED_PEAK = 1.0;
const CROWN_CLICK_DUR = 0.12;

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

function makeKnitMat() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a4e58';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#626773';
  ctx.lineWidth = 1;
  for (let y = 0; y < 128; y += 4) {
    for (let x = 0; x < 128; x += 4) {
      const offset = (y / 4) % 2 === 0 ? 0 : 2;
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + 2, y + 2);
      ctx.lineTo(x + offset, y + 4);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff, // don't tint — the color multiplies the knit map
    roughness: 0.95,
    metalness: 0.0,
    normalMap: tex,
    normalScale: new THREE.Vector2(0.3, 0.3),
  });
}

function makePadMat() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#565962';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 1.5 + 0.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#666a74' : '#44474e';
    ctx.globalAlpha = Math.random() * 0.15 + 0.05;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff, // don't tint — the color multiplies the pad map
    roughness: 0.98,
    metalness: 0.0,
    normalMap: tex,
    normalScale: new THREE.Vector2(0.15, 0.15),
  });
}

export function getModelInfo() {
  return {
    name: 'Headphones',
    description: 'AirPods Max-style over-ears: knit canopy, anodized cups, telescoping arms, memory-foam pads, digital crown.',
    animationClips: ['float', 'statusLed', 'cupSwivel', 'crownClick'],
  };
}

export function createModel() {
  const group = new THREE.Group();
  group.name = 'headphones';

  // Materials
  const aluMat = new THREE.MeshStandardMaterial({
    color: ALU_DARK, roughness: 0.35, metalness: 0.6,
    emissive: 0x2a2d33, emissiveIntensity: 0.35,
  });
  const aluMatLight = new THREE.MeshStandardMaterial({
    color: ALU_MID, roughness: 0.3, metalness: 0.55,
    emissive: 0x2a2d33, emissiveIntensity: 0.3,
  });
  const aluMatBright = new THREE.MeshStandardMaterial({
    color: ALU_LIGHT, roughness: 0.28, metalness: 0.55,
    emissive: 0x30333a, emissiveIntensity: 0.25,
  });
  // metalness kept moderate: with no envMap, metalness ~1 renders black
  const steelMat = new THREE.MeshStandardMaterial({
    color: STEEL, roughness: 0.25, metalness: 0.5,
    emissive: 0x2e3238, emissiveIntensity: 0.3,
  });
  const steelDarkMat = new THREE.MeshStandardMaterial({
    color: STEEL_DARK, roughness: 0.3, metalness: 0.5,
    emissive: 0x24272c, emissiveIntensity: 0.3,
  });
  const padMat = makePadMat();
  const knitMat = makeKnitMat();

  const BAND_R = 1.55;
  const CUP_RY = 0.92;   // cup half-height
  const CUP_RX = 0.28;   // cup half-depth (toward head) — keep slim, ~0.3×
                         // the radius, or the pucks read as thick barrels
  const CUP_DROP = 0.7;  // cup center below the band ends
  const ARM_LEN = 0.55;

  // ========== HEADBAND ==========
  const bandGroup = new THREE.Group();
  bandGroup.name = 'headband';

  // Outer steel arcs (structural frame) — default torus plane (XY), top half
  for (const zOff of [-0.14, 0.14]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(BAND_R, 0.035, 8, 32, Math.PI), steelDarkMat);
    arc.position.z = zOff;
    bandGroup.add(arc);
  }

  // Knit mesh canopy stretched between the arcs
  const canopyGeo = new THREE.TorusGeometry(BAND_R - 0.02, 0.075, 6, 24, Math.PI * 0.86);
  canopyGeo.rotateZ(Math.PI * 0.07); // center the shorter arc on top
  canopyGeo.scale(1, 1, 2.2);        // widen front-to-back into a strap
  const canopy = new THREE.Mesh(canopyGeo, knitMat);
  bandGroup.add(canopy);

  // Inner padding strip (touches head)
  const padStripGeo = new THREE.TorusGeometry(BAND_R - 0.1, 0.05, 5, 20, Math.PI * 0.7);
  padStripGeo.rotateZ(Math.PI * 0.15);
  padStripGeo.scale(1, 1, 2.0);
  const padStrip = new THREE.Mesh(padStripGeo, padMat);
  bandGroup.add(padStrip);

  // Hinge attachment blocks on the band ends
  for (const side of [-1, 1]) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.28), aluMat);
    block.position.set(side * BAND_R, 0, 0);
    bandGroup.add(block);
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 12), steelMat);
    pivot.rotation.x = Math.PI / 2;
    pivot.position.set(side * BAND_R, 0, 0);
    bandGroup.add(pivot);
  }

  group.add(bandGroup);

  // ========== CUPS & ARMS ==========
  const cups = [];
  const arms = [];

  for (const side of [-1, 1]) {
    // --- Telescoping arm (band end down to the cup) ---
    const armGroup = new THREE.Group();
    armGroup.name = 'arm';
    armGroup.position.set(side * BAND_R, -0.06, 0);

    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, ARM_LEN, 12), steelMat);
    sleeve.position.y = -ARM_LEN / 2;
    armGroup.add(sleeve);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, ARM_LEN, 12), steelDarkMat);
    shaft.position.y = -ARM_LEN * 0.75;
    armGroup.add(shaft);

    let extension = 0.35;
    const setExtension = (v) => {
      extension = THREE.MathUtils.clamp(v, 0, 1);
      shaft.position.y = -ARM_LEN * 0.75 - extension * 0.2;
    };
    setExtension(extension);

    group.add(armGroup);

    // --- Cup ---
    const cupGroup = new THREE.Group();
    cupGroup.name = side === -1 ? 'leftCup' : 'rightCup';
    cupGroup.position.set(side * BAND_R, -CUP_DROP - ARM_LEN, 0);

    // Anodized shell: rounded-edge cylinder (a flat puck, not a sphere) —
    // lathe profile: flat inner face, rounded rim corners, gently domed
    // outer face; lathe axis Y, then rotated so the puck axis runs along X
    const R = CUP_RY, H = CUP_RX * 2, E = 0.16; // radius, depth, edge round
    const profile = [];
    profile.push(new THREE.Vector2(0, -H / 2));
    profile.push(new THREE.Vector2(R - E, -H / 2));
    for (let i = 1; i <= 4; i++) { // inner-face rim corner
      const a = (i / 4) * (Math.PI / 2);
      profile.push(new THREE.Vector2(R - E + Math.sin(a) * E, -H / 2 + E - Math.cos(a) * E));
    }
    for (let i = 1; i <= 4; i++) { // outer-face rim corner
      const a = (i / 4) * (Math.PI / 2);
      profile.push(new THREE.Vector2(R - E + Math.cos(a) * E, H / 2 - E + Math.sin(a) * E));
    }
    for (let i = 1; i <= 5; i++) { // gently domed outer face
      const f = i / 5;
      profile.push(new THREE.Vector2((R - E) * (1 - f), H / 2 + f * 0.09));
    }
    const shellGeo = new THREE.LatheGeometry(profile, 28);
    shellGeo.rotateZ(-side * Math.PI / 2); // puck axis along X, dome outward
    shellGeo.scale(1, 1, 0.88);           // slightly oval (taller than deep)
    const shell = new THREE.Mesh(shellGeo, aluMat);
    cupGroup.add(shell);

    // Rim ring around the inner face
    const rimGeo = new THREE.TorusGeometry(CUP_RY * 0.74, 0.03, 10, 28);
    rimGeo.rotateY(Math.PI / 2);                 // face along X
    rimGeo.scale(1, 1, 0.85);                    // match shell's z squash
    rimGeo.translate(side * -CUP_RX * 0.72, 0, 0); // translate AFTER scale
    const rim = new THREE.Mesh(rimGeo, aluMatBright);
    cupGroup.add(rim);

    // Memory foam pad (fat torus on the head-facing side), with the vertices
    // displaced by layered sine "noise" so the foam reads squishy and
    // irregular instead of a perfect mathematical torus
    const padGeo = new THREE.TorusGeometry(CUP_RY * 0.6, 0.17, 12, 26);
    {
      const pos = padGeo.attributes.position;
      const vtx = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        vtx.fromBufferAttribute(pos, i);
        const ang = Math.atan2(vtx.y, vtx.x); // angle around the ring
        const lump = 1
          + 0.025 * Math.sin(ang * 3 + 1.3)
          + 0.018 * Math.sin(ang * 7 + 0.4)
          + 0.012 * Math.sin(ang * 11 + vtx.z * 9);
        pos.setXYZ(i, vtx.x * lump, vtx.y * lump, vtx.z * (1 + 0.07 * Math.sin(ang * 5 + 2)));
      }
      padGeo.computeVertexNormals();
    }
    padGeo.rotateY(Math.PI / 2);
    padGeo.scale(1, 1.1, 0.9);
    padGeo.translate(side * -CUP_RX * 0.95, 0, 0);
    const pad = new THREE.Mesh(padGeo, padMat);
    cupGroup.add(pad);

    // Inner firmer foam ring
    const innerPadGeo = new THREE.TorusGeometry(CUP_RY * 0.42, 0.1, 10, 18);
    innerPadGeo.rotateY(Math.PI / 2);
    innerPadGeo.scale(1, 1.1, 0.9);
    innerPadGeo.translate(side * -CUP_RX * 0.8, 0, 0);
    const innerPadMat = new THREE.MeshStandardMaterial({
      color: 0x2c2e33, roughness: 0.95, metalness: 0,
      emissive: 0x16171a, emissiveIntensity: 0.25,
    });
    const innerPad = new THREE.Mesh(innerPadGeo, innerPadMat);
    cupGroup.add(innerPad);

    // Driver mesh disc (tiny-holes texture) inside the pad ring
    const driverCanvas = document.createElement('canvas');
    driverCanvas.width = 128;
    driverCanvas.height = 128;
    const dctx = driverCanvas.getContext('2d');
    dctx.fillStyle = '#141416';
    dctx.fillRect(0, 0, 128, 128);
    dctx.fillStyle = '#222226';
    for (let y = 2; y < 128; y += 5) {
      for (let x = 2; x < 128; x += 5) {
        dctx.fillRect(x, y, 2, 2);
      }
    }
    const driverTex = new THREE.CanvasTexture(driverCanvas);
    driverTex.wrapS = driverTex.wrapT = THREE.RepeatWrapping;
    driverTex.repeat.set(2, 2);
    const driverMat = new THREE.MeshStandardMaterial({
      map: driverTex, color: 0x1a1a1c, roughness: 0.85, metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const driverGeo = new THREE.CircleGeometry(CUP_RY * 0.52, 32);
    driverGeo.rotateY(side * -Math.PI / 2);      // face inward
    driverGeo.scale(1, 1.1, 0.9);
    driverGeo.translate(side * -CUP_RX * 0.82, 0, 0);
    const driver = new THREE.Mesh(driverGeo, driverMat);
    cupGroup.add(driver);

    // --- Right cup details ---
    if (side === 1) {
      // Digital crown with knurled rings
      const crownGroup = new THREE.Group();
      crownGroup.name = 'crown';
      const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 16), steelDarkMat);
      crownGroup.add(crownBase);
      const crownKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16), steelMat);
      crownKnob.position.y = 0.09;
      crownGroup.add(crownKnob);
      const knurlMat = new THREE.MeshStandardMaterial({
        color: 0x7a808a, roughness: 0.3, metalness: 0.9,
      });
      const knurls = [];
      for (let i = 0; i < 4; i++) {
        const knurl = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 24), knurlMat);
        knurl.rotation.x = Math.PI / 2;
        knurl.position.y = 0.09 + (i - 1.5) * 0.028;
        crownGroup.add(knurl);
        knurls.push(knurl);
      }
      crownGroup.position.set(0.12, CUP_RY * 0.88, 0.3);
      crownGroup.rotation.x = -0.25;
      const CROWN_Y0 = CUP_RY * 0.88;
      cupGroup.add(crownGroup);

      crownGroup.userData.rotation = 0;
      crownGroup.userData.clickProgress = 0;
      crownGroup.userData.baseY = CROWN_Y0;
      crownGroup.userData.rotateCrown = (delta) => {
        crownGroup.userData.rotation += delta;
        crownKnob.rotation.y = crownGroup.userData.rotation;
        knurls.forEach(k => { k.rotation.z = crownGroup.userData.rotation; });
      };
      crownGroup.userData.pressCrown = () => { crownGroup.userData.clickProgress = 1; };
      cupGroup.userData.crown = crownGroup;

      // Status LED on the lower outer face
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x2a1800, emissive: AMBER, emissiveIntensity: LED_BASE,
        roughness: 0.3, metalness: 0.8,
      });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), ledMat);
      led.position.set(CUP_RX * 0.75, -CUP_RY * 0.6, 0.25);
      cupGroup.add(led);
      cupGroup.userData._ledMat = ledMat;
    }

    // --- Left cup details ---
    if (side === -1) {
      // Noise control button
      const ncGroup = new THREE.Group();
      const ncBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), aluMatLight);
      ncGroup.add(ncBase);
      const ncButton = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 12), steelMat);
      ncButton.position.y = 0.04;
      ncGroup.add(ncButton);
      ncGroup.position.set(-0.1, CUP_RY * 0.9, 0.24);
      ncGroup.rotation.x = -0.2;
      cupGroup.add(ncGroup);
    }

    // Swivel (cups rotate slightly on Y to fit head)
    cupGroup.userData.setSwivel = (angle) => {
      cupGroup.rotation.y = THREE.MathUtils.clamp(angle, -0.26, 0.26); // ±15°
    };

    group.add(cupGroup);
    cups.push(cupGroup);
    arms.push({ armGroup, setExtension });
  }

  // ========== ANIMATION STATE ==========
  const ledMat = cups[1].userData._ledMat;

  group.userData.update = (t, delta = 0.016) => {
    // Float bob
    group.position.y = 0.55 + Math.sin((t / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_AMP;

    // Status LED pulse
    if (ledMat) {
      ledMat.emissiveIntensity = LED_BASE + (LED_PEAK - LED_BASE) *
        (0.5 + 0.5 * Math.sin((t / LED_PERIOD) * Math.PI * 2));
    }

    // Crown click animation
    const crown = cups[1].userData.crown;
    if (crown && crown.userData.clickProgress > 0) {
      crown.userData.clickProgress = Math.max(0, crown.userData.clickProgress - delta / CROWN_CLICK_DUR);
      const p = crown.userData.clickProgress;
      crown.position.y = crown.userData.baseY - easeOutCubic(1 - p) * 0.015;
      if (p === 0) crown.position.y = crown.userData.baseY;
    }
  };

  // ========== PUBLIC API ==========
  group.userData.parts = {
    band: bandGroup,
    leftCup: cups[0],
    rightCup: cups[1],
    leftArm: arms[0],
    rightArm: arms[1],
  };
  group.userData.setExtension = (v) => arms.forEach(a => a.setExtension(v));
  group.userData.setSwivel = (l, r = l) => {
    cups[0].userData.setSwivel(l);
    cups[1].userData.setSwivel(r);
  };
  group.userData.rotateCrown = (d) => cups[1].userData.crown?.userData.rotateCrown(d);
  group.userData.pressCrown = () => cups[1].userData.crown?.userData.pressCrown();

  group.position.y = 0.55;
  return group;
}

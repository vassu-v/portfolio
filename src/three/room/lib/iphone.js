import * as THREE from 'three';

export function getModelInfo() {
  return {
    name: 'Green Premium Phone Concept',
    description: 'Green glass-and-metal premium phone concept with a visible editable display, clean camera deck, no logo, no Dynamic Island capsule, and no palette props.',
    tags: ['phone', 'premium', 'screen', 'camera', 'interactive'],
    animationClips: ['float', 'screen', 'cameraGlint', 'display'],
  };
}

export function createModel() {
  const phone = new THREE.Group();

  const W = 1.34;
  const H = 2.82;
  const T = 0.16;
  const HW = W / 2;
  const HH = H / 2;
  const R = 0.23;
  const FRONT_Z = T / 2 + 0.008;
  const BACK_Z = -T / 2 - 0.008;

  const setPos = (obj, x, y, z) => {
    obj.position.set(x, y, z);
    return obj;
  };

  const roundedRect = (w, h, r) => {
    const x = w / 2;
    const y = h / 2;
    const s = new THREE.Shape();
    s.moveTo(-x + r, -y);
    s.lineTo(x - r, -y);
    s.quadraticCurveTo(x, -y, x, -y + r);
    s.lineTo(x, y - r);
    s.quadraticCurveTo(x, y, x - r, y);
    s.lineTo(-x + r, y);
    s.quadraticCurveTo(-x, y, -x, y - r);
    s.lineTo(-x, -y + r);
    s.quadraticCurveTo(-x, -y, -x + r, -y);
    return s;
  };

  const roundedMesh = (w, h, r, material, z = 0, segments = 56) => {
    material.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(w, h, r), segments), material);
    mesh.position.z = z;
    return mesh;
  };

  const roundedCanvasPath = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  };

  // metalness above ~0.6 with no envMap renders near-black in this viewer —
  // the metallic read comes from clearcoat + a dimmed same-hue emissive floor
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8d28a,
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    emissive: 0x4a5c2e,
    emissiveIntensity: 0.42,
  });

  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f6da,
    metalness: 0.6,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: 0x5a6144,
    emissiveIntensity: 0.35,
  });

  const backMat = new THREE.MeshPhysicalMaterial({
    color: 0xb5d57f,
    metalness: 0.08,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    emissive: 0x3c4f22,
    emissiveIntensity: 0.4,
  });

  const blackGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x020305,
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
  });
  blackGlassMat.side = THREE.DoubleSide;

  const screenGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x9ecfff,
    transparent: true,
    opacity: 0.1,
    metalness: 0,
    roughness: 0.015,
    transmission: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    depthWrite: false,
  });

  const buttonMat = new THREE.MeshPhysicalMaterial({
    color: 0xe4efc0,
    metalness: 0.55,
    roughness: 0.18,
    clearcoat: 0.75,
    emissive: 0x565c3d,
    emissiveIntensity: 0.35,
  });

  const deckMat = new THREE.MeshPhysicalMaterial({
    color: 0xc0d98a,
    metalness: 0.3,
    roughness: 0.14,
    clearcoat: 1,
    clearcoatRoughness: 0.035,
    emissive: 0x46531f,
    emissiveIntensity: 0.35,
  });

  const lensRingMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7fbe8,
    metalness: 0.55,
    roughness: 0.12,
    clearcoat: 0.8,
    emissive: 0x616649,
    emissiveIntensity: 0.35,
  });

  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x07101d,
    metalness: 0,
    roughness: 0.015,
    transmission: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    emissive: 0x03101f,
    emissiveIntensity: 0.65,
  });

  // Body: smooth, heavy bevels, metal edge.
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
    depth: T,
    bevelEnabled: true,
    bevelSize: 0.024,
    bevelThickness: 0.02,
    bevelSegments: 12,
    curveSegments: 72,
  });
  bodyGeo.translate(0, 0, -T / 2);
  phone.add(new THREE.Mesh(bodyGeo, frameMat));

  phone.add(roundedMesh(W - 0.032, H - 0.032, R - 0.018, rimMat, FRONT_Z - 0.012));
  phone.add(roundedMesh(W - 0.045, H - 0.045, R - 0.022, backMat, BACK_Z));

  // Premium side breaks and reflections.
  const antennaMat = new THREE.MeshPhysicalMaterial({
    color: 0xf6f8e9,
    metalness: 0.12,
    roughness: 0.34,
    clearcoat: 0.55,
  });
  [
    [-HW - 0.006, HH - 0.43],
    [HW + 0.006, HH - 0.43],
    [-HW - 0.006, -HH + 0.43],
    [HW + 0.006, -HH + 0.43],
  ].forEach(([x, y]) => {
    phone.add(setPos(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.19, T + 0.015), antennaMat), x, y, 0));
  });

  // (removed the floating sheen planes — they hovered off the surface and
  // read as stray straight lines in 3D)

  // Screen: explicit UV-mapped display plane, no texture ambiguity.
  const screenW = W - 0.105;
  const screenH = H - 0.13;
  const screenR = 0.19;
  phone.add(roundedMesh(screenW + 0.02, screenH + 0.02, screenR + 0.01, blackGlassMat, FRONT_Z + 0.006));

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1860;
  const ctx = canvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(canvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.needsUpdate = true;

  let customDisplay = null;
  const drawScreen = (t = 0) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    roundedCanvasPath(ctx, 0, 0, w, h, 92);
    ctx.clip();

    if (typeof customDisplay === 'function') {
      customDisplay(ctx, w, h, t);
      ctx.restore();
      screenTex.needsUpdate = true;
      return;
    }

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#06140a');
    bg.addColorStop(0.42, '#2a7a2d');
    bg.addColorStop(0.72, '#0c2b14');
    bg.addColorStop(1, '#020403');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.52, h * 0.27, 20, w * 0.52, h * 0.27, 760);
    glow.addColorStop(0, 'rgba(195,255,128,0.58)');
    glow.addColorStop(0.4, 'rgba(70,170,58,0.3)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(210,255,170,0.08)';
    ctx.beginPath();
    ctx.ellipse(630, 540, 290, 520, -0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.textAlign = 'center';
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.fillText('Premium Preview', w / 2, 260); // below the Dynamic Island
    ctx.font = '900 220px system-ui, sans-serif';
    ctx.fillText('10', w / 2, 470);
    ctx.fillText('28', w / 2, 675);

    const cardY = 1000;
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    roundedCanvasPath(ctx, 72, cardY, w - 144, 480, 58);
    ctx.fill();
    ctx.fillStyle = 'rgba(5,8,14,0.78)';
    roundedCanvasPath(ctx, 94, cardY + 22, w - 188, 436, 46);
    ctx.fill();
    ctx.fillStyle = '#d7ffae';
    ctx.font = '800 46px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(customDisplay ?? 'Interactive Surface', 132, cardY + 98);
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '500 30px system-ui, sans-serif';
    ctx.fillText('CanvasTexture display is active', 132, cardY + 146);

    const bars = [0.88, 0.58, 0.76, 0.42];
    bars.forEach((value, i) => {
      const y = cardY + 212 + i * 54;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundedCanvasPath(ctx, 132, y, 560, 20, 10);
      ctx.fill();
      ctx.fillStyle = ['#b7ff68', '#64d66a', '#48b0ff', '#e1d37a'][i];
      roundedCanvasPath(ctx, 132, y, 560 * value, 20, 10);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    roundedCanvasPath(ctx, w / 2 - 120, h - 58, 240, 9, 5);
    ctx.fill();

    ctx.restore();
    screenTex.needsUpdate = true;
  };

  drawScreen(0);

  const screenMat = new THREE.MeshBasicMaterial({
    map: screenTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    toneMapped: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW - 0.01, screenH - 0.012, 1, 1), screenMat);
  screen.position.z = FRONT_Z + 0.024;
  phone.add(screen);

  const screenGlass = roundedMesh(screenW, screenH, screenR, screenGlassMat, FRONT_Z + 0.028);
  screenGlass.scale.set(1.006, 1.006, 1);
  phone.add(screenGlass);

  // Dynamic Island: black pill anchored near the top of the screen, with a
  // front camera dot at its right end and a faint speaker slit
  const ISLAND_Y = HH - 0.22;
  const sensorMat = new THREE.MeshBasicMaterial({ color: 0x08090c, side: THREE.DoubleSide });
  const sensorEdgeMat = new THREE.MeshBasicMaterial({ color: 0x3b464f, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const islandEdge = roundedMesh(0.46, 0.145, 0.0725, sensorEdgeMat, FRONT_Z + 0.033, 28);
  islandEdge.position.y = ISLAND_Y;
  const island = roundedMesh(0.44, 0.13, 0.065, sensorMat, FRONT_Z + 0.035, 28);
  island.position.y = ISLAND_Y;
  phone.add(islandEdge, island);
  phone.add(setPos(new THREE.Mesh(new THREE.CircleGeometry(0.03, 28), new THREE.MeshBasicMaterial({ color: 0x11141c, side: THREE.DoubleSide })), 0.14, ISLAND_Y, FRONT_Z + 0.039));
  phone.add(setPos(new THREE.Mesh(new THREE.CircleGeometry(0.011, 16), new THREE.MeshBasicMaterial({ color: 0x8cd4ff, side: THREE.DoubleSide })), 0.14, ISLAND_Y, FRONT_Z + 0.041));
  phone.add(setPos(new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.014), new THREE.MeshBasicMaterial({ color: 0x1a1f26, side: THREE.DoubleSide })), -0.05, ISLAND_Y, FRONT_Z + 0.039));

  // Camera deck: cleaner premium block, recessed glass, fewer toy-like parts.
  const cameraGroup = new THREE.Group();
  const deckBase = roundedMesh(0.56, 0.9, 0.17, new THREE.MeshPhysicalMaterial({
    color: 0xb8d58a,
    metalness: 0.22,
    roughness: 0.18,
    clearcoat: 0.96,
    clearcoatRoughness: 0.03,
  }), BACK_Z - 0.02);
  deckBase.position.set(-HW + 0.34, HH - 0.53, deckBase.position.z);
  cameraGroup.add(deckBase);

  const deck = roundedMesh(0.5, 0.82, 0.14, deckMat, BACK_Z - 0.012);
  deck.position.set(-HW + 0.34, HH - 0.53, deck.position.z);
  cameraGroup.add(deck);

  // deep green camera glass — pure dark reads black in this viewer, so the
  // green needs an emissive floor of its own hue
  const deckGlass = roundedMesh(0.42, 0.76, 0.12, new THREE.MeshPhysicalMaterial({
    color: 0x2a4d26,
    metalness: 0.06,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    emissive: 0x1d3a1a,
    emissiveIntensity: 0.55,
  }), BACK_Z - 0.038);
  deckGlass.position.set(-HW + 0.34, HH - 0.53, deckGlass.position.z);
  cameraGroup.add(deckGlass);

  const addLens = (y, radius = 0.112) => {
    const x = -HW + 0.34;
    const z = BACK_Z - 0.062;

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.038, 80), lensRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, y, z);
    cameraGroup.add(ring);

    const outer = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.84, radius * 0.84, 0.044, 80), blackGlassMat);
    outer.rotation.x = Math.PI / 2;
    outer.position.set(x, y, z - 0.025);
    cameraGroup.add(outer);

    const glass = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.046, 80), lensGlassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(x, y, z - 0.05);
    cameraGroup.add(glass);

    const iris = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.22, radius * 0.48, 80),
      new THREE.MeshBasicMaterial({ color: 0x0a2038, transparent: true, opacity: 0.62, side: THREE.DoubleSide })
    );
    iris.position.set(x, y, z - 0.075);
    cameraGroup.add(iris);

    const highlight = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.13, 28),
      new THREE.MeshBasicMaterial({ color: 0xd7f3ff, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    highlight.position.set(x - radius * 0.2, y + radius * 0.2, z - 0.078);
    cameraGroup.add(highlight);
  };

  addLens(HH - 0.39);
  addLens(HH - 0.69);

  cameraGroup.add(setPos(
    new THREE.Mesh(new THREE.CircleGeometry(0.035, 32), new THREE.MeshBasicMaterial({ color: 0xfff1bb, side: THREE.DoubleSide })),
    -HW + 0.485,
    HH - 0.545,
    BACK_Z - 0.09
  ));
  cameraGroup.add(setPos(
    new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), new THREE.MeshBasicMaterial({ color: 0x171717, side: THREE.DoubleSide })),
    -HW + 0.485,
    HH - 0.655,
    BACK_Z - 0.09
  ));
  phone.add(cameraGroup);

  // MagSafe cues: faint alignment ring + short tick below it, centered on
  // the lower back like the charger footprint
  // slightly darker than the back plate — a light ring vanishes on sage green
  const magsafeMat = new THREE.MeshBasicMaterial({
    color: 0x46552c, transparent: true, opacity: 0.65, side: THREE.DoubleSide,
  });
  // z must clear the body's back bevel (BACK_Z - 0.012) or the ring is buried
  const magRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.445, 56), magsafeMat);
  magRing.position.set(0, -0.22, BACK_Z - 0.032);
  const magTick = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.16), magsafeMat);
  magTick.position.set(0, -0.22 - 0.52, BACK_Z - 0.032);
  phone.add(magRing, magTick);

  // Side controls and USB-C. No logo and no palette props.
  phone.add(setPos(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.31, 0.048), buttonMat), HW + 0.02, 0.06, 0.008));
  phone.add(setPos(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.145, 0.044), buttonMat), -HW - 0.02, 0.34, 0.008));
  phone.add(setPos(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.145, 0.044), buttonMat), -HW - 0.02, 0.16, 0.008));
  phone.add(setPos(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.028, 0.024), blackGlassMat), 0, -HH - 0.006, FRONT_Z - 0.06));

  const lensGlint = new THREE.PointLight(0xdff6ff, 0.9, 1.6, 2);
  lensGlint.position.set(-HW + 0.12, HH - 0.15, -0.45);
  phone.add(lensGlint);

  const railGlint = new THREE.PointLight(0xffffff, 1.15, 2.8, 2);
  railGlint.decay = 1.5;
  phone.add(railGlint);

  phone.userData.display = (content) => {
    customDisplay = content;
    drawScreen(0);
  };
  phone.userData.clearDisplay = () => {
    customDisplay = null;
    drawScreen(0);
  };
  phone.userData.setColor = (hex = 0x9db96f) => {
    frameMat.color.set(hex);
    backMat.color.set(hex);
  };
  phone.userData.parts = {
    screen,
    screenTex,
    cameraGroup,
    backMat,
    frameMat,
  };

  phone.userData.update = (t) => {
    drawScreen(t);
    phone.position.y = Math.sin(t * 1.2) * 0.025;
    phone.rotation.z = Math.sin(t * 0.75) * 0.012;
    lensGlint.intensity = 0.55 + Math.sin(t * 2.6) * 0.25;
    cameraGroup.rotation.y = 0.01 + Math.sin(t * 1.1) * 0.015;

    const gp = (t / 7) % 1;
    const per = 2 * (W + H);
    const d = gp * per;
    let gx;
    let gy;
    if (d < W) {
      gx = -W / 2 + d;
      gy = H / 2;
    } else if (d < W + H) {
      gx = W / 2;
      gy = H / 2 - (d - W);
    } else if (d < 2 * W + H) {
      gx = W / 2 - (d - W - H);
      gy = -H / 2;
    } else {
      gx = -W / 2;
      gy = -H / 2 + (d - 2 * W - H);
    }
    railGlint.position.set(gx, gy, FRONT_Z + 0.36);
    railGlint.intensity = 1.05 + Math.sin(t * 2.3) * 0.3;

    sensorEdgeMat.opacity = 0.6 + Math.sin(t * 2.1) * 0.1;
  };

  phone.rotation.y = -0.42;
  phone.rotation.x = 0.08;
  return phone;
}

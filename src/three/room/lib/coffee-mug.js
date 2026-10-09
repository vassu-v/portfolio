// ============================================================================
// COFFEE MUG — ceramic mug, dark coffee surface, rising steam wisps
// ----------------------------------------------------------------------------
// ANIMATION MAP
//   steam      — WISP_COUNT transparent blobs rise, drift sideways, fade,
//                respawn at the surface. STEAM_RISE 0.55/s · STEAM_LIFE 2.6s
//   coffee     — liquid disc slowly "swirls": subtle scale ripple + a faint
//                rotating sheen ring. RIPPLE 0.012 @ 0.7 Hz
// TUNING
//   MUG_R 0.85 · MUG_H 1.5 · liquid sits 0.18 below the rim
//   steam past ~0.35 opacity reads like smoke — keep it faint
// ============================================================================
import * as THREE from 'three';

const AMBER = 0xff9500;

export function getModelInfo() {
  return {
    name: 'Coffee Mug',
    description: 'Ceramic mug with dark coffee, a lazy surface swirl and rising steam wisps.',
    animationClips: ['steam', 'coffeeSwirl'],
  };
}

export function createModel() {
  const group = new THREE.Group();
  const MUG_R = 0.85, MUG_H = 1.5, WALL = 0.09;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d8, roughness: 0.35, metalness: 0.05,
    emissive: AMBER, emissiveIntensity: 0.03,
  });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xcfc8bc, roughness: 0.4, side: THREE.BackSide });

  // outer wall (open-topped)
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(MUG_R, MUG_R * 0.92, MUG_H, 24, 1, true), ceramicMat);
  wall.position.y = MUG_H / 2;
  group.add(wall);
  // inner wall
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(MUG_R - WALL, MUG_R - WALL, MUG_H - 0.05, 24, 1, true), innerMat);
  inner.position.y = MUG_H / 2 + 0.05;
  group.add(inner);
  // rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(MUG_R - WALL / 2, WALL / 2, 8, 24), ceramicMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = MUG_H;
  group.add(rim);
  // bottom
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(MUG_R * 0.92, MUG_R * 0.88, 0.1, 24), ceramicMat);
  bottom.position.y = 0.05;
  group.add(bottom);

  // handle
  // C-arc in the XY plane; gap (0.75π wide, centered at angle π) faces the mug wall
  const handleGeo = new THREE.TorusGeometry(0.45, 0.1, 10, 20, Math.PI * 1.25);
  handleGeo.rotateZ(-Math.PI * 0.625);
  const handle = new THREE.Mesh(handleGeo, ceramicMat);
  handle.position.set(MUG_R + 0.22, MUG_H * 0.55, 0);
  group.add(handle);

  // ---- coffee ----
  const coffeeMat = new THREE.MeshStandardMaterial({
    color: 0x2a1608, roughness: 0.15, metalness: 0.1,
    emissive: 0x522a08, emissiveIntensity: 0.25,
  });
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(MUG_R - WALL - 0.01, 24), coffeeMat);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = MUG_H - 0.18;
  group.add(coffee);
  // rotating sheen crescent on the surface
  const sheen = new THREE.Mesh(
    new THREE.RingGeometry(MUG_R * 0.3, MUG_R * 0.55, 20, 1, 0, Math.PI * 0.9),
    new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.10, side: THREE.DoubleSide })
  );
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.y = MUG_H - 0.175;
  group.add(sheen);

  // ---- steam ----
  const STEAM_RISE = 0.65, STEAM_LIFE = 2.8, WISP_COUNT = 10;
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xfff5e0, transparent: true, opacity: 0.15, depthWrite: false,
  });
  const wisps = [];
  for (let i = 0; i < WISP_COUNT; i++) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), steamMat.clone());
    w.userData.phase = (i / WISP_COUNT) * STEAM_LIFE;
    w.userData.ox = (Math.sin(i * 12.7) * 0.4) * (MUG_R * 0.4);
    w.userData.oz = (Math.cos(i * 7.3) * 0.4) * (MUG_R * 0.4);
    group.add(w);
    wisps.push(w);
  }

  group.userData.update = (t) => {
    // coffee swirl
    const rip = 1 + Math.sin(t * Math.PI * 2 * 0.7) * 0.012;
    coffee.scale.set(rip, rip, 1);
    sheen.rotation.z = t * 0.4;

    // steam
    for (const w of wisps) {
      const a = ((t + w.userData.phase) % STEAM_LIFE) / STEAM_LIFE; // 0..1 age
      const y = MUG_H - 0.1 + a * STEAM_LIFE * STEAM_RISE;
      
      // Rise in a soft spiral vortex
      const angle = t * 2.5 + a * 4.5 + w.userData.phase * 3;
      const radius = 0.08 + a * 0.25;
      w.position.set(
        w.userData.ox + Math.sin(angle) * radius,
        y,
        w.userData.oz + Math.cos(angle) * radius
      );
      
      // Elongate on Y to simulate wispy steam
      const s = 0.5 + a * 1.8;
      w.scale.set(s, s * 2.2, s);
      w.material.opacity = 0.18 * Math.sin(a * Math.PI); // fade in then out
    }
  };

  group.userData.parts = { coffee, handle, wisps };
  group.position.y = -1.1;
  group.scale.setScalar(1.6);
  return group;
}

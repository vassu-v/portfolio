// ============================================================================
// DESK LAMP — articulated architect lamp with a real warm light source
// ----------------------------------------------------------------------------
// ANIMATION MAP
//   swivel  — head + upper arm drift slowly (±4°, 9s) like someone nudged it
//   flicker — bulb intensity micro-flickers (filament feel, keep subtle)
//   toggle  — userData.setOn(true/false) switches the lamp
// TUNING
//   ARM1 2.2 · ARM2 1.9 · shade cone r 0.75 · SpotLight intensity 6, warm
//   0xffd9a0 — past ~9 it blows out whatever sits under it
// ============================================================================
import * as THREE from 'three';

const AMBER = 0xff9500;

export function getModelInfo() {
  return {
    name: 'Desk Lamp',
    description: 'Articulated architect desk lamp with a real warm spotlight, slow idle swivel and filament flicker. userData.setOn(bool) toggles it.',
    animationClips: ['swivel', 'flicker'],
  };
}

export function createModel() {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.4, metalness: 0.7, flatShading: true });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x8d9099, roughness: 0.3, metalness: 0.9 });

  // base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.22, 20), metalMat);
  base.position.y = 0.11;
  group.add(base);

  const ARM1 = 2.2, ARM2 = 1.9;

  // lower arm pivot
  const lower = new THREE.Group();
  lower.position.y = 0.22;
  lower.rotation.z = -0.5; // lean back
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, ARM1, 8), metalMat);
  arm1.position.y = ARM1 / 2;
  lower.add(arm1);
  const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), jointMat);
  lower.add(j1);
  group.add(lower);

  // upper arm pivot (elbow)
  const upper = new THREE.Group();
  upper.position.y = ARM1;
  upper.rotation.z = 1.6; // fold forward
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, ARM2, 8), metalMat);
  arm2.position.y = ARM2 / 2;
  upper.add(arm2);
  const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), jointMat);
  upper.add(j2);
  lower.add(upper);

  // spring hint along lower arm
  const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ARM1 * 0.7, 6), jointMat);
  spring.position.set(0.14, ARM1 * 0.45, 0);
  spring.rotation.z = 0.05;
  lower.add(spring);

  // head (shade + bulb) at end of upper arm
  const head = new THREE.Group();
  head.position.y = ARM2;
  // chain sums: lower(-0.5) + upper(1.6) + head = total tilt of the shade axis;
  // keep the sum near 0.3 so the opening points down toward the pool at +x
  head.rotation.z = -0.8;
  const j3 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), jointMat);
  head.add(j3);
  // ConeGeometry is apex-up with the open base at the BOTTOM — leave it
  // unrotated and the opening already faces down at the desk. (A rotation.x
  // of π here is what flips the shade upside down.)
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 16, 1, true), metalMat);
  shade.material = metalMat.clone();
  shade.material.side = THREE.DoubleSide;
  // cone apex is at local +0.5 — position so the apex meets the arm joint
  // (head origin), shade hanging below it, opening pointed at the desk
  shade.position.y = -0.45;
  head.add(shade);

  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd9a0, emissiveIntensity: 2.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), bulbMat);
  bulb.position.y = -0.75; // nestled just inside the shade opening
  head.add(bulb);
  upper.add(head);

  // real light: warm spot from the bulb, aimed at the desk
  const spot = new THREE.SpotLight(0xffd9a0, 6, 14, 0.7, 0.5, 1.5);
  spot.position.set(0, 0.1, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -4, 0);
  head.add(spot, spotTarget);
  spot.target = spotTarget;
  // soft fill so the lamp body itself catches some of its own light
  const fill = new THREE.PointLight(0xffd9a0, 0.7, 6, 2);
  fill.position.y = 0.2;
  head.add(fill);

  // lit pool on the "desk": faint disc under the head so the light reads
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.10, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  group.add(pool);
  // pool position is solved every frame from the bulb's actual world position,
  // so it always sits directly under wherever the head is aimed
  const _bw = new THREE.Vector3();
  function placePool() {
    bulb.getWorldPosition(_bw);
    group.worldToLocal(_bw);
    pool.position.set(_bw.x, 0.01, _bw.z);
  }

  let on = true;
  group.userData.setOn = (v) => {
    on = v;
    spot.intensity = v ? 6 : 0;
    fill.intensity = v ? 0.7 : 0;
    bulbMat.emissiveIntensity = v ? 2.2 : 0.05;
    pool.visible = v;
  };

  let manualControl = false;
  group.userData.setManualControl = (enabled) => {
    manualControl = enabled;
  };

  group.userData.setJointAngles = (lZ, uZ, hZ, bY) => {
    manualControl = true;
    if (lZ !== undefined && lZ !== null) lower.rotation.z = lZ;
    if (uZ !== undefined && uZ !== null) upper.rotation.z = uZ;
    if (hZ !== undefined && hZ !== null) head.rotation.z = hZ;
    if (bY !== undefined && bY !== null) lower.rotation.y = bY;
  };

  const lowerBase = lower.rotation.z, upperBase = upper.rotation.z, headBase = head.rotation.z;
  group.userData.update = (t) => {
    if (!manualControl) {
      const drift = Math.sin((t / 9) * Math.PI * 2);
      upper.rotation.z = upperBase + drift * 0.07;
      head.rotation.z = headBase - drift * 0.05;
      lower.rotation.y = Math.sin((t / 13) * Math.PI * 2) * 0.06;
    }
    group.updateMatrixWorld(true);
    placePool();
    if (on) {
      const f = 1 + Math.sin(t * 23) * 0.015 + Math.sin(t * 7.3) * 0.02;
      spot.intensity = 6 * f;
      bulbMat.emissiveIntensity = 2.2 * f;
      pool.material.opacity = 0.10 * f;
    }
  };

  group.userData.parts = { lower, upper, head, spot, bulb };
  group.position.set(-0.8, -1.6, 0);
  return group;
}

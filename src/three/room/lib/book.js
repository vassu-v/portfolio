// ============================================================================
// BOOK — open book lying flat, page-flip animation, writable pages
// ----------------------------------------------------------------------------
// ANIMATION MAP
//   pageFlip — a loose leaf periodically flips right-to-left (2.5s flip,
//              6s idle between), rotating about the spine (z axis)
//   edgeGlow — faint amber page-edge glow pulse (4s)
//   openClose — userData.setOpen(bool)/toggle() folds the right half over
//               the left like a closing lid (eased); flipping pauses while
//               closed and the loose leaf rides along with the cover
// TUNING
//   PAGE_W 1.4, PAGE_D 1.9 (depth, along the spine) · TILT 0.22 rad
//   userData.write(leftText, rightText) redraws the pages via CanvasTexture
//   userData.flip() forces one flip now
// GEOMETRY NOTES
//   The book lies in the XZ plane: spine runs along Z at x=0, halves extend
//   to ±X and tilt UP by TILT via pivot.rotation.z (hinge axis = spine).
//   Never hinge on rotation.y — that stands the book up like a greeting card.
// ============================================================================
import * as THREE from 'three';

const AMBER = 0xff9500;

export function getModelInfo() {
  return {
    name: 'Book',
    description: 'Low-poly open book lying flat with a periodic page-flip animation and writable pages via userData.write(left, right).',
    animationClips: ['pageFlip', 'edgeGlow', 'openClose'],
  };
}

function pageCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { canvas, ctx, tex };
}

function drawPage(ctx, w, h, lines) {
  ctx.fillStyle = '#f1e8d0'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2416'; ctx.font = 'bold 30px Georgia, serif';
  const margin = 36;
  const text = (lines || 'Once upon a\ntime, in a quiet\nlow-poly world\nlit by a single\namber lamp...').split('\n');
  text.forEach((line, i) => ctx.fillText(line, margin, 84 + i * 44));
}

export function createModel() {
  const group = new THREE.Group();
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x3a1f14, roughness: 0.6, metalness: 0.1, emissive: AMBER, emissiveIntensity: 0.04 });
  const pageEdgeMat = new THREE.MeshStandardMaterial({ color: 0xe4d8ba, roughness: 0.7, emissive: AMBER, emissiveIntensity: 0.05 });
  const spineTrimMat = new THREE.MeshStandardMaterial({ color: 0xd8a441, roughness: 0.35, metalness: 0.6, emissive: AMBER, emissiveIntensity: 0.15 });

  const PAGE_W = 1.4;   // half-width of the open book (one page)
  const PAGE_D = 1.9;   // depth along the spine
  const STACK_H = 0.12; // page block thickness
  const TILT = 0.22;    // upward tilt of each half about the spine

  // spine: rounded ridge running along z at the hinge line
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, PAGE_D + 0.08, 10, 1, false, 0, Math.PI), coverMat);
  spine.rotation.x = Math.PI / 2;
  spine.rotation.z = Math.PI; // flat side up, bulge down
  group.add(spine);
  // spine trim caps at both ends
  for (const z of [PAGE_D / 2 + 0.05, -(PAGE_D / 2 + 0.05)]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.06), spineTrimMat);
    cap.position.set(0, -0.02, z);
    group.add(cap);
  }

  function makeTexturedPageMat(tex) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide });
  }

  const left = pageCanvas();
  drawPage(left.ctx, left.canvas.width, left.canvas.height, 'LEFT PAGE\n\nEdit me with\nuserData.write(l, r)');
  left.tex.needsUpdate = true;
  const right = pageCanvas();
  drawPage(right.ctx, right.canvas.width, right.canvas.height, 'RIGHT PAGE\n\nturn, turn,\nturn...');
  right.tex.needsUpdate = true;

  // one half = cover slab + page block + textured top page, hinged at spine
  function half(sign, tex) {
    const pivot = new THREE.Group();
    pivot.rotation.z = -sign * TILT; // each side tilts up away from the spine

    const cover = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W + 0.08, 0.05, PAGE_D + 0.1), coverMat);
    cover.position.set(sign * (PAGE_W / 2 + 0.02), 0, 0);
    pivot.add(cover);

    const block = new THREE.Mesh(new THREE.BoxGeometry(PAGE_W - 0.04, STACK_H, PAGE_D - 0.04), pageEdgeMat);
    block.position.set(sign * (PAGE_W / 2 - 0.01), 0.025 + STACK_H / 2, 0);
    pivot.add(block);

    const page = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W - 0.12, PAGE_D - 0.12), makeTexturedPageMat(tex));
    page.rotation.x = -Math.PI / 2; // lie flat, texture facing up
    page.position.set(sign * (PAGE_W / 2 - 0.01), 0.025 + STACK_H + 0.005, 0);
    pivot.add(page);

    group.add(pivot);
    return pivot;
  }

  half(-1, left.tex);
  const rightPivot = half(1, right.tex);

  // flipping leaf: a loose double-sided page hinged at the spine, normally
  // resting on the right block; sweeps over to the left during a flip
  const flip = pageCanvas();
  drawPage(flip.ctx, flip.canvas.width, flip.canvas.height, 'turn, turn,\nturn...');
  flip.tex.needsUpdate = true;
  const flipHinge = new THREE.Group();
  flipHinge.position.y = 0.025 + STACK_H;
  const flipLeaf = new THREE.Mesh(new THREE.PlaneGeometry(PAGE_W - 0.12, PAGE_D - 0.12), makeTexturedPageMat(flip.tex));
  flipLeaf.rotation.x = -Math.PI / 2;
  flipLeaf.position.x = PAGE_W / 2 - 0.01;
  flipHinge.add(flipLeaf);
  flipHinge.rotation.z = -TILT;
  group.add(flipHinge);

  // ---- page flip cycle ----
  const FLIP_DUR = 2.5, CYCLE = FLIP_DUR + 6;
  const REST = -TILT, END = Math.PI + TILT; // sweep from lying-right to lying-left
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  group.userData.write = (leftText, rightText) => {
    drawPage(left.ctx, left.canvas.width, left.canvas.height, leftText);
    left.tex.needsUpdate = true;
    drawPage(right.ctx, right.canvas.width, right.canvas.height, rightText);
    right.tex.needsUpdate = true;
    drawPage(flip.ctx, flip.canvas.width, flip.canvas.height, rightText);
    flip.tex.needsUpdate = true;
  };
  let flipStart = null;
  group.userData.flip = () => { flipStart = -1; };

  // ---- open/close (like the laptop lid): fold the right half over the left ----
  const OPEN_POS = -TILT, CLOSED_POS = Math.PI + TILT;
  let lidTarget = OPEN_POS, lidCurrent = OPEN_POS;
  group.userData.setOpen = (open) => { lidTarget = open ? OPEN_POS : CLOSED_POS; };
  group.userData.toggle = () => { lidTarget = lidTarget === OPEN_POS ? CLOSED_POS : OPEN_POS; };
  group.userData.isOpen = () => lidTarget === OPEN_POS;

  group.userData.update = (t, dt) => {
    lidCurrent += (lidTarget - lidCurrent) * Math.min(1, (dt || 0.016) * 3);
    rightPivot.rotation.z = lidCurrent;
    // the hinge sits at cover level, so a π fold would land the right half
    // BELOW the left one — lift it by its own thickness as it folds so it
    // comes to rest on top of the left block like a real closing cover
    const progress = (lidCurrent - OPEN_POS) / (CLOSED_POS - OPEN_POS);
    rightPivot.position.y = progress * (0.05 + STACK_H) * 2;
    const closing = Math.abs(lidCurrent - OPEN_POS) > 0.05;
    if (closing) {
      // page flipping pauses while the book is closing/closed;
      // the loose leaf rides along with the right half
      flipHinge.rotation.z = lidCurrent;
      flipHinge.position.y = 0.025 + STACK_H + progress * (0.05 + STACK_H);
      flipLeaf.scale.y = 1;
      return;
    }
    flipHinge.position.y = 0.025 + STACK_H;
    const cyclePos = flipStart !== null ? (flipStart < 0 ? 0 : t - flipStart) : (t % CYCLE);
    if (flipStart !== null && flipStart < 0) flipStart = t;
    if (cyclePos < FLIP_DUR) {
      const p = ease(cyclePos / FLIP_DUR);
      flipHinge.rotation.z = REST + p * (END - REST);
      flipLeaf.scale.y = 1 - Math.sin(p * Math.PI) * 0.12; // subtle curl
    } else {
      flipHinge.rotation.z = REST;
      flipLeaf.scale.y = 1;
      if (flipStart !== null && cyclePos > FLIP_DUR + 0.1) flipStart = null;
    }
    const glow = 0.05 + 0.05 * Math.sin((t / 4) * Math.PI * 2);
    pageEdgeMat.emissiveIntensity = glow;
  };

  group.userData.parts = { spine, flipLeaf };
  group.position.y = -0.4;
  return group;
}

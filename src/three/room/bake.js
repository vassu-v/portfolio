import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Collapses every static mesh under `root` into one mesh per material.
// Library models are built from dozens of small parts (the keyboard alone is
// ~190 meshes); each part is a draw call in every pass (main + each shadow
// map), which is what made the room crawl on integrated GPUs. Meshes inside a
// `keep` subtree (animated parts) are left untouched.
export function bakeStatic(root, { keep = [], hide = false } = {}) {
  root.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const keepSet = new Set(keep.filter(Boolean))
  const buckets = new Map()
  const victims = []

  const kept = o => {
    for (let p = o; p && p !== root; p = p.parent) if (keepSet.has(p)) return true
    return false
  }

  root.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.visible || kept(o) || o.userData.wall || o.userData.noBake || o.name === 'baked') return
    if (Array.isArray(o.material) || o.material.transparent || o.morphTargetInfluences) return
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)
    const g = normalise(o.geometry.clone().applyMatrix4(m))
    if (m.determinant() < 0) flip(g)
    const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '')
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] })
    buckets.get(key).geos.push(g)
    victims.push(o)
  })

  if (victims.length < 2) return root
  // React-owned meshes (JSX) are hidden rather than detached so r3f can still
  // unmount them cleanly; library models are plain objects and can be removed.
  for (const o of victims) hide ? (o.visible = false) : o.removeFromParent()
  for (const { mat, cast, recv, geos } of buckets.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false)
    if (!merged) continue
    const mesh = new THREE.Mesh(merged, mat)
    mesh.castShadow = cast
    mesh.receiveShadow = recv
    mesh.name = 'baked'
    root.add(mesh)
  }
  // empty groups left behind cost nothing to draw, but prune for tidiness
  return root
}

// Mirrored transforms invert winding; swap two corners of every triangle.
function flip(g) {
  for (const attr of Object.values(g.attributes)) {
    const a = attr.array, n = attr.itemSize
    for (let i = 0; i < attr.count; i += 3) {
      for (let k = 0; k < n; k++) { const t = a[i * n + k]; a[i * n + k] = a[(i + 2) * n + k]; a[(i + 2) * n + k] = t }
    }
  }
}

// mergeGeometries needs identical attribute sets and index-ness.
function normalise(g) {
  if (g.index) g = g.toNonIndexed()
  for (const name of Object.keys(g.attributes)) {
    if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
  }
  if (!g.attributes.normal) g.computeVertexNormals()
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  g.morphAttributes = {}
  g.clearGroups()
  return g
}

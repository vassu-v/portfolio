import { useRef } from 'react'
import * as THREE from 'three'
import { room, useRoom, closeLayer, inHand } from './store'

// Library models ship in a stylised "lighting world" look: faint amber
// emissive on every surface, flat shading, and their own point lights. In a
// physically lit room those read as glowing plastic, so strip them back to
// plain PBR surfaces. Real glow sources (screens, LEDs, bulbs) are kept —
// they're the ones with a strong emissive.
export function prepModel(root, { keepLights = false, shadows = true } = {}) {
  const lights = []
  root.traverse(o => {
    if (o.isLight) { lights.push(o); return }
    if (!o.isMesh) return
    o.castShadow = shadows
    o.receiveShadow = shadows
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      if (!m) continue
      if (m.flatShading) { m.flatShading = false; m.needsUpdate = true }
      if (m.emissive && m.emissiveIntensity < 0.3 && !m.map) m.emissiveIntensity = 0
      // transmission forces a full extra scene render every frame (and, with
      // renderer tone mapping, a shader rebuild per frame) — for a few pixels
      // of lens glass. Plain transparency reads the same at this size.
      if (m.transmission > 0) {
        m.opacity = Math.min(m.opacity, 1 - m.transmission * 0.6)
        m.transparent = true
        m.transmission = 0
        m.needsUpdate = true
      }
    }
  })
  if (!keepLights) lights.forEach(l => { l.intensity = 0; l.visible = false })
  return root
}

export function fitToHeight(obj, size, axis = 'x') {
  const box = new THREE.Box3().setFromObject(obj)
  const s = new THREE.Vector3()
  box.getSize(s)
  return size / s[axis]
}

// Wraps any object so it reacts to hover/click once the visitor is in
// explore mode (scroll intro finished) or already focused on it.
// `always`: toys (lamp, chair, headphones) respond even before explore mode.
export function Hotspot({ id, label, onClick, children, enabled = true, always = false, ...props }) {
  const explore = useRoom(s => s.explore)
  const focus = useRoom(s => s.focus)
  const active = enabled && (always || explore || focus === id)
  const over = useRef(false)

  const enter = e => {
    if (!active) return
    e.stopPropagation()
    over.current = true
    room.set({ hover: { id, label } })
    document.body.classList.add('room-hover')
  }
  const leave = e => {
    if (!over.current) return
    e.stopPropagation()
    over.current = false
    if (room.get().hover?.id === id) room.set({ hover: null })
    document.body.classList.remove('room-hover')
  }
  const click = e => {
    // an object that's already open swallows clicks on itself (e.g. the cork
    // around a pulled card) — treat those as "click away" too
    if (!active) { if (inHand(room.get()) === id) { e.stopPropagation(); closeLayer() } return }
    e.stopPropagation()
    onClick?.(e)
  }

  return (
    <group name={id} {...props} onPointerOver={enter} onPointerOut={leave} onClick={click}>
      {children}
    </group>
  )
}

export const damp = (a, b, k, dt) => THREE.MathUtils.damp(a, b, k, dt)

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { live, useRoom } from './store'
import { anchors } from './Props'
import { BOARD } from './Corkboard'
import { BACK } from './Room'

const V = (x, y, z) => new THREE.Vector3(x, y, z)

// Fixed shots. Scroll path: screen close-up → pull back over the keyboard →
// rise and swing out to the establishing shot of the whole corner.
const OVERVIEW = { pos: V(1.25, 1.62, 1.55), look: V(-0.15, 0.95, -0.6) }
// Portrait screens: closer, lower, aimed at the desk centre so the lamp and
// drawer stay in frame instead of a third of the screen being bare wall.
const OVERVIEW_TALL = { pos: V(0.85, 1.38, 1.05), look: V(0.12, 0.88, -0.62) }
const FOCUS = {
  drawer:    { pos: V(0.66, 1.2, 0.36),  look: V(0.55, 0.62, -0.28) },
  diary:     { pos: V(-0.38, 1.13, -0.1), look: V(-0.53, 0.75, -0.52) },
  corkboard: { pos: V(BOARD.x, BOARD.y - 0.02, BACK + 0.98), look: V(BOARD.x, BOARD.y, BACK) },
  phone:     { pos: V(0.66, 1.02, -0.08), look: V(0.56, 0.85, -0.44) },
  sheet:     { pos: V(0.62, 1.16, 0.3),  look: V(0.55, 0.96, -0.17) },
  card:      { pos: V(BOARD.x, BOARD.y - 0.02, BACK + 0.75), look: V(BOARD.x, BOARD.y, BACK) },
}

const ease = t => 1 - Math.pow(1 - t, 3)
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function CameraRig() {
  const { camera, size } = useThree()
  const focus = useRoom(s => s.focus)
  const folder = useRoom(s => s.folder)
  const card = useRoom(s => s.card)
  const pos = useRef(V(1.0, 1.25, 0.9))
  const look = useRef(V(-0.17, 0.86, -0.8))
  const tmp = useMemo(() => ({ sp: V(0, 0, 0), sn: V(0, 0, 1), close: V(0, 0, 0), mid: V(0, 0, 0), a: V(0, 0, 0), b: V(0, 0, 0) }), [])

  useFrame((_, dt) => {
    const aspect = size.width / size.height
    const fov = aspect < 0.8 ? 62 : aspect < 1.2 ? 50 : 36
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }

    // screen anchor in world space
    anchors.screen.getWorldPosition(tmp.sp)
    tmp.sn.set(0, 0, 1).applyQuaternion(anchors.screen.getWorldQuaternion(new THREE.Quaternion()))
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect)
    const fitW = 0.29 / 0.86 / 2 / Math.tan(hfov / 2)
    const fitH = 0.185 / 0.8 / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2))
    const dist = Math.max(fitW, fitH)
    tmp.close.copy(tmp.sp).addScaledVector(tmp.sn, dist)

    const target = tmp.a, at = tmp.b
    const f = focus === 'drawer' && folder >= 0 ? FOCUS.sheet : focus === 'corkboard' && card >= 0 ? FOCUS.card : FOCUS[focus]
    if (focus === 'laptop') {
      target.copy(tmp.sp).addScaledVector(tmp.sn, dist * 1.35)
      at.copy(tmp.sp)
    } else if (f) {
      target.copy(f.pos)
      at.copy(f.look)
    } else {
      // load-in: drift from a soft wide view into the screen
      const intro = ease(live.intro)
      const s = live.scroll
      tmp.mid.set(tmp.sp.x + 0.25, tmp.sp.y + 0.22, tmp.sp.z + 0.75)
      if (s < 0.45) {
        const k = easeInOut(THREE.MathUtils.smoothstep(s, 0.1, 0.45))
        target.copy(tmp.close).lerp(tmp.mid, k)
        at.copy(tmp.sp).lerp(V(tmp.sp.x, tmp.sp.y - 0.08, tmp.sp.z), k)
      } else {
        const k = easeInOut(THREE.MathUtils.smoothstep(s, 0.45, 0.95))
        const ov = aspect < 0.8 ? OVERVIEW_TALL : OVERVIEW
        target.copy(tmp.mid).lerp(ov.pos, k)
        at.copy(V(tmp.sp.x, tmp.sp.y - 0.08, tmp.sp.z)).lerp(ov.look, k)
      }
      if (intro < 1) {
        const start = V(tmp.sp.x + 0.55, tmp.sp.y + 0.35, tmp.sp.z + 1.35)
        target.lerpVectors(start, target, intro)
      }
      const par = THREE.MathUtils.smoothstep(s, 0.5, 1) * 0.08 + 0.006
      target.x += live.pointer.x * par
      target.y += live.pointer.y * par * 0.6
    }

    const k = focus ? 3.2 : 6
    pos.current.x = THREE.MathUtils.damp(pos.current.x, target.x, k, dt)
    pos.current.y = THREE.MathUtils.damp(pos.current.y, target.y, k, dt)
    pos.current.z = THREE.MathUtils.damp(pos.current.z, target.z, k, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, at.x, k, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, at.y, k, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, at.z, k, dt)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })

  return null
}

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { room, live, useRoom, inHand } from './store'
import { anchors } from './Props'
import { BOARD } from './Corkboard'
import { BACK } from './Room'
import { TOUR as TOUR_STOPS, tourU } from './tourData'

const V = (x, y, z) => new THREE.Vector3(x, y, z)

// The framed photo on the shelf (world centre + facing) — the tour opens on it.
export const PHOTO = { center: V(-0.432, 1.712, -0.895), normal: V(Math.sin(0.12), 0.08, Math.cos(0.12)).normalize() }

const OVERVIEW = { pos: V(1.3, 1.6, 1.62), look: V(-0.05, 0.85, -0.6) }
// Portrait screens: closer, lower, aimed at the desk centre so the lamp and
// drawer stay in frame instead of a third of the screen being bare wall.
const OVERVIEW_TALL = { pos: V(0.85, 1.38, 1.05), look: V(0.12, 0.88, -0.62) }

// The scroll tour (order in tourData.js). The camera holds at each stop for
// the first part of its scroll segment, then travels to the next.
const SHOTS = {
  intro: { pos: PHOTO.center.clone().addScaledVector(PHOTO.normal, 0.5), look: PHOTO.center.clone().add(V(0, 0.022, 0)) },
  experience: { pos: V(BOARD.x - 0.06, BOARD.y + 0.15, BACK + 1.45), look: V(BOARD.x - 0.05, BOARD.y + 0.19, BACK) },
  wins: { pos: V(BOARD.x - 0.08, BOARD.y - 0.12, BACK + 1.2), look: V(BOARD.x - 0.12, BOARD.y - 0.19, BACK) },
  // pulled back far enough that the drawer front (to shut it) is in frame
  projects: { pos: V(0.74, 1.22, 0.68), look: V(0.55, 0.58, -0.2) },
  diary: { pos: V(-0.47, 1.1, -0.27), look: V(-0.53, 0.755, -0.47) },
  ping: { pos: V(0.3, 1.22, 0.42), look: V(0.26, 0.8, -0.56) },
  finale: { pos: V(0.17, 1.22, 0.3), look: V(0.17, 0.84, -0.7) },
  free: { pos: OVERVIEW.pos, look: OVERVIEW.look },
}
const TOUR = TOUR_STOPS.map(({ id }) => ({ id, ...SHOTS[id] }))

const FOCUS = {
  drawer:    { pos: V(0.74, 1.22, 0.68), look: V(0.55, 0.58, -0.2) },
  diary:     { pos: V(-0.47, 1.1, -0.27), look: V(-0.53, 0.755, -0.47) },
  corkboard: { pos: V(BOARD.x, BOARD.y - 0.02, BACK + 1.85), look: V(BOARD.x, BOARD.y, BACK) },
  phone:     { pos: V(0.39, 0.9, -0.32), look: V(0.5, 0.83, -0.6) },
  sheet:     { pos: V(0.66, 1.2, 0.5),  look: V(0.56, 0.98, -0.15) },
  sides:     { pos: V(0.78, 1.0, 0.42), look: V(0.55, 0.4, -0.12) },
  sidecard:  { pos: V(0.66, 0.86, 0.42), look: V(0.55, 0.58, -0.04) },
  card:      { pos: V(BOARD.x, BOARD.y - 0.02, BACK + 1.02), look: V(BOARD.x, BOARD.y - 0.02, BACK) },
}

const ease = t => 1 - Math.pow(1 - t, 3)
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// scroll 0…1 → which stop, and how far towards the next
export function tourAt(s) {
  const u = tourU(s)
  const i = Math.min(TOUR.length - 2, Math.floor(u))
  const f = u - i
  // the opening holds longer (the name dissolve plays out first)
  const k = easeInOut(THREE.MathUtils.smoothstep(f, i === 0 ? 0.72 : 0.3, 0.97))
  return { i, f, k, stop: TOUR[f < (i === 0 ? 0.86 : 0.62) ? i : i + 1].id }
}

export default function CameraRig() {
  const { camera, size, gl } = useThree()
  const focus = useRoom(s => s.focus)
  const folder = useRoom(s => s.folder)
  const pin = useRoom(s => s.pin)
  const side = useRoom(s => s.side)
  const pos = useRef(TOUR[0].pos.clone().addScaledVector(PHOTO.normal, 0.35))
  const look = useRef(TOUR[0].look.clone())
  const tmp = useMemo(() => ({ sp: V(0, 0, 0), sn: V(0, 0, 1), a: V(0, 0, 0), b: V(0, 0, 0), c: V(0, 0, 0), q: new THREE.Quaternion() }), [])

  // free-roam stop: drag to pan / tilt the view (a drag never counts as a click)
  const look2 = useRef({ yaw: 0, pitch: 0, ty: 0, tp: 0 })
  useEffect(() => {
    const el = gl.domElement
    let down = null, dragged = false
    const can = () => !room.get().focus && room.get().tourStop === 'free'
    const pd = e => { if (can() && e.button === 0) { down = { x: e.clientX, y: e.clientY }; dragged = false } }
    const pm = e => {
      if (!down) return
      const dx = e.clientX - down.x, dy = e.clientY - down.y
      if (!dragged && Math.hypot(dx, dy) < 6) return
      dragged = true
      const l = look2.current
      l.ty = THREE.MathUtils.clamp(l.ty - (e.movementX || 0) * 0.0035, -0.75, 0.75)
      if (e.pointerType !== 'touch') l.tp = THREE.MathUtils.clamp(l.tp - (e.movementY || 0) * 0.003, -0.35, 0.3)
      document.body.style.cursor = 'grabbing'
    }
    const pu = () => { down = null; document.body.style.cursor = '' }
    const click = e => { if (dragged) { dragged = false; e.stopPropagation() } }
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    window.addEventListener('click', click, true)
    el.style.touchAction = 'pan-y'
    return () => { el.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('click', click, true) }
  }, [gl])

  useFrame((_, dt) => {
    const aspect = size.width / size.height
    const fov = aspect < 0.8 ? 62 : aspect < 1.2 ? 50 : 36
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    const tall = aspect < 1
    // narrow screens see less sideways — back off along the view line
    const backOff = (t, a, m = 1.1) => { if (tall) t.sub(a).multiplyScalar(1 + (1 - aspect) * m).add(a) }

    const target = tmp.a, at = tmp.b
    // the tour stop is tracked even while something is open: scrolling on
    // always wins — it files away whatever was in your hands
    const tour = tourAt(live.scroll)
    const st = room.get()
    if (st.tourStop !== tour.stop || st.explore !== (tour.stop !== 'intro')) {
      const leaving = st.tourStop !== tour.stop
      room.set({ tourStop: tour.stop, explore: tour.stop !== 'intro', ...(leaving ? { focus: null, folder: -1, pin: null, side: -1, photo: -1, drawerShut: false, diaryShut: false } : {}), ...(TOUR_STOPS.findIndex(t => t.id === tour.stop) > 3 && !st.hireSeen ? { hireSeen: true } : {}) })
    }
    const hand = inHand(room.get())
    const f = hand === 'drawer' && folder >= 0 ? FOCUS.sheet : hand === 'corkboard' && pin ? FOCUS.card : focus === 'sides' && side >= 0 ? FOCUS.sidecard : FOCUS[focus]
    if (focus === 'laptop') {
      anchors.screen.getWorldPosition(tmp.sp)
      tmp.sn.set(0, 0, 1).applyQuaternion(anchors.screen.getWorldQuaternion(tmp.q))
      const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect)
      const fitW = 0.29 / 0.86 / 2 / Math.tan(hfov / 2)
      const fitH = 0.185 / 0.8 / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2))
      target.copy(tmp.sp).addScaledVector(tmp.sn, Math.max(fitW, fitH) * 1.35)
      at.copy(tmp.sp)
    } else if (f) {
      target.copy(f.pos)
      at.copy(f.look)
      backOff(target, at)
    } else {
      const { i, k, stop } = tour
      const a = TOUR[i], b = TOUR[i + 1]
      const ov = tall ? OVERVIEW_TALL : OVERVIEW
      target.copy(a.id === 'free' ? ov.pos : a.pos).lerp(b.id === 'free' ? ov.pos : b.pos, k)
      at.copy(a.id === 'free' ? ov.look : a.look).lerp(b.id === 'free' ? ov.look : b.look, k)
      if (b.id !== 'free' || k < 1) backOff(target, at, i === 0 && k < 0.5 ? 0.5 : 1.1)
      // load-in: settle forward onto the photo
      const intro = ease(live.intro)
      if (intro < 1) target.addScaledVector(PHOTO.normal, 0.35 * (1 - intro))
      const par = (stop === 'free' ? 0.08 : 0.012) * (1 - (i === 0 ? 1 - k : 0) * 0.6)
      target.x += live.pointer.x * par
      target.y += live.pointer.y * par * 0.6
      // pan / tilt offsets from dragging (eased back to centre off the free stop)
      const l = look2.current
      if (stop !== 'free') { l.ty = 0; l.tp = 0 }
      l.yaw = THREE.MathUtils.damp(l.yaw, l.ty, 8, dt)
      l.pitch = THREE.MathUtils.damp(l.pitch, l.tp, 8, dt)
      if (Math.abs(l.yaw) > 0.0005 || Math.abs(l.pitch) > 0.0005) {
        tmp.c.copy(at).sub(target)
        const right = tmp.sn.set(0, 1, 0).cross(tmp.c).normalize()
        tmp.c.applyAxisAngle(V(0, 1, 0), l.yaw).applyAxisAngle(right, -l.pitch)
        at.copy(target).add(tmp.c)
      }
    }

    const k = f || focus === 'laptop' ? 3.2 : 6
    pos.current.x = THREE.MathUtils.damp(pos.current.x, target.x, k, dt)
    pos.current.y = THREE.MathUtils.damp(pos.current.y, target.y, k, dt)
    pos.current.z = THREE.MathUtils.damp(pos.current.z, target.z, k, dt)
    look.current.x = THREE.MathUtils.damp(look.current.x, at.x, k, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, at.y, k, dt)
    look.current.z = THREE.MathUtils.damp(look.current.z, at.z, k, dt)
    camera.position.copy(pos.current)
    camera.lookAt(look.current)

    // where the photo is on the page — the intro's dark vignette centres on it
    camera.updateMatrixWorld()
    tmp.c.copy(PHOTO.center).project(camera)
    live.photoPx = [(tmp.c.x + 1) / 2 * size.width, (1 - tmp.c.y) / 2 * size.height]
  })

  return null
}

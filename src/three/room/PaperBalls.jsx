import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { prepModel } from './common'
import { room, useRoom, wake, dirtyShadows } from './store'
import { BACK, LEFT, RIGHT, FRONT } from './Room'
import { DESK } from './Desk'

const mods = import.meta.glob('./props/bin.js', { eager: true })
const createPaperBall = mods['./props/bin.js']?.createPaperBall

// Paper balls you can pick up and throw at the bin. Click a ball to hold it
// in front of you, then click where you want it to go. Tiny hand-rolled
// physics — gravity, bounces off floor / walls / desk / bin rim — because a
// physics engine for three balls would cost more than the whole room.
const R = 0.03
const BIN = { x: 0.98, z: -0.74, r: 0.123, h: 0.3, floor: 0.02 }
const G = 9.8
const START = [[0.97, 0.12, -0.75], [1.01, 0.1, -0.72], [0.86, R, -0.42]]

export default function PaperBalls() {
  const { camera, gl, scene } = useThree()
  const explore = useRoom(s => s.explore)
  const models = useMemo(() => (createPaperBall ? [1, 2, 3].map(seed => {
    const m = prepModel(createPaperBall({ seed }))
    m.traverse(o => { o.userData.ball = true })
    return m
  }) : []), [])
  const balls = useMemo(() => START.map(p => ({ pos: new THREE.Vector3(...p), vel: new THREE.Vector3(), spin: new THREE.Vector3(), state: 'rest', inBin: p[1] > 0.05 })), [])
  const refs = useRef([])
  const swallow = useRef(false)
  const tmp = useMemo(() => ({ f: new THREE.Vector3(), d: new THREE.Vector3(), ray: new THREE.Raycaster(), ndc: new THREE.Vector2() }), [])

  // while a ball is held, the next click anywhere throws it — and that click
  // must not also open whatever object happens to be under the cursor
  useEffect(() => {
    const down = e => {
      const held = balls.find(b => b.state === 'held')
      if (!held || e.button !== 0) return
      const rect = gl.domElement.getBoundingClientRect()
      tmp.ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      tmp.ray.setFromCamera(tmp.ndc, camera)
      // aim at what was clicked: solve a lob that lands there (aiming at the
      // bin means its mouth), plus a little human wobble
      const hit = tmp.ray.intersectObjects(scene.children, true).find(h => !h.object.userData.ball)
      const target = hit ? hit.point.clone() : tmp.ray.ray.at(2, new THREE.Vector3())
      if (Math.hypot(target.x - BIN.x, target.z - BIN.z) < BIN.r + 0.04 && target.y < BIN.h + 0.05) target.set(BIN.x, BIN.h - 0.06, BIN.z)
      target.x += (Math.random() - 0.5) * 0.09
      target.z += (Math.random() - 0.5) * 0.09
      const span = target.clone().sub(held.pos)
      const t = 0.45 + Math.hypot(span.x, span.z) * 0.22
      held.vel.copy(span).divideScalar(t)
      held.vel.y += 0.5 * G * t
      held.spin.set(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7)
      held.state = 'flying'
      held.flew = 0
      swallow.current = true
      room.set({ hover: null })
    }
    const click = e => {
      if (!swallow.current) return
      swallow.current = false
      e.stopPropagation()
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('click', click, true)
    return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('click', click, true) }
  }, [balls, camera, gl, scene, tmp])

  useEffect(() => {
    if (room.get().debug) Object.assign(window, { __balls: balls, __cam: camera })
  }, [balls, camera])

  const toast = text => room.set({ toast: { text, at: performance.now() } })

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    let moving = false
    balls.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      if (b.state === 'held') {
        // ride along just below and in front of the camera
        camera.getWorldDirection(tmp.f)
        tmp.d.copy(camera.position).addScaledVector(tmp.f, 0.32)
        tmp.d.y -= 0.09
        b.pos.lerp(tmp.d, 1 - Math.exp(-dt * 18))
        g.rotation.y += dt * 0.8
        moving = true
      } else if (b.state === 'flying') {
        moving = true
        b.flew += dt
        const prevY = b.pos.y
        b.vel.y -= G * dt
        b.pos.addScaledVector(b.vel, dt)
        g.rotation.x += b.spin.x * dt; g.rotation.y += b.spin.y * dt; g.rotation.z += b.spin.z * dt
        // bin: through the mouth → in; on the rim → knocked away
        const dx = b.pos.x - BIN.x, dz = b.pos.z - BIN.z, dist = Math.hypot(dx, dz)
        if (prevY >= BIN.h && b.pos.y < BIN.h && b.vel.y < 0) {
          if (dist < BIN.r - R * 0.6) { b.inBin = true; b.vel.x *= 0.2; b.vel.z *= 0.2; toast(b.flew > 0.6 ? 'nothing but net.' : 'in. nice.') }
          else if (dist < BIN.r + R) { const k = 1.6 / Math.max(dist, 0.001); b.vel.x += dx * k; b.vel.z += dz * k; b.vel.y *= -0.35; b.pos.y = BIN.h + 0.001 }
        }
        if (b.inBin) {
          // stay inside the basket
          if (dist > BIN.r - R) { b.pos.x = BIN.x + (dx / dist) * (BIN.r - R); b.pos.z = BIN.z + (dz / dist) * (BIN.r - R); b.vel.x *= -0.3; b.vel.z *= -0.3 }
          if (b.pos.y < BIN.floor + R) { b.pos.y = BIN.floor + R; b.vel.set(0, 0, 0) }
        } else if (b.pos.y < BIN.h && dist < BIN.r + R && dist > BIN.r - R) {
          // hit the outside wall of the bin
          const k = (BIN.r + R) / dist
          b.pos.x = BIN.x + dx * k; b.pos.z = BIN.z + dz * k
          b.vel.x *= -0.4; b.vel.z *= -0.4
        }
        // desk top
        if (b.pos.x > DESK.x0 && b.pos.x < DESK.x1 && b.pos.z > DESK.z0 && b.pos.z < DESK.z1 && prevY >= DESK.top + R && b.pos.y < DESK.top + R) {
          b.pos.y = DESK.top + R; b.vel.y *= -0.3; b.vel.x *= 0.7; b.vel.z *= 0.7
        }
        // floor + walls
        if (b.pos.y < R) { b.pos.y = R; b.vel.y *= -0.32; b.vel.x *= 0.75; b.vel.z *= 0.75; b.spin.multiplyScalar(0.6) }
        if (b.pos.x < LEFT + R || b.pos.x > RIGHT - R) { b.pos.x = THREE.MathUtils.clamp(b.pos.x, LEFT + R, RIGHT - R); b.vel.x *= -0.4 }
        if (b.pos.z < BACK + R || b.pos.z > FRONT - R) { b.pos.z = THREE.MathUtils.clamp(b.pos.z, BACK + R, FRONT - R); b.vel.z *= -0.4 }
        const onGround = b.pos.y <= R + 0.0005 || (b.inBin && b.pos.y <= BIN.floor + R + 0.0005) || Math.abs(b.pos.y - DESK.top - R) < 0.0005
        if (onGround && b.vel.lengthSq() < 0.004) {
          b.vel.set(0, 0, 0)
          b.state = 'rest'
          if (!b.inBin && b.flew > 0.3) toast(['so close.', 'off the rim.', 'airball.'][i % 3])
        }
        if (b.flew > 8) b.state = 'rest'
      }
      g.position.copy(b.pos)
    })
    if (moving) { wake(200); dirtyShadows(2) }
  })

  if (!models.length) return null
  return (
    <>
      {models.map((m, i) => (
        <group key={i} ref={el => (refs.current[i] = el)} position={START[i]}
          onPointerOver={e => {
            if (!explore || balls[i].state !== 'rest') return
            e.stopPropagation()
            room.set({ hover: { id: 'ball', label: 'pick it up — then click to throw' } })
          }}
          onPointerOut={() => room.get().hover?.id === 'ball' && room.set({ hover: null })}
          onClick={e => {
            if (!explore || balls[i].state !== 'rest' || balls.some(b => b.state === 'held')) return
            e.stopPropagation()
            balls[i].state = 'held'
            balls[i].inBin = false
            room.set({ hover: { id: 'ball', label: 'click where you want to throw it' } })
          }}>
          <primitive object={m} />
        </group>
      ))}
    </>
  )
}

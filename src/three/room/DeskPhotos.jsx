import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Hotspot, damp } from './common'
import { room, useRoom, dirtyShadows } from './store'

const Y = 0.75
// Loose prints scattered on the desk. Click one and it lifts up in front of
// the camera; click again (or anything else) and it drops back where it was.
export const PHOTOS = [
  { src: '/projects/lifi_exhibit.jpeg', pos: [-0.31, -0.665], rot: 0.42, caption: 'LiFi mesh prototype at the exhibition table', project: 'lifi-network' },
  { src: '/solder.jpeg', pos: [0.035, -0.335], rot: 0.22, caption: 'My solar station — built on my own' },
  { src: '/dbpc.jpg', pos: [0.705, -0.37], rot: -0.38, caption: "Quantum Qubit '25 — 3rd place, on stage" },
]
const W = 0.1, H = 0.075

function printTexture(src) {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 480
  const ctx = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, 640, 480)
  const img = new Image()
  img.onload = () => {
    const p = 22, w = 640 - p * 2, h = 480 - p * 2
    const s = Math.max(w / img.width, h / img.height)
    ctx.save(); ctx.beginPath(); ctx.rect(p, p, w, h); ctx.clip()
    ctx.drawImage(img, p + (w - img.width * s) / 2, p + (h - img.height * s) / 2, img.width * s, img.height * s)
    ctx.restore()
    // a little print wear
    const g = ctx.createLinearGradient(0, 0, 640, 480)
    g.addColorStop(0, 'rgba(255,240,210,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.08)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 640, 480)
    t.needsUpdate = true
  }
  img.src = src
  return t
}

function Print({ p, i }) {
  const ref = useRef()
  const picked = useRoom(s => s.photo === i)
  const { camera } = useThree()
  const tex = useMemo(() => printTexture(p.src), [p.src])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, H, 8, 1)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    for (let k = 0; k < pos.count; k++) pos.setY(k, Math.pow(Math.abs(pos.getX(k)) / (W / 2), 2) * 0.0025)
    g.computeVertexNormals()
    return g
  }, [])
  const rest = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(p.pos[0], Y + 0.0006 + i * 0.0002, p.pos[1])
    o.rotation.y = p.rot
    o.updateMatrix()
    return { pos: o.position.clone(), q: o.quaternion.clone() }
  }, [p, i])
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), fwd: new THREE.Vector3(), face: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)) }), [])

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.userData.k = damp(g.userData.k ?? 0, picked ? 1 : 0, 5, dt)
    const k = g.userData.k
    if (k < 0.001) { g.position.copy(rest.pos); g.quaternion.copy(rest.q); g.scale.setScalar(1); return }
    camera.getWorldDirection(tmp.fwd)
    tmp.p.copy(camera.position).addScaledVector(tmp.fwd, 0.42)
    tmp.q.copy(camera.quaternion).multiply(tmp.face)
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
    g.position.lerpVectors(rest.pos, tmp.p, e)
    g.position.y += Math.sin(e * Math.PI) * 0.06
    g.quaternion.slerpQuaternions(rest.q, tmp.q, e)
    g.scale.setScalar(1 + e * 1.05)
    if (k > 0.002 && k < 0.998) dirtyShadows(2)
  })

  return (
    <group ref={ref}>
      <Hotspot id={'photo-' + i} label={picked ? 'put it back' : 'a photo — pick it up'} onClick={() => room.set({ photo: room.get().photo === i ? -1 : i })}>
        <mesh geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial map={tex} roughness={0.45} side={THREE.DoubleSide} />
        </mesh>
      </Hotspot>
    </group>
  )
}

export default function DeskPhotos() {
  return PHOTOS.map((p, i) => <Print key={p.src} p={p} i={i} />)
}

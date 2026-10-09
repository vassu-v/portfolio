import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { EXP } from '../../components/Experience'
import { corkTexture, walnutTexture } from './textures'
import { Hotspot, damp } from './common'
import { room, useRoom, focusOn } from './store'
import { BACK } from './Room'

export const BOARD = { x: 0.36, y: 1.38, z: BACK + 0.012, w: 0.9, h: 0.6 }

// Layout on the board (local metres from centre), chronological string order.
const CARD_POS = [
  [0.27, 0.12, 0.06],   // Bits&Bytes
  [0.03, 0.14, -0.04],  // 4MQ
  [-0.25, -0.15, 0.05], // Beyond Rote
  [-0.3, 0.07, -0.07],  // Utsavy
  [0.17, -0.13, 0.03],  // Freelance
]
const CHRONO = [3, 2, 4, 1, 0]
const PHOTOS = [
  { src: '/dbpc.jpg', pos: [0.04, -0.17, -0.09], cap: 'quantum qubit · 3rd' },
  { src: '/projects/sarkarsathi_cm.jpg', pos: [0.37, -0.08, 0.08], cap: 'india innovates' },
  { src: '/solder.jpeg', pos: [-0.06, -0.06, -0.12], cap: 'late nights' },
]
const PIN_COLORS = ['#c0392b', '#C57B2B', '#2f6f8f', '#d4a017', '#4f7d4a']

function cardTexture(e) {
  const c = document.createElement('canvas')
  c.width = 600; c.height = 400
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const draw = () => {
    ctx.fillStyle = '#fbf7ee'
    ctx.fillRect(0, 0, 600, 400)
    ctx.strokeStyle = 'rgba(70,110,170,0.25)'
    ctx.lineWidth = 2
    for (let y = 120; y < 400; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke() }
    ctx.strokeStyle = 'rgba(200,60,60,0.45)'
    ctx.beginPath(); ctx.moveTo(0, 96); ctx.lineTo(600, 96); ctx.stroke()
    ctx.fillStyle = '#1d1712'
    ctx.font = 'italic 64px "Instrument Serif", serif'
    ctx.fillText(e.org, 30, 76)
    ctx.font = '600 44px Caveat, cursive'
    ctx.fillStyle = '#2a3550'
    ctx.fillText(e.primaryRole, 30, 158)
    ctx.fillStyle = '#7a4a1c'
    ctx.font = '500 26px "JetBrains Mono", monospace'
    ctx.fillText(e.period.toUpperCase(), 30, 246)
    ctx.fillStyle = '#5c5048'
    ctx.font = '400 24px "JetBrains Mono", monospace'
    ctx.fillText(e.type, 30, 290)
    if (e.live) {
      ctx.fillStyle = '#C57B2B'
      ctx.font = '600 40px Caveat, cursive'
      ctx.fillText('● now', 470, 340)
    }
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

function photoTexture(src, cap) {
  const c = document.createElement('canvas')
  c.width = 400; c.height = 480
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const draw = img => {
    ctx.fillStyle = '#f3f1ea'
    ctx.fillRect(0, 0, 400, 480)
    ctx.fillStyle = '#222'
    ctx.fillRect(24, 24, 352, 352)
    if (img) {
      const s = Math.max(352 / img.width, 352 / img.height)
      ctx.save(); ctx.beginPath(); ctx.rect(24, 24, 352, 352); ctx.clip()
      ctx.drawImage(img, 24 + (352 - img.width * s) / 2, 24 + (352 - img.height * s) / 2, img.width * s, img.height * s)
      ctx.restore()
    }
    ctx.fillStyle = '#2a2018'
    ctx.font = '600 40px Caveat, cursive'
    ctx.fillText(cap, 30, 440)
    tex.needsUpdate = true
  }
  draw(null)
  const img = new Image()
  img.onload = () => draw(img)
  img.src = src
  return tex
}

function Pin({ color, position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0012, 0.0012, 0.008, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.012]} castShadow>
        <sphereGeometry args={[0.0065, 16, 12]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
      </mesh>
    </group>
  )
}

function Card({ e, index, base }) {
  const ref = useRef()
  const hover = useRef(false)
  const focus = useRoom(s => s.focus)
  const sel = useRoom(s => s.card === index)
  const tex = useMemo(() => cardTexture(e), [e])
  const [x, y, rot] = base

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const lift = sel ? 1 : 0
    const h = hover.current && focus === 'corkboard' ? 1 : 0
    g.userData.k = damp(g.userData.k ?? 0, lift, 6, dt)
    g.userData.h = damp(g.userData.h ?? 0, h, 10, dt)
    const k = g.userData.k
    g.position.set(x * (1 - k), y * (1 - k) + 0.0, 0.004 + g.userData.h * 0.012 + k * 0.22)
    g.rotation.z = rot * (1 - Math.max(k, g.userData.h * 0.6))
    g.rotation.x = Math.sin(g.userData.h * Math.PI) * 0.04
    g.scale.setScalar(1 + k * 0.55)
  })

  return (
    <group
      ref={ref}
      onPointerOver={ev => { if (focus !== 'corkboard') return; ev.stopPropagation(); hover.current = true; room.set({ hover: { id: 'card', label: `${e.org} — ${e.primaryRole}` } }) }}
      onPointerOut={ev => { if (!hover.current) return; ev.stopPropagation(); hover.current = false; room.set({ hover: null }) }}
      onClick={ev => { if (focus !== 'corkboard') return; ev.stopPropagation(); room.set({ card: room.get().card === index ? -1 : index }) }}
    >
      <mesh castShadow receiveShadow>
        <planeGeometry args={[0.165, 0.11]} />
        <meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <Pin color={PIN_COLORS[index]} position={[0, 0.042, 0.001]} />
    </group>
  )
}

function Photo({ src, pos, cap, i }) {
  const tex = useMemo(() => photoTexture(src, cap), [src, cap])
  return (
    <group position={[pos[0], pos[1], 0.003 + i * 0.0005]} rotation={[0, 0, pos[2]]}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[0.1, 0.12]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
      <Pin color="#e9e4da" position={[0, 0.05, 0.001]} />
    </group>
  )
}

function Yarn() {
  const geo = useMemo(() => {
    const pts = CHRONO.map(i => new THREE.Vector3(CARD_POS[i][0], CARD_POS[i][1] + 0.042, 0.017))
    const path = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]
      path.push(a)
      path.push(new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 - 0.035, 0.012))
    }
    path.push(pts[pts.length - 1])
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path, false, 'centripetal'), 200, 0.0011, 5)
  }, [])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color="#b3261e" roughness={0.8} />
    </mesh>
  )
}

function HeaderNote() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 160
    const ctx = c.getContext('2d')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    const draw = () => {
      ctx.clearRect(0, 0, 512, 160)
      ctx.fillStyle = '#1d1712'
      ctx.font = 'italic 92px "Instrument Serif", serif'
      ctx.fillText('the work so far', 14, 104)
      ctx.strokeStyle = '#C57B2B'; ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(18, 130); ctx.quadraticCurveTo(250, 118, 470, 134); ctx.stroke()
      t.needsUpdate = true
    }
    draw()
    document.fonts?.ready.then(draw)
    return t
  }, [])
  return (
    <mesh position={[-0.24, 0.235, 0.002]} rotation={[0, 0, 0.02]}>
      <planeGeometry args={[0.32, 0.1]} />
      <meshStandardMaterial map={tex} transparent roughness={0.9} />
    </mesh>
  )
}

export default function Corkboard() {
  const focus = useRoom(s => s.focus)
  const cork = useMemo(() => new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.95 }), [])
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.5 }), [])
  const { w, h } = BOARD
  const f = 0.022

  return (
    <group position={[BOARD.x, BOARD.y, BOARD.z]}>
      <Hotspot id="corkboard" label="Corkboard — experience & wins" enabled={focus !== 'corkboard'} onClick={() => focusOn('corkboard')}>
        <mesh material={cork} receiveShadow castShadow>
          <boxGeometry args={[w, h, 0.012]} />
        </mesh>
        {[[0, h / 2 + f / 2, w + f * 2, f], [0, -h / 2 - f / 2, w + f * 2, f], [-w / 2 - f / 2, 0, f, h], [w / 2 + f / 2, 0, f, h]].map(([x, y, bw, bh], i) => (
          <RoundedBox key={i} args={[bw, bh, 0.026]} radius={0.004} position={[x, y, 0.004]} material={frame} castShadow receiveShadow />
        ))}
        <group position={[0, 0, 0.006]}>
          <HeaderNote />
          {PHOTOS.map((p, i) => <Photo key={p.src} {...p} i={i} />)}
          <Yarn />
          {EXP.map((e, i) => <Card key={e.org} e={e} index={i} base={CARD_POS[i]} />)}
        </group>
      </Hotspot>
    </group>
  )
}

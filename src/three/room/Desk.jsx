import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { PROJECTS } from '../../data/projects'
import { SIDE_PROJECTS } from '../../data/sideProjects'
import { walnutTexture } from './textures'
import { Hotspot, damp } from './common'
import { room, useRoom, focusOn } from './store'
import { goToStop } from './tourData'
import { decorateNote, squiggle } from './doodles'
import { BACK } from './Room'
import Baked from './Baked'

const SIDE_TRAVEL = 0.3
export const DESK = { x0: -0.78, x1: 0.78, z0: BACK + 0.02, z1: -0.28, top: 0.75, th: 0.035 }
const PED = { x0: 0.36, x1: 0.74, z0: DESK.z0 + 0.02, z1: DESK.z1 - 0.015 }
const DRAWER_TRAVEL = 0.36
const DRAWER_W = PED.x1 - PED.x0 - 0.02, DRAWER_D = PED.z1 - PED.z0 - 0.08
const D_HALF = DRAWER_D / 2
const SLOTS = 9
const slotZ = i => DRAWER_D / 2 - 0.04 - i * ((DRAWER_D - 0.06) / SLOTS)

// World position of a project's folder in the open drawer (dossier start pose).
export function folderWorld(projectIndex, out = new THREE.Vector3()) {
  return out.set(
    (PED.x0 + PED.x1) / 2,
    DESK.top - DESK.th - 0.095 + 0.045 + 0.12 - 0.06,
    (PED.z0 + PED.z1) / 2 + DRAWER_TRAVEL + slotZ(projectIndex * 2),
  )
}

function tabTexture(label, color) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#fbf8f2'
  ctx.fillRect(10, 10, 236, 44)
  ctx.fillStyle = '#211a14'
  ctx.font = '600 30px Caveat, cursive'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 18, 34)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  document.fonts?.ready.then(() => { ctx.fillStyle = '#fbf8f2'; ctx.fillRect(10, 10, 236, 44); ctx.fillStyle = '#211a14'; ctx.fillText(label, 18, 34); t.needsUpdate = true })
  return t
}

const TAB_COLORS = ['#F07A1A', '#5B8FAF', '#7a8f5a', '#a8483a', '#84D0E8', '#6d5a8a']

function Folder({ project, index, z, selected, onPick, open }) {
  const ref = useRef()
  const hoverRef = useRef(false)
  const kraft = useMemo(() => new THREE.MeshStandardMaterial({ color: index % 2 ? '#c8a774' : '#b8935e', roughness: 0.9, side: THREE.DoubleSide }), [index])
  const tab = useMemo(() => tabTexture(project ? project.name : '', TAB_COLORS[index % TAB_COLORS.length]), [project, index])
  const tabX = -0.1 + (index % 3) * 0.1

  useFrame((_, dt) => {
    if (!ref.current) return
    const lift = selected ? 0.12 : hoverRef.current ? 0.03 : 0
    ref.current.position.y = damp(ref.current.position.y, lift, 10, dt)
  })

  return (
    <group position={[0, 0, z]}>
      <group
        ref={ref}
        onPointerOver={e => { if (!project || !open) return; e.stopPropagation(); hoverRef.current = true; room.set({ hover: { id: 'folder', label: project.name } }) }}
        onPointerOut={e => { if (!hoverRef.current) return; e.stopPropagation(); hoverRef.current = false; room.set({ hover: null }) }}
        onClick={e => { if (!project || !open) return; e.stopPropagation(); onPick(index) }}
      >
        <mesh position={[0, -0.055, -0.006]} rotation={[0.06, 0, 0]} material={kraft} castShadow receiveShadow>
          <planeGeometry args={[0.3, 0.115]} />
        </mesh>
        <mesh position={[0, -0.055, 0.006]} rotation={[-0.06, 0, 0]} material={kraft} castShadow receiveShadow>
          <planeGeometry args={[0.3, 0.115]} />
        </mesh>
        {/* hanger rod resting on the drawer rails */}
        <mesh position={[0, 0.002, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.33, 6]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.4} />
        </mesh>
        {project && (
          <mesh position={[tabX, 0.012, 0.0075]} rotation={[-0.06, 0, 0]}>
            <planeGeometry args={[0.085, 0.022]} />
            <meshStandardMaterial map={tab} roughness={0.5} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function Drawer() {
  const ref = useRef()
  const focus = useRoom(s => s.focus)
  const folder = useRoom(s => s.folder)
  const tour = useRoom(s => s.tourStop)
  // at the projects stop it opens by itself, but it's still yours to shut
  const shut = useRoom(s => s.drawerShut)
  const open = (focus === 'drawer' || (!focus && tour === 'projects')) && !shut
  const carcass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 0.8 }), [])
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.5 }), [])

  const W = DRAWER_W, D = DRAWER_D, H = 0.12
  const folders = Array.from({ length: SLOTS }, (_, i) => (i % 2 === 0 ? PROJECTS[i / 2] : null) ?? null)

  useFrame((state, dt) => {
    if (!ref.current) return
    // slow and heavy, like a real drawer full of files
    ref.current.position.z = damp(ref.current.position.z, open ? DRAWER_TRAVEL : 0, 2, dt)
  })

  return (
    <group position={[(PED.x0 + PED.x1) / 2, DESK.top - DESK.th - 0.095, (PED.z0 + PED.z1) / 2]}>
      <group ref={ref}>
        <Hotspot id="drawer" always={open || shut} label={open ? 'close the drawer' : shut ? 'open the drawer' : 'Projects — the drawer'}
          onClick={() => {
            const s = room.get()
            if (s.folder >= 0) room.set({ folder: -1 })
            else if (open) room.set({ drawerShut: true })
            else if (shut) room.set({ drawerShut: false })
            else goToStop('projects')
          }}>
          {/* front panel + pull */}
          <RoundedBox args={[W + 0.016, 0.15, 0.02]} radius={0.003} position={[0, 0, D / 2 + 0.03]} material={front} castShadow receiveShadow />
          <mesh position={[0, 0.03, D / 2 + 0.048]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 12]} />
            <meshStandardMaterial color="#b8894a" metalness={0.9} roughness={0.28} />
          </mesh>
          {/* box — part of the click target, so any edge of the drawer shuts it */}
          <mesh position={[0, -0.065, 0]} material={carcass} receiveShadow><boxGeometry args={[W, 0.01, D]} /></mesh>
          <mesh position={[-W / 2, 0, 0]} material={carcass} castShadow receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
          <mesh position={[W / 2, 0, 0]} material={carcass} castShadow receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
          <mesh position={[0, 0, -D / 2]} material={carcass} receiveShadow><boxGeometry args={[W, H, 0.01]} /></mesh>
          <mesh position={[0, 0, D / 2 + 0.01]} material={carcass} receiveShadow><boxGeometry args={[W, H, 0.01]} /></mesh>
        </Hotspot>
        <group position={[0, 0.045, 0]}>
          {folders.map((p, i) => (
            <Folder
              key={i}
              index={p ? PROJECTS.indexOf(p) : i}
              project={p}
              z={slotZ(i)}
              open={open}
              selected={p && folder === PROJECTS.indexOf(p)}
              onPick={idx => room.set({ folder: room.get().folder === idx ? -1 : idx, page: 0 })}
            />
          ))}
        </group>
      </group>
    </group>
  )
}

function cardTexture(p, i) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 320
  const ctx = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const draw = () => {
    ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, 512, 320)
    ctx.strokeStyle = 'rgba(70,110,170,0.22)'; ctx.lineWidth = 2
    for (let y = 104; y < 320; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke() }
    ctx.strokeStyle = 'rgba(200,60,60,0.4)'; ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(512, 80); ctx.stroke()
    ctx.fillStyle = '#1d1712'; ctx.font = 'italic 50px "Instrument Serif", serif'; ctx.fillText(p.name, 24, 60)
    ctx.fillStyle = '#2a3550'; ctx.font = '600 34px Caveat, cursive'; ctx.fillText(p.line, 24, 136)
    const [col, word] = STATUS[p.status] || ['#8a7a6a', p.status || '']
    ctx.save(); ctx.translate(400, 262); ctx.rotate(-0.12)
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(-70, -26, 140, 44)
    ctx.fillStyle = col; ctx.font = '600 24px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(word.toUpperCase(), 0, 4)
    ctx.restore()
    ctx.fillStyle = '#a89a8a'; ctx.font = '400 20px "JetBrains Mono", monospace'; ctx.fillText(String(i + 1).padStart(2, '0'), 24, 296)
    t.needsUpdate = true
  }
  draw(); document.fonts?.ready.then(draw)
  return t
}
const STATUS = { shipped: ['#4f7d4a', 'shipped'], wip: ['#F07A1A', 'on it'], parked: ['#8a7a6a', 'parked'] }

function stickyTexture(lines) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const draw = () => {
    ctx.fillStyle = '#f7e27a'; ctx.fillRect(0, 0, 512, 512)
    decorateNote(ctx, 512, 512, lines.join(' '))
    ctx.fillStyle = '#7a3b14'; ctx.font = '700 88px Caveat, cursive'; ctx.fillText(lines[0], 36, 130)
    squiggle(ctx, 36, 150, ctx.measureText(lines[0]).width, '#F07A1A', 5)
    ctx.fillStyle = '#2a2018'; ctx.font = '600 64px Caveat, cursive'
    lines.slice(1).forEach((l, i) => ctx.fillText(l, 36, 232 + i * 74))
    t.needsUpdate = true
  }
  draw(); document.fonts?.ready.then(draw)
  return t
}

function IndexCard({ p, i, z, open }) {
  const ref = useRef()
  const hov = useRef(false)
  const sel = useRoom(s => s.side === i)
  const tex = useMemo(() => cardTexture(p, i), [p, i])
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.userData.k = damp(g.userData.k ?? 0, sel ? 1 : 0, 7, dt)
    g.userData.h = damp(g.userData.h ?? 0, hov.current && !sel ? 1 : 0, 10, dt)
    const k = g.userData.k
    g.position.y = g.userData.h * 0.02 + k * 0.2
    g.position.z = z + k * (D_HALF - z + 0.04)
    g.rotation.x = -0.18 * (1 - k) - 0.3 * k
  })
  return (
    <group ref={ref} position={[i % 2 ? 0.012 : -0.01, 0, z]}
      onPointerOver={e => { if (!open) return; e.stopPropagation(); hov.current = true; room.set({ hover: { id: 'side', label: p.name } }) }}
      onPointerOut={e => { if (!hov.current) return; e.stopPropagation(); hov.current = false; room.set({ hover: null }) }}
      onClick={e => { if (!open) return; e.stopPropagation(); room.set({ focus: 'sides', side: room.get().side === i ? -1 : i }) }}>
      <mesh position={[0, 0.036, 0]} castShadow receiveShadow>
        <planeGeometry args={[0.13, 0.081]} />
        <meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Second drawer: side projects. Same mechanics as the project drawer, but
// index cards instead of hanging files, and a sticky note on the front.
function SideDrawer({ y, h }) {
  const rich = useRoom(s => s.tier !== 'low')
  const ref = useRef()
  const focus = useRoom(s => s.focus)
  const open = focus === 'sides'
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.55, color: '#d8c9b8' }), [])
  const carcass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 0.8 }), [])
  const note = useMemo(() => stickyTexture(['side projects', 'not so serious —', 'just listed, or', "still on 'em"]), [])
  const W = DRAWER_W, D = DRAWER_D, H = h - 0.05
  const n = SIDE_PROJECTS.length
  const fill = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.position.z = damp(ref.current.position.z, open ? SIDE_TRAVEL : 0, 6, dt)
    // under the desk is the darkest spot in the room — a soft fill while open
    if (fill.current) fill.current.intensity = damp(fill.current.intensity, open ? 0.5 : 0, 5, dt)
  })
  return (
    <group position={[(PED.x0 + PED.x1) / 2, y, (PED.z0 + PED.z1) / 2]}>
      {rich && <pointLight ref={fill} position={[0.05, 0.3, SIDE_TRAVEL + 0.25]} color="#ffe9cf" distance={1.2} decay={2} intensity={0} />}
      <group ref={ref}>
        <Hotspot id="sides" label={open ? 'close the drawer' : 'Side projects — open the drawer'}
          onClick={() => (open ? room.set({ focus: null, side: -1 }) : focusOn('sides'))}>
          <RoundedBox args={[W + 0.016, h - 0.008, 0.02]} radius={0.003} position={[0, 0, D / 2 + 0.03]} material={front} castShadow receiveShadow />
          <mesh position={[0, h / 2 - 0.04, D / 2 + 0.048]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 12]} />
            <meshStandardMaterial color="#b8894a" metalness={0.9} roughness={0.28} />
          </mesh>
          <mesh position={[0.07, -0.04, D / 2 + 0.0405]} rotation={[0, 0, -0.06]}>
            <planeGeometry args={[0.11, 0.11]} />
            <meshStandardMaterial map={note} roughness={0.85} />
          </mesh>
        </Hotspot>
        <mesh position={[0, -H / 2, 0]} material={carcass} receiveShadow><boxGeometry args={[W, 0.01, D]} /></mesh>
        <mesh position={[-W / 2, 0, 0]} material={carcass} receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
        <mesh position={[W / 2, 0, 0]} material={carcass} receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
        <mesh position={[0, 0, -D / 2]} material={carcass} receiveShadow><boxGeometry args={[W, H, 0.01]} /></mesh>
        <group position={[0, -H / 2 + 0.005, 0]}>
          {SIDE_PROJECTS.map((p, i) => (
            <IndexCard key={i} p={p} i={i} open={open} z={D / 2 - 0.1 - i * ((D - 0.13) / Math.max(n, 6))} />
          ))}
        </group>
      </group>
    </group>
  )
}

export default function Desk() {
  const top = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.42, metalness: 0 }), [])
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 0.45, metalness: 0.7 }), [])
  const ped = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.55, color: '#d8c9b8' }), [])

  const cx = (DESK.x0 + DESK.x1) / 2, cz = (DESK.z0 + DESK.z1) / 2
  const w = DESK.x1 - DESK.x0, d = DESK.z1 - DESK.z0
  const legH = DESK.top - DESK.th
  const pw = PED.x1 - PED.x0, pd = PED.z1 - PED.z0
  const pcx = (PED.x0 + PED.x1) / 2, pcz = (PED.z0 + PED.z1) / 2

  return (
    <group>
      <Baked>
      <RoundedBox args={[w, DESK.th, d]} radius={0.006} smoothness={3} position={[cx, DESK.top - DESK.th / 2, cz]} material={top} castShadow receiveShadow />

      {/* left A-frame legs */}
      {[DESK.z0 + 0.06, DESK.z1 - 0.06].map(z => (
        <mesh key={z} position={[DESK.x0 + 0.05, legH / 2, z]} material={metal} castShadow receiveShadow>
          <boxGeometry args={[0.04, legH, 0.04]} />
        </mesh>
      ))}
      <mesh position={[DESK.x0 + 0.05, 0.02, cz]} material={metal} castShadow receiveShadow><boxGeometry args={[0.04, 0.04, d - 0.08]} /></mesh>
      <mesh position={[DESK.x0 + 0.05, legH - 0.03, cz]} material={metal} castShadow><boxGeometry args={[0.03, 0.03, d - 0.12]} /></mesh>
      {/* modesty rail */}
      <mesh position={[cx - 0.2, legH - 0.05, DESK.z0 + 0.04]} material={metal} castShadow><boxGeometry args={[w * 0.7, 0.05, 0.015]} /></mesh>

      {/* pedestal carcass */}
      <mesh position={[PED.x0 + 0.009, legH / 2, pcz]} material={ped} castShadow receiveShadow><boxGeometry args={[0.018, legH, pd]} /></mesh>
      <mesh position={[PED.x1 - 0.009, legH / 2, pcz]} material={ped} castShadow receiveShadow><boxGeometry args={[0.018, legH, pd]} /></mesh>
      <mesh position={[pcx, legH / 2, PED.z0 + 0.009]} material={ped} receiveShadow><boxGeometry args={[pw, legH, 0.018]} /></mesh>
      <mesh position={[pcx, 0.03, pcz]} material={ped} receiveShadow><boxGeometry args={[pw, 0.06, pd]} /></mesh>
      {/* lower two fixed drawer fronts */}
      {[[0.27, 0.165]].map(([h, y]) => (
        <group key={y}>
          <RoundedBox args={[pw - 0.004, h - 0.008, 0.02]} radius={0.003} position={[pcx, y, PED.z1 + 0.01]} material={ped} castShadow receiveShadow />
          <mesh position={[pcx, y + h / 2 - 0.04, PED.z1 + 0.028]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 12]} />
            <meshStandardMaterial color="#b8894a" metalness={0.9} roughness={0.28} />
          </mesh>
        </group>
      ))}
      </Baked>
      <Drawer />
      <SideDrawer y={0.42} h={0.23} />
    </group>
  )
}

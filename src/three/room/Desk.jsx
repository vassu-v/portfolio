import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { PROJECTS } from '../../data/projects'
import { walnutTexture } from './textures'
import { Hotspot, damp } from './common'
import { room, useRoom, focusOn } from './store'
import { BACK } from './Room'
import Baked from './Baked'

export const DESK = { x0: -0.78, x1: 0.78, z0: BACK + 0.02, z1: -0.28, top: 0.75, th: 0.035 }
const PED = { x0: 0.36, x1: 0.74, z0: DESK.z0 + 0.02, z1: DESK.z1 - 0.015 }
const DRAWER_TRAVEL = 0.36
const DRAWER_W = PED.x1 - PED.x0 - 0.02, DRAWER_D = PED.z1 - PED.z0 - 0.08
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

function Folder({ project, index, z, selected, onPick }) {
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
        onPointerOver={e => { if (!project) return; e.stopPropagation(); hoverRef.current = true; room.set({ hover: { id: 'folder', label: project.name } }) }}
        onPointerOut={e => { if (!project) return; e.stopPropagation(); hoverRef.current = false; room.set({ hover: null }) }}
        onClick={e => { if (!project) return; e.stopPropagation(); onPick(index) }}
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
  const open = focus === 'drawer'
  const carcass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 0.8 }), [])
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.5 }), [])

  const W = DRAWER_W, D = DRAWER_D, H = 0.12
  const folders = Array.from({ length: SLOTS }, (_, i) => (i % 2 === 0 ? PROJECTS[i / 2] : null) ?? null)

  useFrame((state, dt) => {
    if (!ref.current) return
    ref.current.position.z = damp(ref.current.position.z, open ? DRAWER_TRAVEL : 0, 6, dt)
  })

  return (
    <group position={[(PED.x0 + PED.x1) / 2, DESK.top - DESK.th - 0.095, (PED.z0 + PED.z1) / 2]}>
      <group ref={ref}>
        <Hotspot id="drawer" label="Projects — open the drawer" enabled={!open} onClick={() => focusOn('drawer')}>
          {/* front panel + pull */}
          <RoundedBox args={[W + 0.016, 0.15, 0.02]} radius={0.003} position={[0, 0, D / 2 + 0.03]} material={front} castShadow receiveShadow />
          <mesh position={[0, 0.03, D / 2 + 0.048]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 12]} />
            <meshStandardMaterial color="#b8894a" metalness={0.9} roughness={0.28} />
          </mesh>
        </Hotspot>
        {/* box */}
        <mesh position={[0, -0.065, 0]} material={carcass} receiveShadow><boxGeometry args={[W, 0.01, D]} /></mesh>
        <mesh position={[-W / 2, 0, 0]} material={carcass} castShadow receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
        <mesh position={[W / 2, 0, 0]} material={carcass} castShadow receiveShadow><boxGeometry args={[0.01, H, D]} /></mesh>
        <mesh position={[0, 0, -D / 2]} material={carcass} receiveShadow><boxGeometry args={[W, H, 0.01]} /></mesh>
        <mesh position={[0, 0, D / 2 + 0.01]} material={carcass} receiveShadow><boxGeometry args={[W, H, 0.01]} /></mesh>
        <group position={[0, 0.045, 0]}>
          {folders.map((p, i) => (
            <Folder
              key={i}
              index={p ? PROJECTS.indexOf(p) : i}
              project={p}
              z={slotZ(i)}
              selected={p && folder === PROJECTS.indexOf(p)}
              onPick={idx => room.set({ folder: room.get().folder === idx ? -1 : idx, page: 0 })}
            />
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
      {[[0.23, 0.42], [0.27, 0.165]].map(([h, y]) => (
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
    </group>
  )
}

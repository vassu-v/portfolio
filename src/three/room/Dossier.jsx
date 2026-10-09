import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PROJECTS } from '../../data/projects'
import { damp } from './common'
import { room, useRoom } from './store'
import { folderWorld } from './Desk'

// A project pulled out of the drawer as a real stack of A4 pages. The top
// page is clicked to send it to the back; a click anywhere else files it.
const PW = 0.21, PH = 0.297, PX = 840, PY = 1188
export const PAGES = 4
const PRESENT = new THREE.Vector3(0.56, 0.99, -0.15)
const FACING = new THREE.Vector3(0.62, 1.16, 0.3)

function wrap(ctx, text, maxW) {
  const out = []
  let line = ''
  for (const w of String(text || '').split(' ')) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

const imgCache = new Map()
function img(src, cb) {
  if (!src) return null
  let i = imgCache.get(src)
  if (!i) { i = new Image(); i.onload = cb; i.src = src; imgCache.set(src, i) }
  else if (!i.complete) i.addEventListener('load', cb, { once: true })
  return i.complete && i.naturalWidth ? i : null
}

function cover(ctx, im, x, y, w, h) {
  if (!im) { ctx.fillStyle = '#ddd2bd'; ctx.fillRect(x, y, w, h); return }
  const s = Math.max(w / im.width, h / im.height)
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.drawImage(im, x + (w - im.width * s) / 2, y + (h - im.height * s) / 2, im.width * s, im.height * s)
  ctx.restore()
}

function header(ctx, p, i, n, label) {
  ctx.fillStyle = '#f5efe2'
  ctx.fillRect(0, 0, PX, PY)
  ctx.fillStyle = '#F07A1A'
  ctx.fillRect(0, 0, PX, 12)
  ctx.fillStyle = '#8a6a48'
  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillText(`${p.name.toUpperCase()} · ${label}`, 56, 70)
  ctx.textAlign = 'right'
  ctx.fillText(`${n + 1} / ${PAGES}`, PX - 56, 70)
  ctx.textAlign = 'left'
  // hole punches
  ctx.fillStyle = '#d9cfbd'
  for (const y of [PY * 0.3, PY * 0.7]) { ctx.beginPath(); ctx.arc(30, y, 11, 0, 7); ctx.fill() }
}

function sectionTitle(ctx, t, y) {
  ctx.fillStyle = '#1d1712'
  ctx.font = 'italic 64px "Instrument Serif", serif'
  ctx.fillText(t, 56, y)
  ctx.strokeStyle = '#F07A1A'; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(58, y + 18); ctx.lineTo(58 + ctx.measureText(t).width, y + 14); ctx.stroke()
}

function body(ctx, text, y, max = PY - 90, size = 27) {
  ctx.fillStyle = '#3a3029'
  ctx.font = `400 ${size}px "JetBrains Mono", monospace`
  for (const para of String(text || '').split('\n').filter(Boolean)) {
    for (const l of wrap(ctx, para, PX - 112)) {
      if (y > max) return y
      ctx.fillText(l, 56, y); y += size * 1.45
    }
    y += size * 0.6
  }
  return y
}

const PAINT = [
  (ctx, p, i, redraw) => {
    header(ctx, p, i, 0, `PROJECT ${String(i + 1).padStart(2, '0')}`)
    ctx.fillStyle = '#1d1712'
    ctx.font = 'italic 104px "Instrument Serif", serif'
    let y = 200
    for (const l of wrap(ctx, p.name, PX - 112).slice(0, 2)) { ctx.fillText(l, 56, y); y += 100 }
    ctx.fillStyle = '#3d3229'
    ctx.font = '400 31px "JetBrains Mono", monospace'
    for (const l of wrap(ctx, p.tagline, PX - 112)) { ctx.fillText(l, 56, y); y += 44 }
    y += 24
    cover(ctx, img(p.images?.[0]?.src, redraw), 56, y, PX - 112, 430)
    y += 480
    ctx.fillStyle = '#8a6a48'
    ctx.font = '500 25px "JetBrains Mono", monospace'
    for (const l of wrap(ctx, p.stat, PX - 112)) { ctx.fillText(l, 56, y); y += 36 }
    y += 28
    ctx.font = '400 23px "JetBrains Mono", monospace'
    let x = 56
    for (const tag of (p.tags || []).slice(0, 6)) {
      const w = ctx.measureText(tag).width + 28
      if (x + w > PX - 56) { x = 56; y += 50 }
      ctx.strokeStyle = '#F07A1A'; ctx.lineWidth = 2; ctx.strokeRect(x, y - 30, w, 42)
      ctx.fillStyle = '#7a4a1c'; ctx.fillText(tag, x + 14, y)
      x += w + 12
    }
    ctx.fillStyle = '#a8483a'
    ctx.font = '600 40px Caveat, cursive'
    ctx.fillText('click to turn →', PX - 290, PY - 50)
  },
  (ctx, p, i) => {
    header(ctx, p, i, 1, 'WHY')
    sectionTitle(ctx, 'The problem', 170)
    let y = body(ctx, p.problem, 250, PY * 0.52)
    sectionTitle(ctx, 'The solution', Math.max(y + 60, PY * 0.56))
    body(ctx, p.solution, Math.max(y + 140, PY * 0.56 + 80))
  },
  (ctx, p, i) => {
    header(ctx, p, i, 2, 'HOW')
    sectionTitle(ctx, 'How it works', 170)
    let y = 260
    for (const h of (p.how || []).slice(0, 5)) {
      if (y > PY - 160) break
      ctx.fillStyle = '#F07A1A'
      ctx.font = '600 26px "JetBrains Mono", monospace'
      ctx.fillText('▸ ' + (h.label || ''), 56, y)
      y = body(ctx, h.text, y + 42, PY - 90, 24) + 18
    }
  },
  (ctx, p, i, redraw) => {
    header(ctx, p, i, 3, 'IMPACT')
    sectionTitle(ctx, 'What came of it', 170)
    const items = (p.impact || []).slice(0, 4)
    items.forEach((m, k) => {
      const x = 56 + (k % 2) * ((PX - 112) / 2), y = 290 + Math.floor(k / 2) * 150
      ctx.fillStyle = '#1d1712'
      ctx.font = 'italic 76px "Instrument Serif", serif'
      ctx.fillText(String(m.val ?? ''), x, y)
      ctx.fillStyle = '#6a5a4c'
      ctx.font = '400 23px "JetBrains Mono", monospace'
      wrap(ctx, m.label, (PX - 140) / 2).slice(0, 2).forEach((l, j) => ctx.fillText(l, x, y + 40 + j * 30))
    })
    const y0 = 290 + Math.ceil(items.length / 2) * 150 + 10
    const pics = (p.images || []).slice(1, 3)
    pics.forEach((im, k) => {
      const w = (PX - 112 - 20) / 2
      ctx.save(); ctx.translate(56 + k * (w + 20) + w / 2, y0 + 150); ctx.rotate(k ? 0.02 : -0.025)
      ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 - 8, -158, w + 16, 316)
      cover(ctx, img(im.src, redraw), -w / 2, -150, w, 300)
      ctx.restore()
    })
    let y = y0 + (pics.length ? 360 : 20)
    ctx.fillStyle = '#3a3029'
    ctx.font = '500 24px "JetBrains Mono", monospace'
    if (p.github) { ctx.fillText('github  ' + p.github.replace(/^https?:\/\//, ''), 56, y); y += 38 }
    if (p.live) ctx.fillText('live    ' + p.live.replace(/^https?:\/\//, ''), 56, y)
    ctx.fillStyle = '#a8483a'
    ctx.font = '600 42px Caveat, cursive'
    ctx.fillText(`full case study → /project/${p.slug}`, 56, PY - 60)
  },
]

const pageCache = new Map()
function pagesFor(index) {
  if (pageCache.has(index)) return pageCache.get(index)
  const p = PROJECTS[index]
  const list = PAINT.map((paint, n) => {
    const c = document.createElement('canvas')
    c.width = PX; c.height = PY
    const ctx = c.getContext('2d')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    const redraw = () => { paint(ctx, p, index, redraw); t.needsUpdate = true }
    redraw()
    document.fonts?.ready.then(redraw)
    return { t, n }
  })
  pageCache.set(index, list)
  return list
}

function Page({ tex, slot, moving, onClick, jitter }) {
  const ref = useRef()
  const st = useRef({ slot, arc: 0 })
  useFrame((_, dt) => {
    const s = st.current
    s.slot = damp(s.slot, slot, 7, dt)
    // a page going to the back lifts up and over the stack on an arc
    s.arc = damp(s.arc, moving ? 1 : 0, 9, dt)
    const g = ref.current
    if (!g) return
    g.position.set(jitter[0] + Math.sin(s.arc * Math.PI) * 0.02, jitter[1] + Math.sin(s.arc * Math.PI) * 0.17, -s.slot * 0.0022)
    g.rotation.set(-Math.sin(s.arc * Math.PI) * 0.35, 0, jitter[2] * (1 - s.arc))
  })
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow onClick={onClick}
        onPointerOver={e => { e.stopPropagation(); room.set({ hover: { id: 'page', label: slot === 0 ? 'click to turn the page' : '' } }) }}
        onPointerOut={() => room.set({ hover: null })}>
        <boxGeometry args={[PW, PH, 0.0006]} />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.88} />
        <meshStandardMaterial attach="material-0" color="#e9e1d0" roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#e9e1d0" roughness={0.9} />
        <meshStandardMaterial attach="material-2" color="#e9e1d0" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#e9e1d0" roughness={0.9} />
        <meshStandardMaterial attach="material-5" color="#efe7d6" roughness={0.9} />
      </mesh>
    </group>
  )
}

export default function Dossier() {
  const focus = useRoom(s => s.focus)
  const folder = useRoom(s => s.folder)
  const active = focus === 'drawer' && folder >= 0
  const group = useRef()
  const [order, setOrder] = useState([0, 1, 2, 3])
  const [moving, setMoving] = useState(-1)
  const [idx, setIdx] = useState(-1)
  const k = useRef(0)
  const pages = useMemo(() => (idx >= 0 ? pagesFor(idx) : null), [idx])
  const kraft = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c3a06c', roughness: 0.92, side: THREE.DoubleSide }), [])
  const jitters = useMemo(() => [0, 1, 2, 3].map(i => [Math.sin(i * 7.1) * 0.004, Math.cos(i * 3.3) * 0.003, Math.sin(i * 5.7) * 0.025]), [])

  // keep the last project around while it flies back into the drawer
  const [prevFolder, setPrevFolder] = useState(folder)
  if (folder !== prevFolder) {
    setPrevFolder(folder)
    if (folder >= 0) { setIdx(folder); setOrder([0, 1, 2, 3]) }
  }

  const tmp = useMemo(() => ({ from: new THREE.Vector3(), q0: new THREE.Quaternion(), q1: new THREE.Quaternion(), m: new THREE.Matrix4() }), [])
  useFrame((_, dt) => {
    k.current = damp(k.current, active ? 1 : 0, 4.5, dt)
    const g = group.current
    if (!g || idx < 0) return
    g.visible = k.current > 0.01
    if (!g.visible) return
    const t = k.current
    folderWorld(idx, tmp.from)
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
    g.position.lerpVectors(tmp.from, PRESENT, e)
    g.position.y += Math.sin(e * Math.PI) * 0.08
    tmp.q0.identity()
    tmp.m.lookAt(FACING, PRESENT, new THREE.Vector3(0, 1, 0))
    tmp.q1.setFromRotationMatrix(tmp.m)
    g.quaternion.slerpQuaternions(tmp.q0, tmp.q1, e)
    g.scale.setScalar(0.55 + 0.45 * e)
  })

  const turn = e => {
    e.stopPropagation()
    if (moving >= 0) return
    const top = order[0]
    setMoving(top)
    setTimeout(() => {
      const next = [...order.slice(1), top]
      setOrder(next)
      setMoving(-1)
      room.set({ page: next[0] })
    }, 420)
  }

  if (!pages) return null
  return (
    <group ref={group} visible={false}>
      {/* open kraft folder behind the stack */}
      <mesh position={[0, 0, -0.012]} material={kraft} castShadow receiveShadow>
        <boxGeometry args={[PW + 0.03, PH + 0.02, 0.0015]} />
      </mesh>
      <mesh position={[-PW / 2 - 0.02, 0.01, -0.03]} rotation={[0, 0.5, 0]} material={kraft} castShadow>
        <boxGeometry args={[0.012, PH + 0.02, 0.0015]} />
      </mesh>
      {/* paper clip */}
      <mesh position={[-PW / 2 + 0.03, PH / 2 - 0.004, 0.002]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.009, 0.0012, 6, 20, Math.PI * 1.6]} />
        <meshStandardMaterial color="#b8b8b8" metalness={1} roughness={0.3} />
      </mesh>
      {pages.map(({ t, n }) => {
        const slot = order.indexOf(n)
        const lifting = moving === n
        return (
          <Page key={n} tex={t} slot={lifting ? PAGES - 1 : slot} moving={lifting} jitter={jitters[n]}
            onClick={slot === 0 ? turn : e => e.stopPropagation()} />
        )
      })}
    </group>
  )
}

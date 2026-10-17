import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { corkTexture, walnutTexture } from './textures'
import { Hotspot, damp } from './common'
import { room, useRoom, inHand } from './store'
import { goToStop } from './tourData'
import { BACK } from './Room'
import { ITEMS, HEADERS, CHRONO } from './corkData'
import { decorateNote, tape, circleAround, squiggle, arrow, star, sparkle, spiral, heart, check, burst } from './doodles'

// sized for the future: room to the right for roles and wins still to come
export const BOARD = { x: 0.64, y: 1.47, z: BACK + 0.012, w: 1.5, h: 0.95 }

const SIZE = {
  expcard: [0.165, 0.11], polaroid: [0.1, 0.12], note: [0.085, 0.085], receipt: [0.07, 0.13],
  stat: [0.12, 0.08], link: [0.13, 0.06], card: [0.13, 0.08],
}
const sizeOf = it => (it.large ? [0.12, 0.12] : SIZE[it.kind])
const PIN_COLORS = ['#c0392b', '#F07A1A', '#2f6f8f', '#d4a017', '#4f7d4a', '#e9e4da']
const PRESENT = new THREE.Vector3(0, 0.02, 0.24)
const SUPPORT_SLOTS = [[-0.24, 0.05], [0.24, 0.05], [-0.22, -0.14], [0.22, -0.14], [0, -0.19]]

// ---------- textures ----------
const imgs = new Map()
function image(src, cb) {
  let i = imgs.get(src)
  if (!i) { i = new Image(); i.src = src; imgs.set(src, i) }
  if (!i.complete) i.addEventListener('load', cb, { once: true })
  return i.complete && i.naturalWidth ? i : null
}

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

// The hire-me note goes loud: hot paper, the words circled twice, arrows,
// stars, sparkles, a spiral — a page someone doodled all over in class.
function hireNote(ctx, w, h, it) {
  ctx.fillStyle = '#ffb36b'; ctx.fillRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w * 0.3, h * 0.25, 10, w * 0.5, h * 0.5, w * 0.8)
  g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(1, 'rgba(200,70,10,0.18)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  tape(ctx, 90, 14, 150, -0.3, 'rgba(132,208,232,0.7)')
  tape(ctx, w - 80, 14, 140, 0.25, 'rgba(255,255,255,0.55)')
  ctx.fillStyle = '#7a1f05'; ctx.font = '700 104px Caveat, cursive'
  const head = it.title.replace(' →', '').toUpperCase() + '!'
  ctx.fillText(head, 40, 170)
  const tw = ctx.measureText(head).width
  circleAround(ctx, 40 + tw / 2, 138, tw / 2 + 34, 66, '#c2185b', 5, 7)
  circleAround(ctx, 40 + tw / 2, 140, tw / 2 + 46, 76, 'rgba(29,20,12,0.6)', 2.5, 11)
  burst(ctx, 40 + tw + 52, 96, 40, '#7a1f05', 4)
  ctx.fillStyle = '#1d140c'; ctx.font = '700 40px Caveat, cursive'
  let y = 270
  for (const l of it.lines || []) { ctx.fillText(l, 48, y); y += 50 }
  squiggle(ctx, 48, y - 34, 260, '#7a1f05', 4)
  arrow(ctx, w - 150, h - 150, w - 60, h - 70, '#7a1f05', 5, -0.35)
  star(ctx, w - 90, 250, 26, '#7a1f05', 4)
  star(ctx, 70, h - 70, 18, '#c2185b', 3.5)
  sparkle(ctx, w - 160, 300, 16, '#fff6e0', 4); sparkle(ctx, 150, h - 46, 11, '#7a1f05')
  spiral(ctx, w - 70, h - 200, 24, 'rgba(29,20,12,0.55)')
  heart(ctx, 210, h - 72, 14, '#c2185b', 3.5)
}

const PAINTERS = {
  expcard(ctx, w, h, it) {
    const e = it.exp
    // the open-for-work role gets warm paper and a highlighter swipe
    const hot = e.org === 'Freelance'
    ctx.fillStyle = hot ? '#ffe2c4' : '#fbf7ee'; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = hot ? 'rgba(200,90,20,0.22)' : 'rgba(70,110,170,0.25)'; ctx.lineWidth = 2
    for (let y = 120; y < h; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    ctx.strokeStyle = 'rgba(200,60,60,0.45)'; ctx.beginPath(); ctx.moveTo(0, 96); ctx.lineTo(w, 96); ctx.stroke()
    if (hot) {
      ctx.font = 'italic 64px "Instrument Serif", serif'
      ctx.fillStyle = 'rgba(240,122,26,0.42)'; ctx.fillRect(22, 30, ctx.measureText(e.org).width + 22, 58)
      ctx.strokeStyle = '#F07A1A'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8)
    }
    ctx.fillStyle = '#1d1712'; ctx.font = 'italic 64px "Instrument Serif", serif'; ctx.fillText(e.org, 30, 76)
    ctx.font = '600 44px Caveat, cursive'; ctx.fillStyle = '#2a3550'; ctx.fillText(e.primaryRole, 30, 158)
    ctx.fillStyle = '#7a4a1c'; ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText(e.period.toUpperCase(), 30, 246)
    ctx.fillStyle = '#3e342c'; ctx.font = '400 24px "JetBrains Mono", monospace'; ctx.fillText(e.type, 30, 290)
    if (hot) { star(ctx, w - 70, 60, 22, '#d4380d', 3.5); sparkle(ctx, w - 118, 92, 11) }
    if (e.live) { ctx.fillStyle = '#F07A1A'; ctx.font = '600 40px Caveat, cursive'; ctx.fillText('● now', w - 130, h - 60) }
  },
  polaroid(ctx, w, h, it, redraw) {
    ctx.fillStyle = '#f3f1ea'; ctx.fillRect(0, 0, w, h)
    const p = 24, s = w - p * 2
    ctx.fillStyle = '#222'; ctx.fillRect(p, p, s, s)
    const im = image(it.src, redraw)
    if (im) {
      const k = Math.max(s / im.width, s / im.height)
      ctx.save(); ctx.beginPath(); ctx.rect(p, p, s, s); ctx.clip()
      ctx.drawImage(im, p + (s - im.width * k) / 2, p + (s - im.height * k) / 2, im.width * k, im.height * k)
      ctx.restore()
    }
    ctx.fillStyle = '#2a2018'; ctx.font = '600 38px Caveat, cursive'; ctx.fillText(it.cap || '', 30, h - 34)
  },
  // designed like a real note: washi tape, a curled corner, a hand-drawn
  // underline and doodles (vector paths, see doodles.js)
  note(ctx, w, h, it) {
    if (it.hire) return hireNote(ctx, w, h, it)
    ctx.fillStyle = it.color || '#f7e27a'; ctx.fillRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0.07)'); g.addColorStop(0.25, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    decorateNote(ctx, w, h, it.title || it.lines?.[0] || '', { link: !!it.href })
    let y = 72
    if (it.title) {
      ctx.fillStyle = '#7a3b14'; ctx.font = '700 42px Caveat, cursive'; ctx.fillText(it.title, 24, y)
      squiggle(ctx, 24, y + 12, ctx.measureText(it.title).width)
      y += 58
    }
    ctx.fillStyle = '#1d140c'; ctx.font = '700 35px Caveat, cursive'
    for (const l of it.lines || []) { ctx.fillText(l, 24, y); y += 43 }
  },
  // the receipt reads at a glance: dark header, one heavy number, the
  // facts in bold mono, laid out over the whole slip
  receipt(ctx, w, h, it) {
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#16110c'; ctx.fillRect(0, 0, w, 150)
    ctx.fillStyle = '#ffd9b0'; ctx.font = '800 50px "JetBrains Mono", monospace'; ctx.fillText('INTL', 34, 70)
    ctx.fillText('PAYMENTS', 34, 126)
    ctx.fillStyle = '#16110c'; ctx.font = '800 44px "JetBrains Mono", monospace'; ctx.fillText('TOTAL', 34, 250)
    ctx.font = '800 150px "JetBrains Mono", monospace'; ctx.fillText('$300', 24, 410)
    circleAround(ctx, w / 2, 360, w / 2 - 6, 96, '#d4380d', 7, 3)
    ctx.strokeStyle = '#16110c'; ctx.setLineDash([14, 12]); ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(30, 500); ctx.lineTo(w - 30, 500); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#16110c'; ctx.font = '800 46px "JetBrains Mono", monospace'
    ;(it.lines || []).slice(3).forEach((l, i) => ctx.fillText(l.replace(/\s+/g, ' '), 34, 600 + i * 80))
    check(ctx, w - 110, h - 190, 46, '#2f7d32', 9)
    ctx.fillStyle = '#fffaf0'
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 12, h - 14); ctx.lineTo(x + 24, h); ctx.fill() }
  },
  stat(ctx, w, h, it) {
    ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#F07A1A'; ctx.fillRect(0, 0, 10, h)
    ctx.fillStyle = '#1d1712'; ctx.font = 'italic 120px "Instrument Serif", serif'; ctx.fillText(it.big, 40, 140)
    ctx.fillStyle = '#3a3029'; ctx.font = '500 30px "JetBrains Mono", monospace'
    wrap(ctx, it.small, w - 70).slice(0, 2).forEach((l, i) => ctx.fillText(l, 42, 200 + i * 36))
    if (it.sub) { ctx.fillStyle = '#7a4a1c'; ctx.font = '600 36px Caveat, cursive'; ctx.fillText(it.sub, 42, h - 34) }
  },
  link(ctx, w, h, it) {
    ctx.fillStyle = '#1d1712'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#84D0E8'; ctx.font = 'italic 70px "Instrument Serif", serif'; ctx.fillText(it.title, 36, 100)
    ctx.fillStyle = 'rgba(244,236,224,0.95)'; ctx.font = '500 28px "JetBrains Mono", monospace'; ctx.fillText(it.sub || '', 38, 150)
  },
  card(ctx, w, h, it) {
    ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#1d1712'; ctx.font = 'italic 60px "Instrument Serif", serif'; ctx.fillText(it.title, 30, 90)
    ctx.fillStyle = '#7a4a1c'; ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText(String(it.sub || '').toUpperCase(), 32, 160)
    if (it.foot) { ctx.fillStyle = '#3e342c'; ctx.font = '400 24px "JetBrains Mono", monospace'; ctx.fillText(it.foot, 32, 205) }
  },
}

const texCache = new Map()
function textureFor(it, key) {
  if (texCache.has(key)) return texCache.get(key)
  const [sw, sh] = sizeOf(it)
  const c = document.createElement('canvas')
  c.width = 600; c.height = Math.round(600 * sh / sw)
  const ctx = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const redraw = () => { PAINTERS[it.kind](ctx, c.width, c.height, it, redraw); t.needsUpdate = true }
  redraw()
  document.fonts?.ready.then(redraw)
  texCache.set(key, t)
  return t
}

// ---------- pieces ----------
function Pin({ color, position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0012, 0.0012, 0.008, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.012]} castShadow>
        <sphereGeometry args={[0.0065, 14, 10]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
      </mesh>
    </group>
  )
}

function Paper({ it, texKey, pinColor }) {
  const tex = useMemo(() => textureFor(it, texKey), [it, texKey])
  const [w, h] = sizeOf(it)
  return (
    <>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={it.kind === 'polaroid' ? 0.55 : 0.85} side={THREE.DoubleSide} />
      </mesh>
      <Pin color={pinColor} position={[0, h / 2 - 0.012, 0.001]} />
    </>
  )
}

function Item({ it, index }) {
  const ref = useRef()
  const hover = useRef(false)
  const focus = useRoom(inHand)
  const sel = useRoom(s => s.pin === it.id)
  const h = sizeOf(it)[1]
  // presented at ~half the screen height, so even the receipt is readable
  const big = Math.min(2.4, Math.max(1.4, 0.26 / h))

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.userData.k = damp(g.userData.k ?? 0, sel ? 1 : 0, 6, dt)
    g.userData.h = damp(g.userData.h ?? 0, hover.current && focus === 'corkboard' ? 1 : 0, 10, dt)
    const k = g.userData.k, hv = g.userData.h * (1 - k)
    const [x, y, r] = it.pos
    // hover lifts a card off the board and enlarges it enough to read
    g.position.set(x + (PRESENT.x - x) * k, y + (PRESENT.y - y) * k, 0.004 + index * 0.0004 + hv * 0.06 + PRESENT.z * k)
    g.rotation.z = r * (1 - Math.max(k, hv))
    g.scale.setScalar(1 + (big - 1) * k + hv * 0.45)
  })

  return (
    <group
      ref={ref}
      onPointerOver={ev => { if (focus !== 'corkboard') return; ev.stopPropagation(); hover.current = true; room.set({ hover: { id: 'pin', label: it.label } }) }}
      onPointerOut={ev => { if (!hover.current) return; ev.stopPropagation(); hover.current = false; room.set({ hover: null }) }}
      onClick={ev => { if (focus !== 'corkboard') return; ev.stopPropagation(); room.set({ pin: room.get().pin === it.id ? null : it.id }) }}
    >
      <Paper it={it} texKey={it.id} pinColor={PIN_COLORS[index % PIN_COLORS.length]} />
    </group>
  )
}

// Supporting material that pulls up beside the selected item.
// Hovering one (or tapping a note / stat on touch) zooms it to reading size.
function Support({ it, slot, order, parentPos, onPick }) {
  const ref = useRef()
  const st = useRef({ k: 0, t: 0, z: 0, hover: false, pinned: false })
  const [sx, sy] = SUPPORT_SLOTS[slot % SUPPORT_SLOTS.length]
  const isLink = !!(it.href || it.project)
  useFrame((_, dt) => {
    const s = st.current
    s.t += dt
    const want = s.t > 0.12 + order * 0.09 ? 1 : 0
    s.k = damp(s.k, want, 7, dt)
    s.z = damp(s.z, s.hover || s.pinned ? 1 : 0, 9, dt)
    const g = ref.current
    if (!g) return
    const k = s.k, z = s.z
    // zoom pulls it towards the middle and forward, over its neighbours
    const tx = sx + (PRESENT.x - sx) * 0.35 * z, ty = sy + (PRESENT.y - sy) * 0.35 * z
    g.position.set(parentPos[0] + (tx - parentPos[0]) * k, parentPos[1] + (ty - parentPos[1]) * k, 0.02 + 0.2 * k + 0.09 * z)
    g.rotation.z = (slot % 2 ? 0.05 : -0.05) * k * (1 - z)
    g.scale.setScalar((0.3 + 0.95 * k) * (1 + 0.8 * z))
  })
  return (
    <group ref={ref}
      onClick={e => { e.stopPropagation(); if (isLink) onPick?.(it); else st.current.pinned = !st.current.pinned }}
      onPointerOver={e => { e.stopPropagation(); st.current.hover = true; room.set({ hover: { id: 'sup', label: isLink ? (it.href ? 'open ' + it.title : 'open project') : 'tap to zoom' } }) }}
      onPointerOut={() => { st.current.hover = false; room.set({ hover: null }) }}>
      <Paper it={it} texKey={`sup-${it.kind}-${it.title || it.big || it.src}`} pinColor="#e9e4da" />
    </group>
  )
}

function Yarn() {
  const geo = useMemo(() => {
    const pos = Object.fromEntries(ITEMS.filter(i => i.kind === 'expcard').map(i => [i.exp.org, i.pos]))
    const pts = CHRONO.map(o => new THREE.Vector3(pos[o][0], pos[o][1] + 0.043, 0.017))
    const path = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1]
      path.push(a, new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2 - 0.035, 0.012))
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

// Brass picture light over the board. Without it the board sits in the
// lamp's falloff and every card (and anything pulled forward) reads near-black.
// Always mounted so toggling never recompiles shaders — only intensity moves.
function PictureLight() {
  const rich = useRoom(s => s.tier !== 'low')
  const focus = useRoom(inHand)
  const lampOn = useRoom(s => s.lampOn)
  const spot = useRef()
  const front = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8894a', metalness: 0.9, roughness: 0.3 }), [])
  useFrame((_, dt) => {
    const want = focus === 'corkboard' ? 1 : lampOn ? 0.55 : 0.35
    const k = spot.current.userData.k = damp(spot.current.userData.k ?? want, want, 4, dt)
    spot.current.intensity = 1.9 * k
    // fill for cards pulled off the board towards the camera
    if (front.current) front.current.intensity = room.get().pin ? 0.35 : 0
  })
  const top = BOARD.h / 2 + 0.03
  return (
    <>
      <primitive object={target} position={[0, -0.05, 0]} />
      <group position={[0, top, 0.02]}>
        <mesh material={brass} position={[0, 0.03, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.018, 0.022, 0.62, 20]} />
        </mesh>
        <mesh material={brass} position={[0, 0.02, 0.022]} rotation={[0.9, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.07, 8]} />
        </mesh>
        <mesh position={[0, 0.016, 0.055]}>
          <boxGeometry args={[0.58, 0.004, 0.02]} />
          <meshStandardMaterial color="#fff2dc" emissive="#ffe2b8" emissiveIntensity={0.8} />
        </mesh>
      </group>
      <spotLight ref={spot} target={target} position={[0, top + 0.02, 0.42]} color="#ffe6c4" angle={1.15} penumbra={0.85} decay={2} distance={3} />
      {rich && <pointLight ref={front} position={[0, 0.05, 0.75]} color="#fff1de" distance={1.6} decay={2} intensity={0} />}
    </>
  )
}

function Header({ text, pos }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 640; c.height = 160
    const ctx = c.getContext('2d')
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    // a torn strip of cream paper behind the words — dark ink straight on
    // cork vanished into the texture
    const draw = () => {
      ctx.clearRect(0, 0, 640, 160)
      ctx.font = 'italic 92px "Instrument Serif", serif'
      const tw = Math.min(612, ctx.measureText(text).width + 56)
      ctx.fillStyle = '#f4ecdc'
      ctx.beginPath(); ctx.moveTo(6, 14)
      for (let x = 6; x <= tw; x += 24) ctx.lineTo(x, 10 + ((x * 7) % 9))
      ctx.lineTo(tw, 150)
      for (let x = tw; x >= 6; x -= 24) ctx.lineTo(x, 146 + ((x * 5) % 8))
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#1d1712'; ctx.fillText(text, 30, 106)
      ctx.strokeStyle = '#F07A1A'; ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(32, 128); ctx.quadraticCurveTo(tw / 2, 118, tw - 24, 132); ctx.stroke()
      t.needsUpdate = true
    }
    draw(); document.fonts?.ready.then(draw)
    return t
  }, [text])
  return (
    <mesh position={[pos[0], pos[1], 0.002]} rotation={[0, 0, pos[2]]}>
      <planeGeometry args={[0.36, 0.09]} />
      <meshStandardMaterial map={tex} transparent roughness={0.9} />
    </mesh>
  )
}

export default function Corkboard() {
  const focus = useRoom(inHand)
  const pin = useRoom(s => s.pin)
  const cork = useMemo(() => new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.95 }), [])
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.5 }), [])
  const { w, h } = BOARD
  const f = 0.024
  const selected = ITEMS.find(i => i.id === pin)

  const openSupport = it => {
    if (it.href) window.open(it.href, '_blank', 'noopener')
    else if (it.project) window.dispatchEvent(new CustomEvent('room-open-project', { detail: it.project }))
  }

  return (
    <group position={[BOARD.x, BOARD.y, BOARD.z]}>
      <Hotspot id="corkboard" label="Corkboard — experience & wins" enabled={focus !== 'corkboard'} onClick={() => goToStop('experience')}>
        <mesh material={cork} receiveShadow castShadow>
          <boxGeometry args={[w, h, 0.012]} />
        </mesh>
        {[[0, h / 2 + f / 2, w + f * 2, f], [0, -h / 2 - f / 2, w + f * 2, f], [-w / 2 - f / 2, 0, f, h], [w / 2 + f / 2, 0, f, h]].map(([x, y, bw, bh], i) => (
          <RoundedBox key={i} args={[bw, bh, 0.028]} radius={0.004} position={[x, y, 0.004]} material={frame} castShadow receiveShadow />
        ))}
        <PictureLight />
        <group position={[0, 0, 0.006]}>
          {HEADERS.map(hd => <Header key={hd.text} {...hd} />)}
          <Yarn />
          {ITEMS.map((it, i) => <Item key={it.id} it={it} index={i} />)}
          {selected && selected.support.map((s, i) => (
            <Support key={selected.id + i} it={s} slot={i} order={i} parentPos={selected.pos} onPick={openSupport} />
          ))}
        </group>
      </Hotspot>
    </group>
  )
}

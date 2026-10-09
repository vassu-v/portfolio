import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { POSTS } from '../../data/blog'
import { Hotspot, damp } from './common'
import { room, useRoom, focusOn } from './store'

// A5 leather diary. Spine along local z at x = 0; closed it lies on x ∈ [0, W].
// Opening rotates the front half π about the spine so it lies flat on x ∈ [-W, 0].
// Spread s: left = index (s = 0) or the previous post's continuation,
//           right = post s's opening page (or the back page).
const W = 0.148, D = 0.21, COVER = 0.003, BLOCK = 0.009
const HINGE_Y = COVER + BLOCK
const PX_W = 768, PX_H = 1086
const TAB_COLORS = ['#C57B2B', '#5B8FAF', '#7a8f5a', '#a8483a', '#D4983A', '#6d5a8a', '#3d6b6b']
export const SPREADS = POSTS.length + 1

const images = new Map()
function heroImage(src, onLoad) {
  if (!src) return null
  if (images.has(src)) return images.get(src).complete ? images.get(src) : null
  const img = new Image()
  img.onload = onLoad
  img.src = src
  images.set(src, img)
  return null
}

function wrapLines(ctx, text, maxW) {
  const out = []
  let line = ''
  for (const w of String(text).split(' ')) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

function paper(ctx, side) {
  ctx.fillStyle = '#f3ecdc'
  ctx.fillRect(0, 0, PX_W, PX_H)
  // gutter shadow toward the spine
  const g = side === 'left'
    ? ctx.createLinearGradient(PX_W, 0, PX_W - 90, 0)
    : ctx.createLinearGradient(0, 0, 90, 0)
  g.addColorStop(0, 'rgba(60,40,20,0.22)')
  g.addColorStop(1, 'rgba(60,40,20,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, PX_W, PX_H)
  ctx.strokeStyle = 'rgba(80,110,160,0.13)'
  ctx.lineWidth = 2
  for (let y = 150; y < PX_H - 40; y += 46) { ctx.beginPath(); ctx.moveTo(48, y); ctx.lineTo(PX_W - 48, y); ctx.stroke() }
}

// Index lines live at known y positions so a click's UV can pick a post.
const INDEX_TOP = 330, INDEX_STEP = 92

function drawIndex(ctx) {
  paper(ctx, 'left')
  ctx.fillStyle = '#1d1712'
  ctx.font = 'italic 92px "Instrument Serif", serif'
  ctx.fillText('the log', 64, 150)
  ctx.font = '600 38px Caveat, cursive'
  ctx.fillStyle = '#7a4a1c'
  ctx.fillText('notes on building, tech & thinking clearly', 66, 210)
  POSTS.forEach((p, i) => {
    const y = INDEX_TOP + i * INDEX_STEP
    ctx.fillStyle = TAB_COLORS[i % TAB_COLORS.length]
    ctx.fillRect(64, y - 30, 8, 52)
    ctx.fillStyle = '#8a6a48'
    ctx.font = '500 20px "JetBrains Mono", monospace'
    ctx.fillText(`${String(i + 1).padStart(2, '0')} · ${p.category?.toUpperCase() || ''} · ${p.date}`, 90, y - 8)
    ctx.fillStyle = '#211a14'
    ctx.font = 'italic 34px "Instrument Serif", serif'
    const t = wrapLines(ctx, p.title, PX_W - 160)[0]
    ctx.fillText(t + (wrapLines(ctx, p.title, PX_W - 160).length > 1 ? '…' : ''), 90, y + 30)
  })
  ctx.fillStyle = '#9a7a58'
  ctx.font = '600 34px Caveat, cursive'
  ctx.fillText('tap an entry, or a tab →', 66, PX_H - 70)
}

function drawOpening(ctx, p, i, redraw) {
  paper(ctx, 'right')
  ctx.fillStyle = TAB_COLORS[i % TAB_COLORS.length]
  ctx.fillRect(PX_W - 64, 40, 10, 70)
  ctx.fillStyle = '#8a6a48'
  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillText(`${(p.category || '').toUpperCase()}  ·  ${p.date}  ·  ${p.readTime || ''}`, 56, 92)
  ctx.fillStyle = '#1d1712'
  ctx.font = 'italic 60px "Instrument Serif", serif'
  let y = 170
  for (const l of wrapLines(ctx, p.title, PX_W - 112).slice(0, 3)) { ctx.fillText(l, 56, y); y += 62 }
  const img = heroImage(p.hero, redraw)
  y += 10
  if (img) {
    const w = PX_W - 112, h = 300
    const s = Math.max(w / img.width, h / img.height)
    ctx.save()
    ctx.translate(56 + w / 2, y + h / 2)
    ctx.rotate(-0.015)
    ctx.fillStyle = '#fff'
    ctx.fillRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20)
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip()
    ctx.drawImage(img, -img.width * s / 2, -img.height * s / 2, img.width * s, img.height * s)
    ctx.restore()
    // tape
    ctx.fillStyle = 'rgba(232,214,160,0.75)'
    ctx.save(); ctx.translate(PX_W / 2, y - 6); ctx.rotate(0.04); ctx.fillRect(-60, -14, 120, 28); ctx.restore()
    y += h + 50
  } else {
    y += 20
  }
  ctx.fillStyle = '#3d3229'
  ctx.font = '400 26px "JetBrains Mono", monospace'
  for (const l of wrapLines(ctx, p.subtitle || '', PX_W - 112).slice(0, 5)) { ctx.fillText(l, 56, y); y += 38 }
  ctx.fillStyle = '#7a4a1c'
  ctx.font = '600 36px Caveat, cursive'
  ctx.fillText('turn the page →', PX_W - 260, PX_H - 60)
}

function drawContinuation(ctx, p) {
  paper(ctx, 'left')
  const quote = p.content?.find(b => b.type === 'pullquote')?.text
  const paras = (p.content || []).filter(b => b.type === 'paragraph').map(b => b.text)
  let y = 120
  if (quote) {
    ctx.fillStyle = '#7a4a1c'
    ctx.font = 'italic 46px "Instrument Serif", serif'
    ctx.fillText('“', 48, y + 10)
    for (const l of wrapLines(ctx, quote, PX_W - 150).slice(0, 4)) { ctx.fillText(l, 84, y); y += 52 }
    y += 30
  }
  ctx.fillStyle = '#2a2622'
  ctx.font = '400 25px "JetBrains Mono", monospace'
  for (const para of paras.slice(0, 2)) {
    for (const l of wrapLines(ctx, para, PX_W - 112)) {
      if (y > PX_H - 170) break
      ctx.fillText(l, 56, y); y += 36
    }
    y += 22
  }
  ctx.fillStyle = '#a8483a'
  ctx.font = '600 40px Caveat, cursive'
  ctx.save(); ctx.translate(70, PX_H - 70); ctx.rotate(-0.04)
  ctx.fillText('↳ read the full entry', 0, 0)
  ctx.restore()
}

function drawBack(ctx) {
  paper(ctx, 'right')
  ctx.fillStyle = '#7a4a1c'
  ctx.font = '600 52px Caveat, cursive'
  ctx.fillText('more soon…', 70, 300)
  ctx.font = '600 38px Caveat, cursive'
  ctx.fillStyle = '#9a7a58'
  ctx.fillText('(half-written drafts live here)', 70, 360)
}

function pageCanvas() {
  const c = document.createElement('canvas')
  c.width = PX_W; c.height = PX_H
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return { c, ctx: c.getContext('2d'), t }
}

function leatherTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 720
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#4a2a18'
  ctx.fillRect(0, 0, 512, 720)
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,220,180,0.035)'
    ctx.fillRect(Math.random() * 512, Math.random() * 720, 2, 2)
  }
  // debossed title
  ctx.strokeStyle = 'rgba(197,123,43,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(46, 46, 420, 628)
  ctx.fillStyle = 'rgba(197,123,43,0.7)'
  ctx.font = 'italic 96px "Instrument Serif", serif'
  ctx.textAlign = 'center'
  ctx.fillText('log', 256, 380)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  document.fonts?.ready.then(() => { ctx.fillText('log', 256, 380); t.needsUpdate = true })
  return t
}

// Paper leaf with a little curl while it turns.
function useLeafGeometry() {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(W - 0.006, D - 0.008, 24, 1)
    g.rotateX(-Math.PI / 2)
    g.translate((W - 0.006) / 2, 0, 0)
    g.userData.base = g.attributes.position.array.slice()
    return g
  }, [])
}

export default function Diary() {
  const focus = useRoom(s => s.focus)
  const spread = useRoom(s => s.spread)
  const open = focus === 'diary'
  const hinge = useRef()
  const leaf = useRef()
  const band = useRef()
  const flip = useRef({ from: 0, to: 0, t: 1 })
  const shown = useRef(-1)

  const cover = useMemo(() => new THREE.MeshStandardMaterial({ map: leatherTexture(), roughness: 0.62, metalness: 0.05 }), [])
  const edge = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe5cf', roughness: 0.9 }), [])
  const pages = useMemo(() => ({ L: pageCanvas(), R: pageCanvas(), F: pageCanvas(), B: pageCanvas() }), [])
  const leafGeo = useLeafGeometry()

  const paint = useMemo(() => {
    const left = (ctx, s) => (s === 0 ? drawIndex(ctx) : drawContinuation(ctx, POSTS[s - 1]))
    const right = (ctx, s, redraw) => (s < POSTS.length ? drawOpening(ctx, POSTS[s], s, redraw) : drawBack(ctx))
    return { left, right }
  }, [])

  const draw = useMemo(() => function draw(s, phase) {
    const redraw = () => draw(room.get().spread, 'settle')
    const f = flip.current
    if (phase === 'settle' || f.t >= 1) {
      paint.left(pages.L.ctx, s)
      paint.right(pages.R.ctx, s, redraw)
    } else {
      const fwd = f.to > f.from
      // underneath: the pages that will be revealed / still visible
      paint.left(pages.L.ctx, fwd ? f.from : f.to)
      paint.right(pages.R.ctx, fwd ? f.to : f.from, redraw)
      // the turning leaf: front = right page it lifts off, back = left page it lands as
      paint.right(pages.F.ctx, fwd ? f.from : f.to, redraw)
      paint.left(pages.B.ctx, fwd ? f.to : f.from)
      pages.F.t.needsUpdate = true
      pages.B.t.needsUpdate = true
    }
    pages.L.t.needsUpdate = true
    pages.R.t.needsUpdate = true
  }, [pages, paint])

  useEffect(() => {
    draw(0, 'settle')
    document.fonts?.ready.then(() => draw(room.get().spread, 'settle'))
  }, [draw])

  useEffect(() => {
    if (shown.current === -1) { shown.current = spread; return }
    if (spread === shown.current) return
    flip.current = { from: shown.current, to: spread, t: 0 }
    shown.current = spread
    draw(spread, 'flip')
  }, [spread, draw])

  useEffect(() => { if (!open) room.set({ spread: 0 }) }, [open])

  useFrame((_, dt) => {
    if (hinge.current) {
      const target = open ? Math.PI : 0
      hinge.current.rotation.z = damp(hinge.current.rotation.z, target, 5, dt)
      if (band.current) band.current.visible = hinge.current.rotation.z < 0.15
    }
    const f = flip.current
    if (f.t < 1 && leaf.current) {
      f.t = Math.min(1, f.t + dt * 1.6)
      const e = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2
      const fwd = f.to > f.from
      leaf.current.visible = true
      leaf.current.rotation.z = fwd ? e * Math.PI : (1 - e) * Math.PI
      const curl = Math.sin(e * Math.PI) * 0.03
      const pos = leafGeo.attributes.position, b = leafGeo.userData.base
      for (let i = 0; i < pos.count; i++) {
        const x = b[i * 3]
        pos.setY(i, Math.sin((x / W) * Math.PI * 0.5) * curl * (fwd ? 1 : -1) * -1)
      }
      pos.needsUpdate = true
      leafGeo.computeVertexNormals()
      if (f.t >= 1) { leaf.current.visible = false; draw(shown.current, 'settle') }
    }
  })

  const go = s => room.set({ spread: Math.max(0, Math.min(SPREADS - 1, s)) })
  const onLeft = e => {
    if (!open) return
    e.stopPropagation()
    const s = room.get().spread
    if (s === 0 && e.uv) {
      const y = (1 - e.uv.y) * PX_H
      const i = Math.round((y - INDEX_TOP) / INDEX_STEP)
      if (i >= 0 && i < POSTS.length && Math.abs(y - (INDEX_TOP + i * INDEX_STEP)) < 50) return go(i)
      return
    }
    if (e.uv && e.uv.y < 0.14) return window.dispatchEvent(new CustomEvent('room-open-post', { detail: POSTS[s - 1]?.slug }))
    go(s - 1)
  }
  const onRight = e => { if (!open) return; e.stopPropagation(); go(room.get().spread + 1) }

  return (
    <Hotspot id="diary" label="Diary — the log" enabled={!open} onClick={() => focusOn('diary')} position={[-0.53, 0.75 + 0.0005, -0.47]} rotation={[0, 0.3, 0]}>
      {/* back cover + right page block */}
      <mesh position={[W / 2, COVER / 2, 0]} material={cover} castShadow receiveShadow>
        <boxGeometry args={[W + 0.004, COVER, D + 0.006]} />
      </mesh>
      <mesh position={[W / 2, COVER + BLOCK / 2, 0]} material={edge} castShadow receiveShadow>
        <boxGeometry args={[W - 0.004, BLOCK, D - 0.006]} />
      </mesh>
      <mesh position={[W / 2, HINGE_Y + 0.0003, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onRight}
        onPointerOver={e => { if (open) { e.stopPropagation(); room.set({ hover: { id: 'page', label: 'next page →' } }) } }}
        onPointerOut={() => open && room.set({ hover: null })}>
        <planeGeometry args={[W - 0.006, D - 0.008]} />
        <meshStandardMaterial map={pages.R.t} roughness={0.9} />
      </mesh>
      {/* index tabs sticking out of the fore-edge */}
      {POSTS.map((p, i) => (
        <mesh key={p.slug} position={[W + 0.004, COVER + BLOCK * 0.6, -D / 2 + 0.025 + i * ((D - 0.04) / POSTS.length)]} castShadow
          onClick={e => { if (!open) return; e.stopPropagation(); go(i) }}
          onPointerOver={e => { if (open) { e.stopPropagation(); room.set({ hover: { id: 'tab', label: p.title } }) } }}
          onPointerOut={() => open && room.set({ hover: null })}>
          <boxGeometry args={[0.012, 0.002, 0.016]} />
          <meshStandardMaterial color={TAB_COLORS[i % TAB_COLORS.length]} roughness={0.6} />
        </mesh>
      ))}
      {/* ribbon bookmark */}
      <mesh position={[W * 0.4, COVER + BLOCK + 0.0006, D / 2 + 0.018]} rotation={[-Math.PI / 2, 0, 0.12]} castShadow>
        <planeGeometry args={[0.006, 0.05]} />
        <meshStandardMaterial color="#8f2a22" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* front half, hinged at the spine */}
      <group ref={hinge} position={[0, HINGE_Y, 0]}>
        <mesh position={[W / 2, BLOCK / 2, 0]} material={edge} castShadow receiveShadow>
          <boxGeometry args={[W - 0.004, BLOCK, D - 0.006]} />
        </mesh>
        <mesh position={[W / 2, BLOCK + COVER / 2, 0]} material={cover} castShadow receiveShadow>
          <boxGeometry args={[W + 0.004, COVER, D + 0.006]} />
        </mesh>
        {/* left page: on the block face that ends up on top once flipped */}
        <mesh position={[W / 2, -0.0003, 0]} rotation={[Math.PI / 2, 0, Math.PI]} onClick={onLeft}
          onPointerOver={e => { if (open) { e.stopPropagation(); room.set({ hover: { id: 'page', label: room.get().spread === 0 ? 'pick an entry' : '← previous · ↳ read' } }) } }}
          onPointerOut={() => open && room.set({ hover: null })}>
          <planeGeometry args={[W - 0.006, D - 0.008]} />
          <meshStandardMaterial map={pages.L.t} roughness={0.9} />
        </mesh>
        {/* spine wrap */}
        <mesh position={[-0.001, BLOCK / 2 - HINGE_Y / 2 + COVER / 2, 0]} material={cover} castShadow>
          <boxGeometry args={[0.003, HINGE_Y + BLOCK, D + 0.006]} />
        </mesh>
      </group>

      {/* elastic band while closed */}
      <mesh ref={band} position={[W * 0.86, (HINGE_Y + BLOCK + COVER) / 2, 0]} castShadow>
        <boxGeometry args={[0.006, HINGE_Y + BLOCK + COVER + 0.002, D + 0.008]} />
        <meshStandardMaterial color="#1c1410" roughness={0.5} />
      </mesh>

      {/* turning leaf */}
      <group ref={leaf} position={[0, HINGE_Y + 0.0008, 0]} visible={false}>
        <mesh geometry={leafGeo}>
          <meshStandardMaterial map={pages.F.t} roughness={0.9} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={leafGeo} rotation={[0, 0, 0]} scale={[1, -1, 1]}>
          <meshStandardMaterial map={pages.B.t} roughness={0.9} side={THREE.BackSide} />
        </mesh>
      </group>
    </Hotspot>
  )
}

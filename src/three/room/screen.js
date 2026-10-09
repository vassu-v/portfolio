import * as THREE from 'three'
import { AGE } from '../../utils/meta'
import { PROJECTS } from '../../data/projects'

const W = 1600, H = 1000

// The idle terminal types this session on loop (~7 chars/s), one command
// at a time, then clears and starts over.
const SESSION = [
  ['$ whoami', 'cmd'],
  [`shoryavardhaan · ${AGE} · kolkata · builder`, 'out'],
  ['$ ls ~/projects', 'cmd'],
  [PROJECTS.map(p => p.slug).join('  '), 'out'],
  ['$ cat now.md', 'cmd'],
  ['· kolkata fork lead @ bits&bytes', 'out'],
  ['· youth partner + consultant @ 4mq.org', 'out'],
  ['· freelance: ui & landing pages', 'out'],
  ['$ explore --click-anything', 'cmd'],
]
const SESSION_LEN = SESSION.reduce((n, [l]) => n + l.length + 6, 0)
const TYPE_RATE = 7
const COPPER = '#C57B2B', GOLD = '#D4983A'

// Draws the laptop screen. `dissolve` 0 → name card, 1 → desktop. The name
// is sampled into particles once (after fonts load) and those particles
// scatter on a per-particle delay as dissolve rises — a sweep from left to
// right, drifting up and out like vapour, revealing the desktop behind.
export function createScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  let particles = null
  let last = { d: -1, blink: -1, min: -1, typed: -1 }

  const nameLayer = document.createElement('canvas')
  nameLayer.width = W
  nameLayer.height = H

  function drawName(c) {
    c.clearRect(0, 0, W, H)
    c.textAlign = 'center'
    c.fillStyle = '#8a6a48'
    c.font = '500 30px "JetBrains Mono", monospace'
    c.fillText('— HELLO, I\'M —', W / 2, 330)
    c.fillStyle = GOLD
    c.font = 'italic 400 196px "Instrument Serif", serif'
    c.fillText('Shoryavardhaan', W / 2, 540)
    c.fillStyle = '#a58a6c'
    c.font = '400 34px "JetBrains Mono", monospace'
    c.fillText(`builder · ${AGE} · kolkata`, W / 2, 650)
    c.textAlign = 'left'
  }

  function sample() {
    const c = nameLayer.getContext('2d')
    drawName(c)
    const data = c.getImageData(0, 0, W, H).data
    const pts = []
    const step = 4
    for (let y = 260; y < 700; y += step) {
      for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4
        if (data[i + 3] > 110) {
          pts.push({
            x, y,
            r: data[i], g: data[i + 1], b: data[i + 2],
            delay: x / W * 0.55 + Math.random() * 0.12,
            vx: 120 + Math.random() * 380,
            vy: -(140 + Math.random() * 420),
            sw: Math.random() * 6.28,
          })
        }
      }
    }
    particles = pts
  }

  const ready = (document.fonts?.load
    ? Promise.all([
        document.fonts.load('italic 196px "Instrument Serif"'),
        document.fonts.load('500 30px "JetBrains Mono"'),
      ])
    : Promise.resolve()
  ).catch(() => {}).then(() => { sample(); last.d = -1 })

  function desktop(t) {
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, '#1a1410')
    g.addColorStop(1, '#2b1d10')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W * 0.78, H * 0.28, 0, W * 0.78, H * 0.28, 520)
    glow.addColorStop(0, 'rgba(212,152,58,0.25)')
    glow.addColorStop(1, 'rgba(212,152,58,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    // menu bar with the visitor's real local time
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, W, 44)
    ctx.fillStyle = '#d9cbb5'
    ctx.font = '500 22px "JetBrains Mono", monospace'
    ctx.fillText('SG  ·  ~/shorya', 24, 30)
    const now = new Date()
    ctx.textAlign = 'right'
    ctx.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), W - 24, 30)
    ctx.textAlign = 'left'
    // terminal window
    const x = 140, y = 160, w = 820, h = 560
    ctx.fillStyle = 'rgba(12,10,8,0.92)'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#2a231c'
    ctx.fillRect(x, y, w, 48)
    ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath(); ctx.arc(x + 30 + i * 30, y + 24, 9, 0, 7); ctx.fill()
    })
    ctx.font = '500 28px "JetBrains Mono", monospace'
    // typed session: commands type out, outputs appear whole once reached
    let budget = Math.floor(t * TYPE_RATE) % (SESSION_LEN + 30)
    let row = 0, cx = x + 36, cy = y + 104
    for (const [line, kind] of SESSION) {
      if (budget <= 0) break
      const shown = kind === 'cmd' ? line.slice(0, budget) : line
      ctx.fillStyle = kind === 'cmd' ? '#8a6a48' : GOLD
      const out = shown.length > 52 ? shown.slice(0, 51) + '…' : shown
      ctx.fillText(out, x + 36, y + 104 + row * 46)
      cx = x + 36 + ctx.measureText(out).width
      cy = y + 104 + row * 46
      budget -= line.length + 6
      row++
    }
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = GOLD; ctx.fillRect(cx + 8, cy - 24, 15, 28) }
    // sticky widget
    ctx.fillStyle = COPPER
    ctx.globalAlpha = 0.9
    ctx.fillRect(1080, 200, 360, 220)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#1d1208'
    ctx.font = 'italic 58px "Instrument Serif", serif'
    ctx.fillText('ship real', 1112, 290)
    ctx.fillText('things.', 1112, 360)
  }

  function draw(dissolve, t) {
    const d = THREE.MathUtils.clamp(dissolve, 0, 1)
    const blink = Math.floor(t * 2) % 2
    const min = new Date().getMinutes()
    const typed = Math.floor(t * TYPE_RATE)
    if (Math.abs(d - last.d) < 0.0005 && (d < 0.999 || (blink === last.blink && min === last.min && typed === last.typed))) return false
    last = { d, blink, min, typed }

    if (d > 0.02) desktop(t)
    else { ctx.fillStyle = '#0b0907'; ctx.fillRect(0, 0, W, H) }

    if (d < 0.999) {
      // dark card behind the name fades with the dissolve
      ctx.fillStyle = `rgba(11,9,7,${1 - THREE.MathUtils.smoothstep(d, 0.35, 0.95)})`
      ctx.fillRect(0, 0, W, H)
      if (!particles || d === 0) {
        if (d === 0 || !particles) {
          const c = nameLayer.getContext('2d')
          if (!particles) drawName(c)
          ctx.drawImage(nameLayer, 0, 0)
        }
      } else {
        for (const p of particles) {
          const k = THREE.MathUtils.clamp((d - p.delay) / 0.4, 0, 1)
          if (k >= 1) continue
          const e = k * k
          const a = 1 - k
          ctx.globalAlpha = a
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
          const s = 4 * (1 - k * 0.5)
          ctx.fillRect(p.x + p.vx * e + Math.sin(p.sw + k * 6) * 14 * k, p.y + p.vy * e, s, s)
        }
        ctx.globalAlpha = 1
      }
    }
    // subtle scanline + vignette so it reads as a real panel up close
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
    texture.needsUpdate = true
    return true
  }

  return { texture, draw, ready }
}

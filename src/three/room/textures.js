import * as THREE from 'three'

const cache = new Map()

function canvasTex(key, w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const id = key + repeat.join('x')
  if (cache.has(id)) return cache.get(id)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  cache.set(id, t)
  return t
}

// Deterministic PRNG so textures are identical every load.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function grain(ctx, w, h, rand, { base, dark, light, lines = 220, wobble = 6, alpha = 0.18 }) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < lines; i++) {
    const y0 = rand() * h
    const amp = wobble * (0.4 + rand())
    const freq = 0.002 + rand() * 0.006
    const ph = rand() * 10
    ctx.strokeStyle = rand() > 0.5 ? dark : light
    ctx.globalAlpha = alpha * (0.3 + rand() * 0.7)
    ctx.lineWidth = 0.6 + rand() * 2.2
    ctx.beginPath()
    for (let x = 0; x <= w; x += 8) {
      const y = y0 + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 3.1 + ph * 2) * amp * 0.3
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function speckle(ctx, w, h, rand, n, color, size = 1.5, alpha = 0.08) {
  ctx.fillStyle = color
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = alpha * rand()
    const s = size * (0.5 + rand())
    ctx.fillRect(rand() * w, rand() * h, s, s)
  }
  ctx.globalAlpha = 1
}

export function walnutTexture() {
  return canvasTex('walnut', 1024, 512, (ctx, w, h) => {
    const r = rng(7)
    grain(ctx, w, h, r, { base: '#5a3a24', dark: '#2e1a0e', light: '#7a5236', lines: 260, wobble: 9, alpha: 0.22 })
    // a couple of soft knots
    for (let k = 0; k < 2; k++) {
      const x = r() * w, y = r() * h
      const g = ctx.createRadialGradient(x, y, 0, x, y, 26)
      g.addColorStop(0, 'rgba(30,16,8,0.55)')
      g.addColorStop(1, 'rgba(30,16,8,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 30, y - 30, 60, 60)
    }
    speckle(ctx, w, h, r, 4000, '#000', 1.2, 0.12)
  })
}

export function oakFloorTexture() {
  return canvasTex('oakfloor', 1024, 1024, (ctx, w, h) => {
    const r = rng(21)
    const rows = 8
    const rh = h / rows
    for (let i = 0; i < rows; i++) {
      let x = -r() * 400
      while (x < w) {
        const len = 360 + r() * 420
        const tone = 0.85 + r() * 0.3
        const c = (v) => Math.round(Math.min(255, v * tone))
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, i * rh, len, rh)
        ctx.clip()
        const pc = document.createElement('canvas')
        pc.width = 512; pc.height = 64
        grain(pc.getContext('2d'), 512, 64, r, {
          base: `rgb(${c(150)},${c(108)},${c(72)})`, dark: '#5c3c22', light: '#c49a6c', lines: 40, wobble: 3, alpha: 0.25,
        })
        ctx.drawImage(pc, x, i * rh, len, rh)
        ctx.restore()
        ctx.fillStyle = 'rgba(30,18,10,0.65)'
        ctx.fillRect(x, i * rh, 2, rh)
        x += len
      }
      ctx.fillStyle = 'rgba(30,18,10,0.7)'
      ctx.fillRect(0, i * rh, w, 2)
    }
    speckle(ctx, w, h, r, 6000, '#000', 1.4, 0.08)
  }, { repeat: [3, 3] })
}

export function plasterTexture(base = '#cfc6b8') {
  return canvasTex('plaster' + base, 512, 512, (ctx, w, h) => {
    const r = rng(3)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      const x = r() * w, y = r() * h, rad = 6 + r() * 40
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
      const d = r() > 0.5
      g.addColorStop(0, d ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }
    speckle(ctx, w, h, r, 9000, '#000', 1, 0.05)
  }, { repeat: [4, 3] })
}

export function corkTexture() {
  return canvasTex('cork', 512, 512, (ctx, w, h) => {
    const r = rng(11)
    ctx.fillStyle = '#a8794a'
    ctx.fillRect(0, 0, w, h)
    const tones = ['#7a5230', '#c49464', '#8f6238', '#d2a676', '#5e3d22']
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = tones[Math.floor(r() * tones.length)]
      ctx.globalAlpha = 0.35 + r() * 0.5
      const s = 1 + r() * 3.2
      ctx.beginPath()
      ctx.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.6), r() * 3, 0, 7)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }, { repeat: [1.4, 1] })
}

export function fabricTexture(base = '#2b2b2e') {
  return canvasTex('fabric' + base, 256, 256, (ctx, w, h) => {
    const r = rng(5)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 0.06
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = y % 4 ? '#fff' : '#000'; ctx.fillRect(0, y, w, 1) }
    for (let x = 0; x < w; x += 2) { ctx.fillStyle = x % 4 ? '#000' : '#fff'; ctx.fillRect(x, 0, 1, h) }
    ctx.globalAlpha = 1
    speckle(ctx, w, h, r, 3000, '#fff', 1, 0.05)
  }, { repeat: [6, 6] })
}

export function rugTexture() {
  return canvasTex('rug', 1024, 640, (ctx, w, h) => {
    const r = rng(17)
    ctx.fillStyle = '#3d3530'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#8a5a34'
    ctx.lineWidth = 10
    ctx.strokeRect(34, 34, w - 68, h - 68)
    ctx.strokeStyle = '#a77a4a'
    ctx.lineWidth = 3
    ctx.strokeRect(58, 58, w - 116, h - 116)
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = 'rgba(167,122,74,0.25)'
      ctx.lineWidth = 2
      ctx.strokeRect(90 + i * 18, 90 + i * 18, w - 180 - i * 36, h - 180 - i * 36)
    }
    speckle(ctx, w, h, r, 30000, '#000', 2, 0.12)
    speckle(ctx, w, h, r, 12000, '#fff', 1.5, 0.05)
  })
}

export function paperTexture(lines, { bg = '#f6f0e2', ink = '#2a2622', font = '32px "JetBrains Mono", monospace', w = 512, h = 384, title, ruled = true, key } = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  if (ruled) {
    ctx.strokeStyle = 'rgba(80,110,160,0.18)'
    ctx.lineWidth = 2
    for (let y = 80; y < h; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  }
  let y = 54
  if (title) {
    ctx.fillStyle = ink
    ctx.font = 'italic 48px "Instrument Serif", serif'
    ctx.fillText(title, 28, y + 10)
    y += 64
  }
  ctx.fillStyle = ink
  ctx.font = font
  for (const l of lines) { ctx.fillText(l, 28, y); y += 44 }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.userData = { key }
  return t
}

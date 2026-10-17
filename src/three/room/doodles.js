// Hand-drawn doodles for the room's paper (sticky notes, cards): vector paths
// on the canvases that become their textures. Everything wobbles a little,
// deterministically, so it reads as pen on paper rather than clip-art.

const rnd = i => { const x = Math.sin(i * 91.17 + 3.1) * 43758.5453; return x - Math.floor(x) }
export const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) }

function pen(ctx, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
}

export function tape(ctx, x, y, w, rot, color = 'rgba(132,208,232,0.55)') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -17, w, 34)
  pen(ctx, 'rgba(255,255,255,0.45)', 3)
  for (let i = -w / 2 + 10; i < w / 2; i += 22) { ctx.beginPath(); ctx.moveTo(i, -17); ctx.lineTo(i + 12, 17); ctx.stroke() }
  ctx.restore()
}

// a loose scribbled loop around something — drawn twice, never closing cleanly
export function circleAround(ctx, cx, cy, rx, ry, color = '#d4380d', w = 4, seed = 1) {
  pen(ctx, color, w)
  ctx.beginPath()
  for (let t = 0; t <= Math.PI * 2 * 1.85; t += 0.12) {
    const k = 1 + (rnd(seed + Math.floor(t * 3)) - 0.5) * 0.08 + t * 0.012
    const x = cx + Math.cos(t - 0.4) * rx * k, y = cy + Math.sin(t - 0.4) * ry * k
    t ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.stroke()
}

export function squiggle(ctx, x, y, len, color = '#F07A1A', w = 3.5) {
  pen(ctx, color, w)
  ctx.beginPath(); ctx.moveTo(x, y)
  for (let i = 0; i < len; i += 14) ctx.quadraticCurveTo(x + i + 7, y + (Math.round(i / 14) % 2 ? -6 : 6), x + i + 14, y)
  ctx.stroke()
}

export function arrow(ctx, x1, y1, x2, y2, color = 'rgba(29,20,12,0.7)', w = 3.5, bend = 0.25) {
  pen(ctx, color, w)
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke()
  const a = Math.atan2(y2 - my, x2 - mx)
  ctx.beginPath()
  ctx.moveTo(x2 - Math.cos(a - 0.5) * 18, y2 - Math.sin(a - 0.5) * 18); ctx.lineTo(x2, y2)
  ctx.lineTo(x2 - Math.cos(a + 0.5) * 18, y2 - Math.sin(a + 0.5) * 18)
  ctx.stroke()
}

export function star(ctx, x, y, r, color = 'rgba(29,20,12,0.6)', w = 3) {
  pen(ctx, color, w)
  ctx.beginPath()
  for (let k = 0; k <= 10; k++) {
    const rr = k % 2 ? r * 0.42 : r, a = -Math.PI / 2 + k * Math.PI / 5
    k ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.stroke()
}

export function sparkle(ctx, x, y, r, color = '#F07A1A', w = 3) {
  pen(ctx, color, w)
  ctx.beginPath()
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.stroke()
}

export function spiral(ctx, x, y, r, color = 'rgba(29,20,12,0.5)', w = 2.5) {
  pen(ctx, color, w)
  ctx.beginPath()
  for (let t = 0; t < Math.PI * 6; t += 0.2) {
    const rr = (t / (Math.PI * 6)) * r
    t ? ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) : ctx.moveTo(x, y)
  }
  ctx.stroke()
}

export function heart(ctx, x, y, s, color = '#d4380d', w = 3) {
  pen(ctx, color, w)
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.9)
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s, x, y - s * 0.25)
  ctx.bezierCurveTo(x + s * 0.6, y - s, x + s * 1.4, y - s * 0.1, x, y + s * 0.9)
  ctx.stroke()
}

export function check(ctx, x, y, s, color = '#2f7d32', w = 4) {
  pen(ctx, color, w)
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.8); ctx.stroke()
}

export function burst(ctx, x, y, r, color = '#d4380d', w = 3) {
  pen(ctx, color, w)
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * 0.9 + k * (Math.PI * 0.8 / 6)
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke()
  }
}

// A note's decoration set, picked from its text so each note is different but
// stable: tape on top, a curled corner, and two doodles in the free space.
const PICKS = [
  (c, w, h) => { star(c, w - 52, h - 64, 18); sparkle(c, w - 96, h - 38, 10) },
  (c, w, h) => { spiral(c, w - 54, h - 58, 22); check(c, w - 108, h - 40, 12) },
  (c, w, h) => { heart(c, w - 56, h - 64, 16); sparkle(c, w - 98, h - 40, 9, 'rgba(29,20,12,0.55)') },
  (c, w, h) => { burst(c, w - 44, h - 48, 30); star(c, w - 92, h - 34, 11, '#d4380d') },
  (c, w, h) => { sparkle(c, w - 54, h - 62, 16); sparkle(c, w - 86, h - 36, 9); sparkle(c, w - 40, h - 30, 7, 'rgba(29,20,12,0.5)') },
]

export function decorateNote(ctx, w, h, key, { link = false } = {}) {
  const k = hash(key)
  // curled corner
  ctx.fillStyle = 'rgba(0,0,0,0.10)'
  ctx.beginPath(); ctx.moveTo(w, h - 64); ctx.lineTo(w - 64, h); ctx.lineTo(w, h); ctx.closePath(); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath(); ctx.moveTo(w, h - 64); ctx.lineTo(w - 64, h); ctx.lineTo(w - 52, h - 52); ctx.closePath(); ctx.fill()
  const tapes = ['rgba(132,208,232,0.55)', 'rgba(240,122,26,0.45)', 'rgba(191,227,192,0.7)', 'rgba(244,185,138,0.6)']
  tape(ctx, w * (0.4 + rnd(k) * 0.3), 8, 120 + rnd(k + 1) * 40, (rnd(k + 2) - 0.5) * 0.3, tapes[k % tapes.length])
  if (link) arrow(ctx, w - 130, h - 46, w - 40, h - 70, 'rgba(29,20,12,0.7)', 3.5, -0.3)
  else PICKS[k % PICKS.length](ctx, w, h)
}

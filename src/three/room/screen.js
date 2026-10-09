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
const COPPER = '#F07A1A', GOLD = '#84D0E8'

// Draws the laptop screen: a desktop with a terminal typing on loop, the odd
// notification sliding in (live.ping), and — at the tour's finale — a contact
// card fading over it all. Redraws only when something visible changed.
export function createScreen() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  let last = { key: '' }
  const ready = document.fonts?.ready ?? Promise.resolve()
  ready.then(() => { last.key = '' })

  function desktop(t) {
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, '#0f161c')
    g.addColorStop(1, '#1d1a14')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    const glow = ctx.createRadialGradient(W * 0.78, H * 0.28, 0, W * 0.78, H * 0.28, 520)
    glow.addColorStop(0, 'rgba(132,208,232,0.25)')
    glow.addColorStop(1, 'rgba(132,208,232,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
    // menu bar with the visitor's real local time
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, W, 44)
    ctx.fillStyle = '#cfe0e8'
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
      ctx.fillStyle = kind === 'cmd' ? '#6f8fa0' : GOLD
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

  function notification(ui) {
    const k = ui.notif
    if (k < 0.01) return
    const w = 520, h = 132, x = W - w - 36, y = 64 - (1 - k) * 60
    ctx.globalAlpha = k
    ctx.fillStyle = 'rgba(28,34,40,0.94)'
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill()
    ctx.strokeStyle = 'rgba(132,208,232,0.5)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = COPPER
    ctx.beginPath(); ctx.arc(x + 58, y + 66, 30, 0, 7); ctx.fill()
    ctx.fillStyle = '#1d1208'; ctx.font = '600 24px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
    ctx.fillText((ui.msg?.app || '?')[0], x + 58, y + 75); ctx.textAlign = 'left'
    ctx.fillStyle = GOLD; ctx.font = '600 24px "JetBrains Mono", monospace'; ctx.fillText(ui.msg?.app || '', x + 108, y + 52)
    ctx.fillStyle = 'rgba(239,230,216,0.5)'; ctx.font = '400 20px "JetBrains Mono", monospace'; ctx.fillText('now', x + w - 64, y + 52)
    ctx.fillStyle = '#efe6d8'; ctx.font = '400 24px "JetBrains Mono", monospace'
    const text = ui.msg?.text || ''
    ctx.fillText(text.length > 34 ? text.slice(0, 33) + '…' : text, x + 108, y + 92)
    ctx.globalAlpha = 1
  }

  function contact(ui) {
    const k = ui.contact
    if (k < 0.01) return
    ctx.globalAlpha = k
    ctx.fillStyle = 'rgba(9,12,15,0.94)'
    ctx.fillRect(0, 44, W, H - 44)
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, 700)
    glow.addColorStop(0, 'rgba(240,122,26,0.22)'); glow.addColorStop(1, 'rgba(240,122,26,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 44, W, H - 44)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#8fb0be'; ctx.font = '500 26px "JetBrains Mono", monospace'
    ctx.fillText('— SHORYAVARDHAAN · KOLKATA —', W / 2, 200)
    ctx.fillStyle = '#f6efe4'; ctx.font = 'italic 300 104px "Instrument Serif", serif'
    ctx.fillText('Want to build', W / 2, 330)
    ctx.fillText('something together?', W / 2, 440)
    const rows = [['email', 'shoryavardhaans2@gmail.com'], ['call', 'cal.com/shoryavardhaan'], ['github', 'github.com/vassu-v'], ['linkedin', 'in/shoryavardhaan']]
    ctx.font = '500 30px "JetBrains Mono", monospace'
    rows.forEach(([a, b], i) => {
      const y = 560 + i * 62
      ctx.textAlign = 'right'; ctx.fillStyle = COPPER; ctx.fillText(a, W / 2 - 24, y)
      ctx.textAlign = 'left'; ctx.fillStyle = GOLD; ctx.fillText(b, W / 2 + 4, y)
    })
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(239,230,216,0.45)'; ctx.font = '400 24px "JetBrains Mono", monospace'
    ctx.fillText('tap the phone to reach out · or click here for the terminal', W / 2, H - 70)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
  }

  // ui: { notif 0…1, msg {app, text}, contact 0…1 }
  function draw(t, ui) {
    const key = [Math.floor(t * 2) % 2, new Date().getMinutes(), Math.floor(t * TYPE_RATE), ui.notif.toFixed(3), ui.contact.toFixed(3), ui.msg?.text].join('|')
    if (key === last.key) return false
    last.key = key
    desktop(t)
    notification(ui)
    contact(ui)
    // subtle vignette so it reads as a real panel up close
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

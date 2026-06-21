import { useEffect, useRef } from 'react'

export default function DotGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) return
    const cvs = canvasRef.current
    const ctx = cvs.getContext('2d')

    // — config —
    const SP         = 36      // grid spacing px
    const BASE_R     = 1.1     // dot radius at rest
    const BASE_OP    = 0.038   // dot opacity at rest
    const REPEL_R    = 95      // mouse repulsion radius
    const REPEL_F    = 24      // repulsion force magnitude
    const SPRING_K   = 0.058   // spring pull back to rest
    const DAMPING    = 0.78    // velocity damping per frame
    const BREATHE_A  = 2.4     // breathing amplitude px
    const BREATHE_SF = 0.0013  // spatial frequency of breathing
    const BREATHE_TF = 0.00030 // temporal frequency of breathing
    const RIPPLE_SPD = 4.2     // px/frame ripple expands
    const RIPPLE_MAX = 210     // ripple dies at this radius
    const WAVE_W     = 28      // width of ripple wave band
    const RIPPLE_GAP = 80      // min px mouse travels to spawn new ripple
    const TAU = Math.PI * 2

    let W = 0, H = 0, cols = 0, rows = 0
    let offX, offY, velX, velY  // Float32Arrays for spring physics
    let mouse        = { x: -9999, y: -9999 }
    let sections     = []
    let ripples      = []
    let time         = 0
    let rafId
    let rippleCool   = 0
    let lastRpX      = -9999, lastRpY = -9999

    // reused each frame to avoid GC churn
    const normalBuf  = []
    const glowBuf    = []

    function lerp(a, b, t) { return a + (b - a) * t }

    function resize() {
      W = cvs.width  = window.innerWidth
      H = cvs.height = window.innerHeight
      cols = Math.ceil(W / SP) + 2
      rows = Math.ceil(H / SP) + 2
      const n = cols * rows
      offX = new Float32Array(n)
      offY = new Float32Array(n)
      velX = new Float32Array(n)
      velY = new Float32Array(n)
    }

    function scanSections() {
      sections = []
      document.querySelectorAll('.hero-section, .sec-section, footer').forEach(el => {
        const r   = el.getBoundingClientRect()
        const visH = Math.min(r.bottom, H) - Math.max(r.top, 0)
        if (visH < 30) return
        const vis = Math.min((visH / H) * 2.4, 1)
        const cy  = Math.max(r.top, 0) + visH * 0.5
        const rad = Math.max(r.width, visH) * 0.55
        sections.push({ cx: r.left + r.width / 2, cy, rad, vis })
      })
    }

    function draw() {
      time++
      ctx.clearRect(0, 0, W, H)

      const mx = mouse.x, my = mouse.y

      // Spawn ripple when mouse moves fast enough
      rippleCool--
      const rpDist = Math.hypot(mx - lastRpX, my - lastRpY)
      if (rpDist > RIPPLE_GAP && rippleCool <= 0 && ripples.length < 6 && mx > 0) {
        ripples.push({ x: mx, y: my, r: 0 })
        lastRpX = mx; lastRpY = my
        rippleCool = 18
      }

      // Advance ripples, prune dead ones
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += RIPPLE_SPD
        if (ripples[i].r > RIPPLE_MAX) ripples.splice(i, 1)
      }

      normalBuf.length = 0
      glowBuf.length   = 0

      for (let ri = 0; ri < rows; ri++) {
        for (let ci = 0; ci < cols; ci++) {
          const idx = ri * cols + ci
          const gx  = ci * SP
          const gy  = ri * SP

          // Breathing: spatially-offset sin/cos
          const sp  = gx * BREATHE_SF + gy * BREATHE_SF * 0.78
          const tf  = time * BREATHE_TF
          const bx  = Math.sin(sp + tf) * BREATHE_A
          const by  = Math.cos(sp * 1.09 + tf * 0.71) * BREATHE_A

          // Repulsion spring physics
          const dx   = gx - mx
          const dy   = gy - my
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < REPEL_R && dist > 0) {
            const t = 1 - dist / REPEL_R
            const f = t * t * REPEL_F
            velX[idx] += (dx / dist) * f
            velY[idx] += (dy / dist) * f
          }
          // Spring pulls offset back to zero
          velX[idx] -= offX[idx] * SPRING_K
          velY[idx] -= offY[idx] * SPRING_K
          velX[idx] *= DAMPING
          velY[idx] *= DAMPING
          offX[idx] += velX[idx]
          offY[idx] += velY[idx]

          const x = gx + bx + offX[idx]
          const y = gy + by + offY[idx]

          // Section ambient brightness
          let sg = 0
          for (let si = 0; si < sections.length; si++) {
            const s   = sections[si]
            const sx  = x - s.cx, sy = y - s.cy
            const sd2 = sx * sx + sy * sy
            if (sd2 < s.rad * s.rad) {
              const g = (1 - Math.sqrt(sd2) / s.rad) * s.vis
              if (g > sg) sg = g
            }
          }

          // Mouse glow
          const mg = dist < 110 ? Math.max(0, 1 - dist / 110) : 0

          // Ripple glow: brighten at the wave front
          let rg = 0
          for (let ri2 = 0; ri2 < ripples.length; ri2++) {
            const rp   = ripples[ri2]
            const rdst = Math.hypot(x - rp.x, y - rp.y)
            const wd   = Math.abs(rdst - rp.r)
            if (wd < WAVE_W) {
              const wg = (1 - wd / WAVE_W) * (1 - rp.r / RIPPLE_MAX)
              if (wg > rg) rg = wg
            }
          }

          const glow = Math.max(mg, sg * 0.72, rg * 0.92)

          if (glow < 0.045) {
            normalBuf.push(x, y)
          } else {
            glowBuf.push({ x, y, mg, sg, rg, glow })
          }
        }
      }

      // Batch draw base dots
      ctx.fillStyle = `rgba(215,215,215,${BASE_OP})`
      ctx.beginPath()
      for (let i = 0; i < normalBuf.length; i += 2) {
        const nx = normalBuf[i], ny = normalBuf[i + 1]
        ctx.moveTo(nx + BASE_R, ny)
        ctx.arc(nx, ny, BASE_R, 0, TAU)
      }
      ctx.fill()

      // Draw glow dots individually (color varies per dot)
      for (let i = 0; i < glowBuf.length; i++) {
        const { x, y, mg, sg, rg, glow } = glowBuf[i]
        const op  = BASE_OP + glow * 0.34
        const rad = BASE_R  + glow * 1.9

        let rv, gv, bv
        if (rg >= mg && rg >= sg * 0.6) {
          // Ripple wave front — warm gold burst
          rv = lerp(215, 238, rg)
          gv = lerp(215, 180, rg)
          bv = lerp(215, 80,  rg)
        } else if (mg > sg * 0.65) {
          // Near mouse — copper
          rv = lerp(215, 197, mg)
          gv = lerp(215, 123, mg)
          bv = lerp(215, 43,  mg)
        } else {
          // Section ambient — warm off-white
          rv = lerp(215, 240, sg * 0.55)
          gv = lerp(215, 230, sg * 0.40)
          bv = lerp(215, 210, sg * 0.55)
        }

        ctx.beginPath()
        ctx.arc(x, y, rad, 0, TAU)
        ctx.fillStyle = `rgba(${Math.round(rv)},${Math.round(gv)},${Math.round(bv)},${op.toFixed(3)})`
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    const onMove   = e => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onResize = () => { resize(); scanSections() }

    document.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize',      onResize, { passive: true })
    window.addEventListener('scroll',      scanSections, { passive: true })

    resize()
    scanSections()
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize',      onResize)
      window.removeEventListener('scroll',      scanSections)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

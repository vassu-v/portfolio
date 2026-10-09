import { useEffect, useRef, useState } from 'react'
import { live, room, useRoom } from './store'

// Solve the 3×3 homography mapping the unit rectangle (w×h) onto a quad and
// express it as a CSS matrix3d, so a flat DOM element lands exactly on the
// laptop's 3D screen, perspective and all.
function homography(w, h, quad) {
  const src = [[0, 0], [w, 0], [w, h], [0, h]]
  const A = [], b = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = quad[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v)
  }
  // gaussian elimination, 8×8
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  const [a, bb, c, d, e, f, g, hh] = b.map((v, i) => v / A[i][i])
  return `matrix3d(${a},${d},0,${g},${bb},${e},0,${hh},0,0,1,0,${c},${f},0,1)`
}

const TW = 880, TH = 554

export default function LaptopTerminal() {
  const focus = useRoom(s => s.focus)
  const ref = useRef()
  const [ready, setReady] = useState(false)
  const on = focus === 'laptop'

  useEffect(() => {
    const onMsg = e => { if (e.origin === window.location.origin && e.data?.type === 'cli:exit') room.set({ focus: null }) }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!on) return
    let raf
    const t = setTimeout(() => setReady(true), 900)
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const q = live.screenQuad
      if (q && ref.current) ref.current.style.transform = homography(TW, TH, q)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(t); setReady(false) }
  }, [on])

  if (!on) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
      <iframe
        ref={ref}
        title="Terminal"
        src="/terminal/index.html?embed"
        style={{
          position: 'absolute', left: 0, top: 0, width: TW, height: TH, border: 0,
          transformOrigin: '0 0', background: '#0b0907', pointerEvents: ready ? 'auto' : 'none',
          opacity: ready ? 1 : 0, transition: 'opacity 0.6s ease',
        }}
      />
    </div>
  )
}

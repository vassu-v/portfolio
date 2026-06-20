import { useEffect, useRef } from 'react'

const SKILLS = [
  'Python','C++','Arduino','JavaScript','Flask','Linux (Pop!_OS)',
  'IoT','Open Source','AI / Planning Systems','Hardware',
  'Razorpay / UPI','Vercel','Product Design','Systems Thinking',
  'Networking','Zenodo Research','Financial Literacy','Constraint Thinking',
]

const items = [...SKILLS, ...SKILLS, ...SKILLS]

export default function Ticker() {
  const stripRef = useRef(null)

  useEffect(() => {
    let lastY = window.scrollY, lastT = performance.now()
    let currentSpeed = 34  // seconds for full cycle at rest
    let raf

    const tick = () => {
      const now = performance.now()
      const dy  = Math.abs(window.scrollY - lastY)
      const dt  = now - lastT
      const vel = dy / Math.max(dt, 1)  // px/ms

      // Speed up the ticker proportional to scroll velocity, cap at 4x
      const targetSpeed = 34 / Math.min(1 + vel * 18, 4)
      currentSpeed += (targetSpeed - currentSpeed) * 0.04  // lerp toward target

      if (stripRef.current) stripRef.current.style.animationDuration = `${currentSpeed}s`

      lastY = window.scrollY
      lastT = now
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ padding: '20px 0', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '80px', background: 'linear-gradient(to right, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '80px', background: 'linear-gradient(to left, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div
        ref={stripRef}
        style={{ display: 'flex', width: 'max-content', animation: 'tick 34s linear infinite' }}
        onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
      >
        {items.map((s, i) => (
          <span key={i} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
            color: 'var(--text3)', letterSpacing: '0.1em', padding: '0 24px',
            whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '0.32rem', color: 'var(--cu)', opacity: 0.5 }}>◆</span>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

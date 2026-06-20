const SKILLS = [
  'Python','C++','Arduino','JavaScript','Flask','Linux (Pop!_OS)',
  'IoT','Open Source','AI / Planning Systems','Hardware',
  'Razorpay / UPI','Vercel','Product Design','Systems Thinking',
  'Networking','Zenodo Research','Financial Literacy','Constraint Thinking',
]

const items = [...SKILLS, ...SKILLS, ...SKILLS]

export default function Ticker() {
  return (
    <div style={{ padding: '20px 0', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '80px', background: 'linear-gradient(to right, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '80px', background: 'linear-gradient(to left, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div
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

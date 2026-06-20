import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const CARDS = [
  {
    tag: 'Community', org: 'Bits&Bytes Kolkata',
    desc: 'Kolkata Fork Lead. Building the Eastern India chapter — hackathons, builder events, core team formation. Launched Apr 2026.',
    pill: 'Active',
  },
  {
    tag: 'Work', org: '4MQ.org',
    desc: 'Youth Partner + Consultant. Own the Antigravity Workflow. On equity. Advised production stack, co-authored episodes with Richard Kim.',
    pill: 'Active',
  },
  {
    tag: 'Building', org: 'Buy4Chai',
    desc: 'Maintaining the open-source Razorpay/UPI supporter page. Responding to community issues. Planning v2 from contributor feedback.',
    pill: 'Shipping · Open source',
  },
]

function CurrCard({ c, i }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 35%'] })
  const delay = i * 0.08
  const opacity = useTransform(scrollYProgress, [delay, 0.7 + delay], [0, 1])
  const y       = useTransform(scrollYProgress, [delay, 0.7 + delay], [28, 0])

  return (
    <motion.div
      ref={ref}
      style={{
        opacity, y,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--border)',
        borderRadius: '13px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        transition: 'background 0.2s, border-color 0.2s',
        willChange: 'transform',
      }}
      whileHover={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border2)' }}
    >
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--cu)' }}>{c.tag}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{c.org}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.65, flex: 1 }}>{c.desc}</div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
        color: 'var(--cu)', background: 'var(--cu-d)', border: '1px solid var(--cu-b)',
        padding: '4px 10px', borderRadius: '100px', width: 'fit-content',
        letterSpacing: '0.04em', marginTop: '8px',
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--cu)', flexShrink: 0 }} />
        {c.pill}
      </div>
    </motion.div>
  )
}

export default function Currently() {
  return (
    <section id="currently" className="sec-section" style={{ padding: '0 var(--pad) 80px', position: 'relative', zIndex: 1 }}>
      <div className="curr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {CARDS.map((c, i) => <CurrCard key={i} c={c} i={i} />)}
      </div>
    </section>
  )
}

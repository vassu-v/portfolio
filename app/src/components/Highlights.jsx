import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

function useCountUp(target, prefix = '', duration = 2000, start = false) {
  const [val, setVal] = useState(prefix + '0')
  useEffect(() => {
    if (!start) return
    let startTime = null
    const run = (ts) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      const ease = p * (2 - p)
      setVal(prefix + Math.floor(ease * target).toLocaleString())
      if (p < 1) requestAnimationFrame(run)
      else setVal(prefix + target.toLocaleString())
    }
    requestAnimationFrame(run)
  }, [start])
  return val
}

function StatCard({ target, prefix, color, id }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const val = useCountUp(target, prefix, id === 'c-li' ? 2000 : 1400, inView)
  return (
    <div ref={ref}>
      <span style={{
        fontFamily: 'Instrument Serif, serif', fontSize: '2.5rem', fontWeight: 700,
        letterSpacing: '-0.04em', lineHeight: 1, color,
      }}>
        {val}
      </span>
    </div>
  )
}

const CARDS = [
  {
    cls: 'c2 tgo', label: 'India Innovates 2026', title: 'National Semi-Finalist',
    desc: 'SarkarSathi. Top 1,000 from 26,000+ entries. Sole technical lead on a 5-person team during board exams. Media coverage. One of the youngest compositions.',
    bottom: <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--go)' }}>Top 1k</span>,
    border: 'var(--go-b)', bg: 'var(--go-d)',
  },
  {
    cls: 'tcu r2', label: 'LinkedIn', title: 'Followers',
    desc: '8 months. No algorithm chasing. One post hit 15,000+ impressions.',
    bottom: <StatCard id="c-li" target={1249} prefix="" color="var(--cu)" />,
    border: 'var(--cu-b)', bg: 'var(--cu-d)',
  },
  {
    cls: '', label: 'International Payments Processed', title: 'From Kolkata. Age 16.',
    bottom: <StatCard id="c-pay" target={300} prefix="$" color="var(--text)" />,
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
  {
    cls: 'c2', label: 'Zenodo · Jan 2026', title: 'Published Research Preprint',
    desc: 'Object Commitment as a Diagnostic Pressure Point in Grounded Planning — exposing failure modes that high success rates hide.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
  {
    cls: '', label: "Quantum Qubit'25", title: '3rd Place',
    desc: 'Built real-world systems across CS and electronics under competition constraints.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
  {
    cls: '', label: 'Google Cloud · Age 14', title: 'Ready Facilitator',
    desc: 'Recognized for active participation and winning.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
  {
    cls: '', label: 'ThinkStartup · 2025', title: 'Top 500 National',
    desc: 'Youth Ideathon. Top 2,000 → Top 500 with PickedIn.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
  {
    cls: 'c2', label: 'Amazon KDP · Age 14', title: 'Published Author',
    desc: 'Wrote, formatted, designed the cover, navigated Amazon\'s publishing at 14 — no AI. Zero sales. Redesigned it a year later. Then sold copies. The lesson wasn\'t the book. It was finishing.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
  },
]

function BentoCard({ card, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 30%'] })
  // Cards in later columns start slightly behind — creates a wave across the grid
  const colOffset = (index % 4) * 0.06
  const opacity = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [0, 1])
  const y       = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [24, 0])
  const { cls = '', label, title, desc, bottom, border, bg } = card
  const spanCol = cls.includes('c2') ? 2 : 1
  const spanRow = cls.includes('r2') ? 2 : 1

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y,
        gridColumn: `span ${spanCol}`,
        gridRow: `span ${spanRow}`,
        background: bg,
        willChange: 'transform',
        border: `1px solid ${border}`,
        borderRadius: '13px',
        padding: '24px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: spanRow === 2 ? '330px' : '160px',
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.22s, transform 0.22s, box-shadow 0.22s',
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}
    >
      <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', top: '-45px', right: '-45px', border: '1px solid var(--border)', pointerEvents: 'none' }} />
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.57rem', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '7px' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.58, marginTop: '8px' }}>{desc}</div>}
      </div>
      {bottom && <div>{bottom}</div>}
    </motion.div>
  )
}

export default function Highlights() {
  return (
    <section id="highlights" className="sec-section" style={{ padding: '0 var(--pad) 100px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {CARDS.map((card, i) => <BentoCard key={i} card={card} index={i} />)}
      </div>
    </section>
  )
}

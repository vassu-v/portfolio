import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import Lightbox from './Lightbox'

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

// Images linked to achievements — src paths served from /public
const CARDS = [
  {
    cls: 'c2 tgo', label: 'India Innovates 2026', title: 'National Semi-Finalist',
    desc: 'SarkarSathi. Top 1,000 from 26,000+ entries. Sole technical lead on a 5-person team during board exams. Media coverage. One of the youngest compositions.',
    bottom: <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--go)' }}>Top 1k</span>,
    border: 'var(--go-b)', bg: 'var(--go-d)',
    images: [
      { src: '/projects/sarkarsathi_cm.jpg', rotate: 6, top: '-44px', right: '-18px' },
    ],
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
    images: [
      { src: '/preprint.jpg', rotate: -7, top: '-42px', right: '-16px' },
    ],
  },
  {
    cls: '', label: "Quantum Qubit'25", title: '3rd Place',
    desc: 'Built real-world systems across CS and electronics under competition constraints.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
    images: [
      { src: '/dbpc.jpg',    rotate: 8,   top: '-42px', right: '-18px' },
      { src: '/solder.jpeg', rotate: -6, bottom: '-36px', left: '-14px' },
    ],
  },
  {
    cls: '', label: 'Google Cloud · Age 14', title: 'Ready Facilitator',
    desc: 'Recognized for active participation and winning.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
    images: [
      { src: '/google.jpeg', rotate: -5, top: '-40px', left: '-14px' },
    ],
  },
  {
    cls: '', label: 'ThinkStartup · 2025', title: 'Top 500 National',
    desc: 'Youth Ideathon. Top 2,000 → Top 500 with PickedIn.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
    images: [
      { src: '/syi.webp', rotate: -7, top: '-44px', right: '-16px' },
    ],
  },
  {
    cls: 'c2', label: 'Amazon KDP · Age 14', title: 'Published Author',
    desc: "Wrote, formatted, designed the cover, navigated Amazon's publishing at 14 — no AI. Zero sales. Redesigned it a year later. Then sold copies. The lesson wasn't the book. It was finishing.",
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
    images: [
      { src: '/amzn.jpeg', rotate: 7, top: '-44px', right: '-18px' },
    ],
  },
]

// ── Floating polaroid image ────────────────────────────────────────────────────

function FloatingImg({ src, rotate, top, right, bottom, left, delay, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, rotate: rotate * 0.5 }}
      animate={{ opacity: 1, scale: 1,    rotate }}
      exit={{    opacity: 0, scale: 0.82, rotate: rotate * 0.5 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}
      onClick={onClick}
      style={{
        position: 'absolute', top, right, bottom, left,
        zIndex: 20,
        background: '#fff',
        padding: '5px 5px 16px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
        pointerEvents: 'auto',
        width: '130px',
        cursor: 'zoom-in',
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        style={{ width: '100%', height: '82px', objectFit: 'cover', display: 'block' }}
      />
    </motion.div>
  )
}

// ── Bento card ─────────────────────────────────────────────────────────────────

function BentoCard({ card, index }) {
  const ref = useRef(null)
  const [hovered, setHovered]       = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 30%'] })
  const colOffset = (index % 4) * 0.06
  const opacity = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [0, 1])
  const y       = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [24, 0])

  const { cls = '', label, title, desc, bottom, border, bg, images } = card
  const spanCol = cls.includes('c2') ? 2 : 1
  const spanRow = cls.includes('r2') ? 2 : 1
  const hasImages = images?.length > 0

  return (
    <>
      {/* Outer: grid placement + scroll reveal + hover tracking covers card + polaroids */}
      <motion.div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          gridColumn: `span ${spanCol}`,
          gridRow: `span ${spanRow}`,
          opacity, y,
          position: 'relative',
          zIndex: hovered && hasImages ? 20 : 1,
          willChange: 'transform',
        }}
      >
        {/* Inner: visible card */}
        <motion.div
          animate={{ y: hovered ? -2 : 0, boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.45)' : '0 0 0 rgba(0,0,0,0)' }}
          transition={{ duration: 0.22 }}
          style={{
            height: '100%',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '13px',
            padding: '24px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: spanRow === 2 ? '330px' : '160px',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 0.22s',
          }}
        >
          <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', top: '-45px', right: '-45px', border: '1px solid var(--border)', pointerEvents: 'none' }} />
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.57rem', letterSpacing: '0.17em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '7px' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
            {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.58, marginTop: '8px' }}>{desc}</div>}
          </div>
          {bottom && <div>{bottom}</div>}
        </motion.div>

        {/* Floating polaroids — outside inner card so they overflow; clickable */}
        <AnimatePresence>
          {hovered && hasImages && images.map((img, i) => (
            <FloatingImg
              key={i}
              src={img.src}
              rotate={img.rotate}
              top={img.top}
              right={img.right}
              bottom={img.bottom}
              left={img.left}
              delay={i * 0.07}
              onClick={(e) => { e.stopPropagation(); setLightboxSrc(img.src) }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </AnimatePresence>
    </>
  )
}

export default function Highlights() {
  return (
    <section id="highlights" className="sec-section" style={{ padding: '0 var(--pad) 100px', position: 'relative', zIndex: 1 }}>
      <div className="hl-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {CARDS.map((card, i) => <BentoCard key={i} card={card} index={i} />)}
      </div>
    </section>
  )
}

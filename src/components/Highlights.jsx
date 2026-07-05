import { useRef, useEffect, useState, useContext, createContext } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion'
import Lightbox from './Lightbox'
import CRTMonitor from './CRTMonitor'

const HoveredImageContext = createContext({ hoveredSrc: null, setHoveredSrc: () => {} })

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
  { gram: true, cls: 'r2' },
  {
    cls: '', label: 'International Payments Processed', title: 'From Kolkata. Age 16.',
    bottom: <StatCard id="c-pay" target={300} prefix="$" color="var(--text)" />,
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
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
    cls: 'c2', label: 'Zenodo · Jan 2026', title: 'Published Research Preprint',
    desc: 'Object Commitment as a Diagnostic Pressure Point in Grounded Planning — exposing failure modes that high success rates hide.',
    border: 'var(--border)', bg: 'rgba(255,255,255,0.025)',
    images: [
      { src: '/preprint.jpg', rotate: -7, top: '-42px', right: '-16px' },
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
  { crt: true, cls: '' },
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

// ── Gramophone widget ──────────────────────────────────────────────────────────

function GramophoneCard({ index }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(true)
  const { hoveredSrc } = useContext(HoveredImageContext)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 30%'] })
  const colOffset = (index % 4) * 0.06
  const opacity = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [0, 1])
  const y       = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [24, 0])

  const rotate = useMotionValue(0)
  const speed  = useRef(0)
  useAnimationFrame((_, delta) => {
    const d = Math.min(delta, 64)
    speed.current += ((playing ? 42 : 0) - speed.current) * Math.min(d / 600, 1)
    if (speed.current > 0.1) rotate.set((rotate.get() + (speed.current * d) / 1000) % 360)
  })

  return (
    <motion.div
      ref={ref}
      className="tgo"
      style={{ gridColumn: 'span 1', gridRow: 'span 2', opacity, y, position: 'relative' }}
    >
      <div
        onClick={() => setPlaying(p => !p)}
        style={{
          height: '100%', aspectRatio: '1 / 1',
          background: '#000',
          border: '1px solid var(--go-b)',
          borderRadius: '13px',
          position: 'relative', overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Record */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '86%', aspectRatio: '1 / 1' }}>
          <motion.div style={{
            rotate,
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0px, rgba(0,0,0,0) 1.5px, rgba(0,0,0,0) 3.5px), radial-gradient(circle, rgba(20,20,20,1), rgba(5,5,5,1))',
            boxShadow: '0 0 0 1.5px var(--go-b), 0 14px 40px rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Center label - shows hovered image or default */}
            <div style={{
              width: '32%', height: '32%', borderRadius: '50%',
              background: hoveredSrc
                ? `url(${hoveredSrc}) center/cover no-repeat`
                : 'radial-gradient(circle at 38% 32%, rgba(30,30,30,1), rgba(8,8,8,1))',
              border: '1px solid var(--go-b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: playing ? 'none' : 'grayscale(1)',
              transition: 'filter 0.3s ease',
            }}>
              {!hoveredSrc && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--go)', boxShadow: '0 0 6px rgba(212,152,58,0.6)' }} />
              )}
            </div>
          </motion.div>
          {/* Static sheen — stays put while grooves spin */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            background: 'conic-gradient(from 205deg, rgba(0,0,0,0) 0deg, rgba(255,255,255,0.06) 22deg, rgba(0,0,0,0) 48deg, rgba(0,0,0,0) 180deg, rgba(255,255,255,0.04) 205deg, rgba(0,0,0,0) 230deg)',
          }} />
        </div>

        {/* Tonearm */}
        <motion.div
          animate={{ rotate: playing ? 15 : -6 }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{
            position: 'absolute', top: '5%', right: '2%',
            width: '32%', height: '68%',
            transformOrigin: '72% 11%',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 100 200" width="100%" height="100%" fill="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="gram-arm" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#5e3f13" />
                <stop offset="0.35" stopColor="#f0c069" />
                <stop offset="0.55" stopColor="#fbe3a8" />
                <stop offset="0.75" stopColor="#c8913a" />
                <stop offset="1" stopColor="#8a6220" />
              </linearGradient>
              <radialGradient id="gram-pivot" cx="0.35" cy="0.3" r="1">
                <stop offset="0" stopColor="#3a3a3a" />
                <stop offset="0.6" stopColor="#111" />
                <stop offset="1" stopColor="#000" />
              </radialGradient>
              <radialGradient id="gram-knob" cx="0.35" cy="0.3" r="1">
                <stop offset="0" stopColor="#fbe3a8" />
                <stop offset="0.5" stopColor="#d4983a" />
                <stop offset="1" stopColor="#7a5518" />
              </radialGradient>
              <linearGradient id="gram-cart" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2e2e2e" />
                <stop offset="0.5" stopColor="#141414" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <filter id="gram-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="-5" dy="7" stdDeviation="5" floodColor="#000" floodOpacity="0.75" />
              </filter>
            </defs>
            <g filter="url(#gram-shadow)">
              <circle cx="72" cy="24" r="18" fill="url(#gram-pivot)" stroke="rgba(212,152,58,0.35)" strokeWidth="1.5" />
              <circle cx="72" cy="24" r="9" fill="url(#gram-knob)" />
              <circle cx="69" cy="21" r="3" fill="rgba(255,255,255,0.55)" />
              <path d="M72 24 C 75 82, 54 112, 36 152" stroke="rgba(60,38,8,0.9)" strokeWidth="7" strokeLinecap="round" />
              <path d="M72 24 C 75 82, 54 112, 36 152" stroke="url(#gram-arm)" strokeWidth="5" strokeLinecap="round" />
              <path d="M71 24 C 73.5 80, 53 110, 35.5 150" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
              <rect x="24" y="148" width="22" height="36" rx="5" transform="rotate(24 35 166)" fill="url(#gram-cart)" stroke="rgba(212,152,58,0.4)" strokeWidth="1.5" />
              <circle cx="31" cy="158" r="1.6" fill="var(--go)" transform="rotate(24 35 166)" />
              <circle cx="40" cy="158" r="1.6" fill="var(--go)" transform="rotate(24 35 166)" />
            </g>
          </svg>
        </motion.div>

        {/* Power */}
        <div style={{
          position: 'absolute', bottom: '14px', left: '16px',
          width: '20px', height: '20px', borderRadius: '50%',
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: playing ? 'var(--go)' : 'var(--text3)',
            boxShadow: playing ? '0 0 8px var(--go)' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Bento card ─────────────────────────────────────────────────────────────────

function BentoCard({ card, index }) {
  const ref = useRef(null)
  const [hovered, setHovered]       = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const { setHoveredSrc } = useContext(HoveredImageContext)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 30%'] })
  const colOffset = (index % 4) * 0.06
  const opacity = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [0, 1])
  const y       = useTransform(scrollYProgress, [colOffset, 0.7 + colOffset], [24, 0])

  const { cls = '', label, title, desc, bottom, border, bg, images } = card
  const spanCol = cls.includes('c2') ? 2 : 1
  const spanRow = cls.includes('r2') ? 2 : 1
  const hasImages = images?.length > 0
  const firstImage = images?.[0]?.src

  return (
    <>
      {/* Outer: grid placement + scroll reveal + hover tracking covers card + polaroids */}
      <motion.div
        ref={ref}
        onMouseEnter={() => { setHovered(true); if (firstImage) setHoveredSrc(firstImage) }}
        onMouseLeave={() => { setHovered(false); setHoveredSrc(null) }}
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
  const [hoveredSrc, setHoveredSrc] = useState(null)

  return (
    <HoveredImageContext.Provider value={{ hoveredSrc, setHoveredSrc }}>
      <section id="highlights" className="sec-section" style={{ padding: '0 var(--pad) 100px', position: 'relative', zIndex: 1 }}>
        <div className="hl-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {CARDS.map((card, i) => card.gram
            ? <GramophoneCard key={i} index={i} />
            : card.crt
            ? <CRTCard key={i} />
            : <BentoCard key={i} card={card} index={i} />)}
        </div>
      </section>
    </HoveredImageContext.Provider>
  )
}

function CRTCard() {
  return (
    <div style={{ gridColumn: '4', gridRow: '4', position: 'relative' }}>
      <CRTMonitor text="Now Playing:\nLife + JEE" isTag />
    </div>
  )
}

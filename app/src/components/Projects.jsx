import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { PROJECTS } from '../data/projects'
import { useRoute } from '../router'

const INTERVAL = 3200

// ─── Left: name row ────────────────────────────────────────────────────────────

function NameRow({ project, isActive, progressKey, onEnter, onNavigate }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 50%'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const x       = useTransform(scrollYProgress, [0, 1], [-20, 0])
  const { n, featured, name } = project

  return (
    <motion.div
      ref={ref}
      style={{ opacity, x }}
      onMouseEnter={onEnter}
    >
      <div
        onClick={onNavigate}
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr auto',
          alignItems: 'center',
          gap: '18px',
          padding: '26px 0',
          borderTop: '1px solid var(--border)',
          position: 'relative',
          cursor: 'none',
        }}
      >
        {/* Left copper bar — active indicator */}
        <motion.div
          animate={{ scaleY: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            left: 'calc(-1 * var(--pad))',
            top: 0, bottom: 0, width: '2px',
            background: 'var(--cu)',
            transformOrigin: 'top',
          }}
        />

        {/* Number */}
        <motion.span
          animate={{ color: isActive ? 'var(--cu)' : 'var(--text3)' }}
          transition={{ duration: 0.18 }}
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.64rem', letterSpacing: '0.06em' }}
        >
          {n}
        </motion.span>

        {/* Name */}
        <motion.span
          animate={{ color: isActive ? 'var(--text)' : 'var(--text2)' }}
          transition={{ duration: 0.18 }}
          style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.75rem)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          {name}
        </motion.span>

        {/* Featured badge / active arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {featured && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
              color: 'var(--cu)', border: '1px solid var(--cu-b)',
              padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}>
              featured
            </span>
          )}
          <motion.i
            className="fa-solid fa-arrow-right"
            animate={{
              color: isActive ? 'var(--cu)' : 'var(--text3)',
              x: isActive ? 3 : 0,
            }}
            transition={{ duration: 0.18 }}
            style={{ fontSize: '0.8rem' }}
          />
        </div>

        {/* Auto-advance progress bar — re-mounts on each activation */}
        {isActive && (
          <motion.div
            key={progressKey}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: (INTERVAL - 200) / 1000, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '1px',
              background: 'var(--cu)',
              transformOrigin: 'left',
              opacity: 0.5,
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ─── Right: detail panel ───────────────────────────────────────────────────────

function DetailPanel({ project, onNavigate }) {
  const { n, featured, name, tags, desc, stat } = project

  return (
    <motion.div
      key={n}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative', paddingTop: '8px' }}
    >
      {/* Ghost number backdrop */}
      <div style={{
        fontFamily: 'Instrument Serif, serif',
        fontSize: 'clamp(100px, 16vw, 180px)',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color: 'var(--text)',
        opacity: 0.035,
        userSelect: 'none',
        pointerEvents: 'none',
        marginBottom: '-0.3em',
      }}>
        {n}
      </div>

      {/* Project name — serif italic, big */}
      <h3 style={{
        fontFamily: 'Instrument Serif, serif',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(1.8rem, 3.2vw, 3rem)',
        letterSpacing: '-0.02em',
        lineHeight: 1.12,
        color: 'var(--text)',
        marginBottom: '20px',
      }}>
        {name}
      </h3>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {tags.map(t => (
          <span key={t} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.57rem',
            padding: '4px 10px',
            border: `1px solid ${featured ? 'var(--cu-b)' : 'var(--border)'}`,
            borderRadius: '3px',
            color: featured ? 'var(--cu)' : 'var(--text3)',
            letterSpacing: '0.06em',
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.92rem',
        color: 'var(--text2)',
        lineHeight: 1.85,
        marginBottom: '24px',
        maxWidth: '480px',
      }}>
        {desc}
      </p>

      {/* Stat */}
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.62rem',
        color: 'var(--text3)',
        letterSpacing: '0.04em',
        display: 'flex', alignItems: 'center', gap: '7px',
      }}>
        <span style={{ color: featured ? 'var(--go)' : 'var(--cu)', fontSize: '0.7rem' }}>★</span>
        {stat}
      </p>

      {/* View case study */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: 0.15 }}
        onClick={onNavigate}
        style={{
          marginTop: '28px',
          display: 'inline-flex', alignItems: 'center', gap: '9px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--cu)', background: 'none', border: 'none',
          cursor: 'none', padding: 0,
        }}
        onMouseEnter={e => e.currentTarget.querySelector('i').style.transform = 'translateX(4px)'}
        onMouseLeave={e => e.currentTarget.querySelector('i').style.transform = 'none'}
      >
        View case study
        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.6rem', transition: 'transform 0.2s' }} />
      </motion.button>

      {/* Bottom rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        style={{
          marginTop: '32px',
          height: '1px',
          background: `linear-gradient(to right, ${featured ? 'var(--cu-b)' : 'var(--border)'}, transparent)`,
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  )
}

// ─── Section ───────────────────────────────────────────────────────────────────

export default function Projects() {
  const [activeIdx, setActiveIdx]     = useState(0)
  const [progressKey, setProgressKey] = useState(0)
  const { navigate } = useRoute()
  const timerRef   = useRef(null)
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 90%', 'start 30%'] })
  const sectionOp = useTransform(scrollYProgress, [0, 1], [0, 1])
  const sectionY  = useTransform(scrollYProgress, [0, 1], [30, 0])

  const startTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % PROJECTS.length)
      setProgressKey(k => k + 1)
    }, INTERVAL)
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  const handleEnter = (i) => {
    setActiveIdx(i)
    setProgressKey(k => k + 1)
    startTimer()
  }

  const goTo = (slug) => navigate(`/project/${slug}`)

  return (
    <motion.section
      id="projects"
      ref={sectionRef}
      className="sec-section"
      style={{ opacity: sectionOp, y: sectionY, padding: '20px var(--pad) 80px', position: 'relative', zIndex: 1 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '45% 1fr', gap: 'clamp(40px, 6vw, 100px)', alignItems: 'start' }}>

        {/* Left — name index */}
        <div>
          {PROJECTS.map((p, i) => (
            <NameRow
              key={p.n}
              project={p}
              isActive={activeIdx === i}
              progressKey={`${i}-${progressKey}`}
              onEnter={() => handleEnter(i)}
              onNavigate={() => goTo(p.slug)}
            />
          ))}
          {/* closing rule */}
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>

        {/* Right — detail panel, sticky */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <AnimatePresence mode="wait">
            <DetailPanel
              key={activeIdx}
              project={PROJECTS[activeIdx]}
              onNavigate={() => goTo(PROJECTS[activeIdx].slug)}
            />
          </AnimatePresence>
        </div>

      </div>
    </motion.section>
  )
}

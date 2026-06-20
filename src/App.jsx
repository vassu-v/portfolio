import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Router, useRoute } from './router'
import DotGrid from './components/DotGrid'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Ticker from './components/Ticker'
import Highlights from './components/Highlights'
import Currently from './components/Currently'
import Footer from './components/Footer'
import ProjectPage from './pages/ProjectPage'

// Section → cursor RGB color map
const SECTION_COLORS = {
  about:      { r: 91,  g: 143, b: 175 }, // slate
  highlights: { r: 212, g: 152, b: 58  }, // gold
}
const COPPER = { r: 197, g: 123, b: 43 }

function ZoneDivider() {
  return (
    <div style={{ padding: '0 var(--pad)', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--border2) 20%, var(--border2) 80%, transparent)' }} />
    </div>
  )
}

function Preloader() {
  return (
    <motion.div
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(100% 0% 0% 0%)', transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] } }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '8px',
      }}
    >
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem',
        fontWeight: 500, color: 'var(--cu)', letterSpacing: '0.1em',
        display: 'flex', alignItems: 'center',
      }}>
        SG
        <span style={{
          display: 'inline-block', width: '2px', height: '1.1em',
          background: 'var(--cu)', marginLeft: '3px', verticalAlign: 'middle',
          animation: 'blink 1.1s step-end infinite',
        }} />
      </span>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '48px' }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        style={{ height: '1px', background: 'var(--cu)', opacity: 0.35 }}
      />
    </motion.div>
  )
}

function Portfolio() {
  return (
    <>
      <Nav />
      <Hero />
      <About />
      <ZoneDivider />
      <Projects />
      <Ticker />
      <Highlights />
      <ZoneDivider />
      <Currently />
      <Footer />
    </>
  )
}

function AppShell() {
  const { path } = useRoute()
  const projectMatch = path.match(/^\/project\/([^/]+)$/)

  return (
    <AnimatePresence mode="wait">
      {projectMatch
        ? <ProjectPage key={path} slug={projectMatch[1]} />
        : <Portfolio key="home" />
      }
    </AnimatePresence>
  )
}

export default function App() {
  const cursorRef = useRef(null)
  const spRef     = useRef(null)
  const isHover   = useRef(false)
  const curColor  = useRef({ ...COPPER })
  const curTarget = useRef({ ...COPPER })
  const [preloaderVisible, setPreloaderVisible] = useState(true)

  // Preloader
  useEffect(() => {
    const t = setTimeout(() => setPreloaderVisible(false), 950)
    return () => clearTimeout(t)
  }, [])

  // ── Smooth scroll (wheel-driven, Lenis-style) ─────────────────────────────
  useEffect(() => {
    let targetY = window.scrollY
    let rafId

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

    const onWheel = (e) => {
      e.preventDefault()
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      targetY = clamp(targetY + e.deltaY, 0, maxY)
    }

    const tick = () => {
      const diff = targetY - window.scrollY
      if (Math.abs(diff) > 0.5) {
        document.documentElement.scrollTop = window.scrollY + diff * 0.1
      } else {
        document.documentElement.scrollTop = targetY
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // ── Cursor + color-per-section ────────────────────────────────────────────
  useEffect(() => {
    let mx = 0, my = 0, cx = 0, cy = 0, rafId
    const cur = cursorRef.current

    const onMove = e => { mx = e.clientX; my = e.clientY }

    ;(function raf() {
      // Position
      cx += (mx - cx) * 0.11
      cy += (my - cy) * 0.11
      const scale = isHover.current ? 1.45 : 1

      // Color — slow lerp so shift feels ambient, not reactive
      const c = curColor.current
      const t = curTarget.current
      c.r += (t.r - c.r) * 0.04
      c.g += (t.g - c.g) * 0.04
      c.b += (t.b - c.b) * 0.04
      const { r, g, b } = c

      if (cur) {
        cur.style.transform  = `translate(${cx - 50}px,${cy - 50}px) scale(${scale})`
        cur.style.background = `radial-gradient(circle, rgb(${r|0},${g|0},${b|0}) 0%, rgba(${r|0},${g|0},${b|0},0.3) 40%, transparent 70%)`
      }

      rafId = requestAnimationFrame(raf)
    })()

    const onOver = e => {
      if (!isHover.current && e.target.closest('a, button, [role="button"]')) {
        isHover.current = true
        if (cur) cur.style.opacity = '0.9'
      }
    }
    const onOut = e => {
      if (isHover.current && e.target.closest('a, button, [role="button"]')) {
        isHover.current = false
        if (cur) cur.style.opacity = '0.65'
      }
    }

    const sp = spRef.current
    const onScroll = () => {
      const s = document.documentElement
      if (sp) sp.style.width = (s.scrollTop / (s.scrollHeight - s.clientHeight) * 100) + '%'
    }

    document.addEventListener('mousemove', onMove,   { passive: true })
    document.addEventListener('mouseover',  onOver,   { passive: true })
    document.addEventListener('mouseout',   onOut,    { passive: true })
    window.addEventListener('scroll',       onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover',  onOver)
      document.removeEventListener('mouseout',   onOut)
      window.removeEventListener('scroll',       onScroll)
    }
  }, [])

  // ── Section color observer ────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            curTarget.current = { ...(SECTION_COLORS[e.target.id] ?? COPPER) }
          }
        })
      },
      { rootMargin: '-62px 0px -55% 0px', threshold: 0 }
    )

    const ids = ['about', 'projects', 'highlights', 'contact']
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })

    return () => obs.disconnect()
  }, [])

  return (
    <Router>
      <DotGrid />
      <div id="sp" ref={spRef} />
      <div id="cursor" ref={cursorRef} />

      <AnimatePresence>
        {preloaderVisible && <Preloader key="loader" />}
      </AnimatePresence>

      <AppShell />
    </Router>
  )
}

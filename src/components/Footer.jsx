import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'

const LINKS = [
  { icon: 'fa-brands fa-linkedin',  label: 'LinkedIn',     href: 'https://linkedin.com/in/shoryavardhaan' },
  { icon: 'fa-brands fa-github',    label: 'GitHub',       href: 'https://github.com/vassu-v' },
  { icon: 'fa-brands fa-x-twitter', label: 'X / Twitter',  href: 'https://x.com/shoryavardhaan' },
  { icon: 'fa-brands fa-instagram', label: 'Instagram',    href: 'https://www.instagram.com/let_shorya.be/' },
  { icon: 'fa-solid fa-envelope',   label: 'shoryavardhaans2@gmail.com', href: 'mailto:shoryavardhaans2@gmail.com' },
]

// ── Liquid heading ─────────────────────────────────────────────────────────────

function LiquidHeading({ scrollYProgress }) {
  const turbRef = useRef(null)
  const dispRef = useRef(null)
  const blurRef = useRef(null)

  useEffect(() => {
    let time = 0
    let rafId
    // Mutable targets driven by scroll
    let targetScale = 80
    let targetFreqBase = 0.038

    // Scroll drives the target values (how liquid vs resolved)
    const unsub = scrollYProgress.on('change', v => {
      const t = Math.max(0, Math.min(1, v / 0.72))
      targetScale    = (1 - t) * 80
      targetFreqBase = 0.006 + (1 - t) * 0.032
      blurRef.current?.setAttribute('stdDeviation', ((1 - t) * 7).toFixed(2))
      dispRef.current?.setAttribute('scale', targetScale.toFixed(1))
    })

    // RAF continuously animates the turbulence pattern — makes it flow
    const tick = () => {
      time += 0.007
      if (turbRef.current && targetScale > 0.5) {
        const fX = targetFreqBase + Math.sin(time * 0.8) * 0.006
        const fY = targetFreqBase * 0.55 + Math.cos(time * 0.6) * 0.003
        turbRef.current.setAttribute('baseFrequency', `${fX.toFixed(5)} ${fY.toFixed(5)}`)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      unsub()
      cancelAnimationFrame(rafId)
    }
  }, [scrollYProgress])

  return (
    <>
      {/* SVG filter — hidden, referenced by id */}
      <svg
        width="0" height="0"
        style={{ position: 'absolute', pointerEvents: 'none' }}
        aria-hidden
      >
        <defs>
          <filter id="lq-fluid" x="-30%" y="-40%" width="160%" height="180%">
            <feTurbulence
              ref={turbRef}
              type="turbulence"
              baseFrequency="0.038 0.021"
              numOctaves="5"
              seed="14"
              result="noise"
            />
            <feGaussianBlur
              ref={blurRef}
              in="SourceGraphic"
              stdDeviation="7"
              result="soft"
            />
            <feDisplacementMap
              ref={dispRef}
              in="soft"
              in2="noise"
              scale="80"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <h2 style={{
        fontSize: 'clamp(30px, 5.5vw, 74px)', fontWeight: 700,
        letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '14px',
        filter: 'url(#lq-fluid)',
        willChange: 'filter',
      }}>
        Let's build<br />
        <em style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic',
          fontWeight: 300, color: 'var(--text2)',
        }}>
          something that matters.
        </em>
      </h2>
    </>
  )
}

// ── Magnetic CTA ───────────────────────────────────────────────────────────────

function MagneticCTA() {
  const btnRef = useRef(null)
  const rawX   = useMotionValue(0)
  const rawY   = useMotionValue(0)
  const x      = useSpring(rawX, { stiffness: 180, damping: 18 })
  const y      = useSpring(rawY, { stiffness: 180, damping: 18 })

  const onMove = e => {
    const rect = btnRef.current.getBoundingClientRect()
    rawX.set((e.clientX - rect.left - rect.width  / 2) * 0.28)
    rawY.set((e.clientY - rect.top  - rect.height / 2) * 0.28)
  }
  const onLeave = () => { rawX.set(0); rawY.set(0) }

  return (
    <motion.a
      ref={btnRef}
      href="mailto:shoryavardhaans2@gmail.com"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        x, y,
        display: 'inline-flex', alignItems: 'center', gap: '14px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.76rem',
        fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#0a0a0a', background: 'var(--cu)',
        padding: '18px 40px', borderRadius: '6px', textDecoration: 'none',
        marginBottom: '52px',
        transition: 'background 0.22s, box-shadow 0.22s',
      }}
      whileHover={{ background: 'var(--go)', boxShadow: '0 14px 40px rgba(197,123,43,0.28)' }}
    >
      <i className="fa-solid fa-envelope" />
      get in touch
      <i className="fa-solid fa-arrow-right" />
    </motion.a>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────

export default function Footer() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'start 5%'] })
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0, 1])
  const y       = useTransform(scrollYProgress, [0, 0.45], [40, 0])

  return (
    <>
      {/* Ambient copper glow above footer */}
      <div style={{ height: '1px', position: 'relative', overflow: 'visible', zIndex: 1 }}>
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          width: '70%', height: '280px', top: '-140px',
          background: 'radial-gradient(ellipse, rgba(197,123,43,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      <footer
        id="contact"
        className="sec-section"
        ref={ref}
        style={{ padding: '72px var(--pad) 60px', position: 'relative', zIndex: 1 }}
      >
        <motion.div style={{ opacity, y }}>

          <LiquidHeading scrollYProgress={scrollYProgress} />

          <p style={{ fontSize: '0.87rem', color: 'var(--text3)', marginBottom: '40px' }}>
            Open for collaborations, projects, and conversations worth having.
          </p>

          <MagneticCTA />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '22px', marginBottom: '60px' }}>
            {LINKS.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem',
                  color: 'var(--text2)', textDecoration: 'none',
                  paddingBottom: '2px', borderBottom: '1px solid transparent',
                  letterSpacing: '0.04em', transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderBottomColor = 'var(--cu)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderBottomColor = 'transparent' }}
              >
                <i className={icon} />{label}
              </a>
            ))}
          </div>

          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)', opacity: 0.45 }}>
            © 2026 Shoryavardhaan Gupta &nbsp;·&nbsp; Kolkata, India
          </p>
        </motion.div>
      </footer>
    </>
  )
}

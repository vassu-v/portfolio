import { useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'

const LINKS = [
  { icon: 'fa-brands fa-linkedin',  label: 'LinkedIn',     href: 'https://linkedin.com/in/shoryavardhaan' },
  { icon: 'fa-brands fa-github',    label: 'GitHub',       href: 'https://github.com/vassu-v' },
  { icon: 'fa-brands fa-x-twitter', label: 'X / Twitter',  href: 'https://x.com/shoryavardhaan' },
  { icon: 'fa-brands fa-instagram', label: 'Instagram',    href: 'https://www.instagram.com/let_shorya.be/' },
  { icon: 'fa-solid fa-envelope',   label: 'shoryavardhaans2@gmail.com', href: 'mailto:shoryavardhaans2@gmail.com' },
]

function MagneticCTA() {
  const btnRef = useRef(null)
  const rawX   = useMotionValue(0)
  const rawY   = useMotionValue(0)
  const x      = useSpring(rawX, { stiffness: 180, damping: 18 })
  const y      = useSpring(rawY, { stiffness: 180, damping: 18 })

  const onMove = e => {
    const rect = btnRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    rawX.set((e.clientX - cx) * 0.28)
    rawY.set((e.clientY - cy) * 0.28)
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
        boxShadow: '0 0 0 rgba(197,123,43,0)',
        transition: 'background 0.22s, box-shadow 0.22s',
      }}
      whileHover={{
        background: 'var(--go)',
        boxShadow: '0 14px 40px rgba(197,123,43,0.28)',
      }}
    >
      <i className="fa-solid fa-envelope" />
      get in touch
      <i className="fa-solid fa-arrow-right" />
    </motion.a>
  )
}

export default function Footer() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'start 10%'] })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1])
  const y       = useTransform(scrollYProgress, [0, 0.6], [40, 0])

  return (
    <>
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
          <h2 style={{
            fontSize: 'clamp(30px, 5.5vw, 74px)', fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '14px',
          }}>
            Let's build<br />
            <em style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300, color: 'var(--text2)' }}>
              something that matters.
            </em>
          </h2>
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

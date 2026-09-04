import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { AGE, YEAR } from '../utils/meta'

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
  const h2Ref   = useRef(null)
  const inView  = useInView(h2Ref, { once: true, amount: 0.7 })

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      blurRef.current?.setAttribute('stdDeviation', '0')
      dispRef.current?.setAttribute('scale', '0')
      return
    }

    let time = 0
    let rafId
    let targetScale = 80
    let targetFreqBase = 0.038

    const unsub = scrollYProgress.on('change', v => {
      const t = Math.max(0, Math.min(1, v / 0.72))
      targetScale    = (1 - t) * 80
      targetFreqBase = 0.006 + (1 - t) * 0.032
      blurRef.current?.setAttribute('stdDeviation', ((1 - t) * 7).toFixed(2))
      dispRef.current?.setAttribute('scale', targetScale.toFixed(1))
    })

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
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden>
        <defs>
          <filter id="lq-fluid" x="-30%" y="-40%" width="160%" height="180%">
            <feTurbulence ref={turbRef} type="turbulence" baseFrequency="0.038 0.021" numOctaves="5" seed="14" result="noise" />
            <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="7" result="soft" />
            <feDisplacementMap ref={dispRef} in="soft" in2="noise" scale="80" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <h2
        ref={h2Ref}
        style={{
          fontSize: 'clamp(30px, 5.5vw, 74px)', fontWeight: 700,
          letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '14px',
          filter: 'url(#lq-fluid)',
          willChange: 'filter',
        }}
      >
        {/*
          "Let's build" sits inside an inline-block span so it becomes
          the containing block for the absolute highlight mark behind it.
          Both pass through the same lq-fluid filter on the h2, so they
          distort and resolve in perfect sync — no alignment math needed.
        */}
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.38 }}
            style={{
              position: 'absolute',
              inset: '-0.09em -0.14em',
              background: 'rgba(197,123,43,0.23)',
              borderRadius: '3px',
              transformOrigin: 'left center',
              zIndex: 0,
              // Tiny blur softens the mark edges slightly — like marker feathering
              filter: 'blur(1.2px)',
            }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>Let's build</span>
        </span>
        <br />
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

function MagneticCTA({ href, icon, label, secondary }) {
  return (
    <motion.a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '14px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.76rem',
        fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: secondary ? 'var(--cu)' : '#0a0a0a',
        background: secondary ? 'transparent' : 'var(--cu)',
        border: secondary ? '1px solid var(--cu-b)' : '1px solid transparent',
        padding: '18px 40px', borderRadius: '6px', textDecoration: 'none',
        transition: 'background 0.22s, box-shadow 0.22s, border-color 0.22s',
      }}
      whileHover={secondary
        ? { background: 'var(--cu-d)', borderColor: 'var(--cu)' }
        : { background: 'var(--go)', boxShadow: '0 14px 40px rgba(197,123,43,0.28)' }}
    >
      <i className={icon} />
      {label}
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
            Got something to build? I'm open for work. Let's make it happen.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '52px' }}>
            <MagneticCTA href="mailto:shoryavardhaans2@gmail.com" icon="fa-solid fa-envelope" label="get in touch" />
            <MagneticCTA href="https://cal.com/shoryavardhaan" icon="fa-solid fa-calendar-days" label="hop on a call" secondary />
          </div>

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
            © {YEAR} Shoryavardhaan Gupta &nbsp;·&nbsp; {AGE} y/o &nbsp;·&nbsp; Kolkata, India
          </p>
        </motion.div>
      </footer>
    </>
  )
}

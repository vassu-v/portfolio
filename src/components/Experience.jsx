import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, useVelocity } from 'framer-motion'
import { useMobile, PORTRAIT_QUERY } from '../hooks/useMobile'

const TABLET_LANDSCAPE_QUERY =
  '(min-width: 768px) and (max-width: 1023px) and (orientation: landscape)'

export const EXP = [
  {
    n: '01',
    org: 'Bits&Bytes',
    live: true,
    primaryRole: 'Kolkata Fork Lead',
    type: 'Community',
    period: 'Apr 2026 – Present',
    desc: 'Leading Bits&Bytes in Kolkata, a teen-led builder community running hackathons and shipping real projects. Bringing the same energy to Eastern India that the rest of the country already has.',
    skills: ['Leadership', 'Community Building', 'Events'],
    extra: null,
  },
  {
    n: '02',
    org: '4MQ.org',
    live: true,
    primaryRole: 'Youth Partner',
    type: 'Full-time · Equity',
    period: 'Apr 2026 – Present',
    desc: 'First Youth Partner. Own the Antigravity Workflow, the knowledge system powering how 4MQ synthesizes content. Co-authored episodes with Richard on money and behavior. I suggest what we build, then build it.',
    skills: ['Content Strategy', 'Financial Literacy', 'Systems'],
    extra: [
      { title: 'Consultant',   period: 'May 2026 – Present', type: 'Part-time' },
      { title: 'Guest Fellow', period: 'Jan – Apr 2026',     type: 'Part-time' },
    ],
  },
  {
    n: '03',
    org: 'Freelance',
    live: true,
    primaryRole: 'UI & Landing Page Design',
    type: 'Freelance',
    period: 'Mar 2026 – Present',
    desc: 'Building landing pages and UI systems for lead conversion. Brand positioning, conversion optimization, maintenance-based pricing.',
    skills: ['UI Design', 'Conversion', 'Brand Positioning'],
    cta: { label: 'Book a call', href: 'https://cal.com/shoryavardhaan/30min?overlayCalendar=true' },
    hire: true,
    extra: null,
  },
  {
    n: '04',
    org: 'Beyond Rote',
    live: false,
    primaryRole: 'Research & Outreach Lead',
    type: 'Internship',
    period: 'Jan – Apr 2026',
    desc: 'Coordinated faculty engagement and research submissions for the Inquiry Series. Fielded 50+ research questions from 120+ students alongside researcher Chris Barry. Screened submissions, built researcher networks.',
    skills: ['Research', 'Outreach', 'Community'],
    extra: null,
  },
  {
    n: '05',
    org: 'Utsavy',
    live: false,
    primaryRole: 'Experience Designer, UI/UX',
    type: 'Internship',
    period: 'Jun – Jul 2025',
    desc: 'Designed UX workflows and interface templates for an event management platform. Custom designs increased inquiry submissions by 20%. Designed AI prompts and onboarding flows. Trained incoming interns on the design system.',
    skills: ['UX Design', 'AI Prompting', 'Mentoring'],
    extra: null,
  },
]

const TOTAL = EXP.length

function LiveDot() {
  return (
    <span style={{
      display: 'inline-block', width: '5px', height: '5px',
      borderRadius: '50%', background: 'var(--cu)', flexShrink: 0,
      animation: 'live 2s ease-in-out infinite',
    }} />
  )
}

function ProgressDots({ scrollYProgress }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    return scrollYProgress.on('change', v => {
      setActive(Math.min(TOTAL - 1, Math.round(v * (TOTAL - 1))))
    })
  }, [scrollYProgress])

  return (
    <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      {EXP.map((exp, i) => (
        <span key={i} style={{
          display: 'inline-block',
          width: i === active ? '18px' : '5px',
          height: '5px',
          borderRadius: '100px',
          background: i === active ? 'var(--cu)' : 'rgba(255,255,255,0.15)',
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      ))}
    </div>
  )
}

function Panel({ exp }) {
  const { n, org, live, primaryRole, type, period, desc, skills, extra, cta, hire } = exp

  return (
    <div style={{
      width: '100vw', height: '100vh', flexShrink: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '100px var(--pad) 80px',
      position: 'relative', overflow: 'hidden',
      borderRight: '1px solid var(--border)',
    }}>
      <div aria-hidden style={{
        position: 'absolute', right: '-0.04em', bottom: '-0.15em',
        fontFamily: 'Instrument Serif, serif',
        fontSize: 'clamp(180px, 28vw, 360px)',
        fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em',
        color: 'var(--text)', opacity: 0.035,
        userSelect: 'none', pointerEvents: 'none',
      }}>
        {n}
      </div>

      <div style={{ maxWidth: '620px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.2em', color: 'var(--text3)' }}>
            {n} / {String(TOTAL).padStart(2, '0')}
          </div>
          {hire && cta && (
            <a
              href={cta.href}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--cu)', background: 'var(--cu-d)',
                border: '1px solid var(--cu-b)',
                padding: '4px 12px', borderRadius: '100px',
                textDecoration: 'none',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(197,123,43,0.18)'; e.currentTarget.style.borderColor = 'var(--cu)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--cu-d)'; e.currentTarget.style.borderColor = 'var(--cu-b)' }}
            >
              ✦ Looking to hire?
            </a>
          )}
        </div>

        <h2 style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(3rem, 6.5vw, 5.5rem)',
          lineHeight: 1.0, letterSpacing: '-0.025em',
          color: 'var(--text)', marginBottom: '20px',
        }}>
          {org}
        </h2>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
          {live ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              letterSpacing: '0.08em', color: 'var(--cu)',
              background: 'var(--cu-d)', border: '1px solid var(--cu-b)',
              padding: '3px 10px', borderRadius: '100px',
            }}>
              <LiveDot /> Active
            </span>
          ) : (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              letterSpacing: '0.08em', color: 'var(--text3)',
              border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '100px',
            }}>
              Concluded
            </span>
          )}
          {extra && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              letterSpacing: '0.06em', color: 'var(--text3)',
              border: '1px solid var(--border)', padding: '3px 10px', borderRadius: '100px',
            }}>
              {extra.length + 1} roles
            </span>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '20px', marginBottom: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.97rem', fontWeight: 600, color: 'var(--text)' }}>{primaryRole}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: live ? 'var(--cu)' : 'var(--text3)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            {period}
          </span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '16px' }}>
          {type}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.88, marginBottom: '20px', maxWidth: '520px' }}>
          {desc}
        </p>

        {extra && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {extra.map(r => (
              <div key={r.title} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '5px 12px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.07em', color: 'var(--text2)', marginBottom: '2px' }}>{r.title}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', letterSpacing: '0.05em', color: 'var(--text3)' }}>{r.period} · {r.type}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {skills.map(s => (
            <span key={s} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              letterSpacing: '0.08em', color: 'var(--text3)',
              border: '1px solid var(--border)', borderRadius: '3px', padding: '2px 8px',
            }}>
              {s}
            </span>
          ))}
        </div>

        {cta && (
          <a
            href={cta.href}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#0a0a0a', background: 'var(--cu)',
              padding: '12px 24px', borderRadius: '6px',
              textDecoration: 'none', marginTop: '24px',
              border: '1px solid transparent',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--go)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(197,123,43,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--cu)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <i className="fa-solid fa-calendar-days" />
            {cta.label}
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.55rem' }} />
          </a>
        )}
      </div>
    </div>
  )
}

// ── Mobile vertical card ──────────────────────────────────────────────────────

function MobileCard({ exp }) {
  const cardRef = useRef(null)
  const { n, org, live, primaryRole, type, period, desc, skills, extra, cta, hire } = exp

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start 88%', 'start 25%'],
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y       = useTransform(scrollYProgress, [0, 1], [28, 0])

  return (
    <motion.div
      ref={cardRef}
      style={{
        opacity, y,
        padding: '36px var(--pad)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
        <h3 style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(2rem, 9vw, 3rem)',
          lineHeight: 1.0, letterSpacing: '-0.02em', color: 'var(--text)',
        }}>
          {org}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, paddingTop: '6px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.15em', color: 'var(--text3)' }}>
            {n}
          </span>
          {hire && cta && (
            <a
              href={cta.href}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--cu)', background: 'var(--cu-d)',
                border: '1px solid var(--cu-b)',
                padding: '3px 9px', borderRadius: '100px',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              ✦ Hire me
            </a>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {live ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            letterSpacing: '0.08em', color: 'var(--cu)',
            background: 'var(--cu-d)', border: '1px solid var(--cu-b)',
            padding: '3px 9px', borderRadius: '100px',
          }}>
            <LiveDot /> Active
          </span>
        ) : (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            letterSpacing: '0.08em', color: 'var(--text3)',
            border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '100px',
          }}>
            Concluded
          </span>
        )}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
          letterSpacing: '0.05em', color: 'var(--text3)',
        }}>
          {primaryRole} · {type}
        </span>
      </div>

      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '14px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{primaryRole}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: live ? 'var(--cu)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
          {period}
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.8, marginBottom: '14px' }}>
        {desc}
      </p>

      {extra && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {extra.map(r => (
            <div key={r.title} style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 10px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.07em', color: 'var(--text2)', marginBottom: '2px' }}>{r.title}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem', color: 'var(--text3)' }}>{r.period} · {r.type}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {skills.map(s => (
          <span key={s} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            letterSpacing: '0.08em', color: 'var(--text3)',
            border: '1px solid var(--border)', borderRadius: '3px', padding: '2px 7px',
          }}>
            {s}
          </span>
        ))}
      </div>

      {cta && (
        <a
          href={cta.href}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '9px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#0a0a0a', background: 'var(--cu)',
            padding: '10px 20px', borderRadius: '6px',
            textDecoration: 'none', marginTop: '18px',
            border: '1px solid transparent',
          }}
        >
          <i className="fa-solid fa-calendar-days" />
          {cta.label}
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.52rem' }} />
        </a>
      )}
    </motion.div>
  )
}

// ── Tablet arrow navigation ───────────────────────────────────────────────────

function TabletDots({ active }) {
  return (
    <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
      {EXP.map((_, i) => (
        <span key={i} style={{
          display: 'inline-block',
          width: i === active ? '18px' : '5px', height: '5px',
          borderRadius: '100px',
          background: i === active ? 'var(--cu)' : 'rgba(255,255,255,0.15)',
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      ))}
    </div>
  )
}

function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none', border: '1px solid var(--border2)',
        borderRadius: '50%', width: '38px', height: '38px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.2 : 1,
        color: 'var(--text2)',
        transition: 'opacity 0.2s, border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--cu)'; e.currentTarget.style.color = 'var(--cu)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
    >
      {dir === 'prev'
        ? <svg width="13" height="9" viewBox="0 0 22 9" fill="none"><path d="M21 4.5H1M6 1L1 4.5L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="13" height="9" viewBox="0 0 22 9" fill="none"><path d="M1 4.5h20M16 1l5 3.5-5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
    </button>
  )
}

function TabletExperience() {
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <div id="experience" style={{ height: '100svh', position: 'relative', overflow: 'hidden' }}>

      <div style={{
        position: 'absolute', top: '28px', left: 'var(--pad)',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--text3)', zIndex: 10, pointerEvents: 'none',
      }}>
        Experience
      </div>

      <motion.div
        animate={{ x: `${-activeIdx * 100}vw` }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        style={{ display: 'flex', width: `${TOTAL * 100}vw`, height: '100%' }}
      >
        {EXP.map(exp => <Panel key={exp.n} exp={exp} />)}
      </motion.div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px var(--pad)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '16px',
        background: 'rgba(9,9,9,0.7)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        zIndex: 10,
      }}>
        <ArrowBtn dir="prev" onClick={() => setActiveIdx(i => i - 1)} disabled={activeIdx === 0} />
        <div style={{ flex: 1 }}>
          <TabletDots active={activeIdx} />
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          letterSpacing: '0.1em', color: 'var(--text3)',
        }}>
          {EXP[activeIdx].n} / {String(TOTAL).padStart(2, '0')}
        </span>
        <ArrowBtn dir="next" onClick={() => setActiveIdx(i => i + 1)} disabled={activeIdx === TOTAL - 1} />
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function Experience() {
  const containerRef      = useRef(null)
  const isMobile          = useMobile(PORTRAIT_QUERY)
  const isTabletLandscape = useMobile(TABLET_LANDSCAPE_QUERY)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const snapProgress = useMotionValue(0)
  useEffect(() => {
    const step = 1 / (TOTAL - 1)
    snapProgress.set(Math.round(scrollYProgress.get() / step) * step)
    return scrollYProgress.on('change', v => {
      const snapped = Math.round(v / step) * step
      snapProgress.set(snapped)
    })
  }, [scrollYProgress, snapProgress])
  const springProgress = useSpring(snapProgress, { stiffness: 280, damping: 32, mass: 0.8 })
  const x        = useTransform(springProgress, [0, 1], ['0vw', `${-(TOTAL - 1) * 100}vw`])
  const barWidth = useTransform(springProgress, [0, 1], ['0%', '100%'])

  const velocity = useVelocity(springProgress)
  const tilt = useTransform(velocity, [-0.8, 0, 0.8], [6, 0, -6])
  const springTilt = useSpring(tilt, { stiffness: 200, damping: 25 })

  // ── Portrait (phone + portrait tablet): stacked cards ─────────────────────
  if (isMobile) {
    return (
      <div id="experience" style={{ paddingBottom: '8px' }}>
        <div style={{
          padding: '48px var(--pad) 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
            letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text3)',
          }}>
            Experience
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
            letterSpacing: '0.08em', color: 'var(--text3)',
          }}>
            {String(TOTAL).padStart(2, '0')} roles
          </span>
        </div>
        {EXP.map(exp => <MobileCard key={exp.n} exp={exp} />)}
      </div>
    )
  }

  // ── Landscape tablet: arrow navigation ────────────────────────────────────
  if (isTabletLandscape) return <TabletExperience />

  // ── Desktop: horizontal sticky scroll ─────────────────────────────────────
  return (
    <div id="experience" ref={containerRef} style={{ height: `${TOTAL * 100}vh`, position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: '1200px' }}>
        <div style={{
          position: 'absolute', top: '28px', left: 'var(--pad)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--text3)', zIndex: 10, pointerEvents: 'none',
        }}>
          Experience
        </div>

        <div style={{
          position: 'absolute', top: '26px', right: 'var(--pad)',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          letterSpacing: '0.1em', color: 'var(--text3)',
          display: 'flex', alignItems: 'center', gap: '8px',
          zIndex: 10, pointerEvents: 'none',
        }}>
          scroll to explore
          <svg width="22" height="9" viewBox="0 0 22 9" fill="none">
            <path d="M1 4.5h20M16 1l5 3.5-5 3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <motion.div style={{
          x,
          rotateY: springTilt,
          display: 'flex',
          width: `${TOTAL * 100}vw`,
          height: '100%',
          willChange: 'transform',
        }}>
          {EXP.map(exp => <Panel key={exp.n} exp={exp} />)}
        </motion.div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px var(--pad)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '18px',
          background: 'rgba(9,9,9,0.7)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10,
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', position: 'relative' }}>
            <motion.div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--cu)', width: barWidth }} />
          </div>
          <ProgressDots scrollYProgress={springProgress} />
        </div>
      </div>
    </div>
  )
}

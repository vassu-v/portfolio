import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRoute } from '../router'
import { PROJECTS, getProject } from '../data/projects'
import { Link } from '../router'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
})

function BackButton() {
  const { navigate } = useRoute()
  return (
    <button
      onClick={() => navigate('/')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text3)', background: 'none', border: 'none',
        cursor: 'none', padding: 0,
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--cu)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M5 1L1 5M1 5L5 9M1 5H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      back
    </button>
  )
}

function ImpactCard({ val, label }) {
  return (
    <div style={{
      padding: '20px 24px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
    }}>
      <div style={{
        fontFamily: 'Instrument Serif, serif',
        fontSize: '2rem', fontWeight: 700,
        letterSpacing: '-0.03em', lineHeight: 1,
        color: 'var(--cu)', marginBottom: '6px',
      }}>
        {val}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text3)',
      }}>
        {label}
      </div>
    </div>
  )
}

function HowStep({ step, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'start 40%'] })
  const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1])
  const x       = useTransform(scrollYProgress, [0, 0.7], [-16, 0])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, x, display: 'flex', gap: '20px', alignItems: 'start', paddingBottom: '28px', borderBottom: '1px solid var(--border)' }}
    >
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
        color: 'var(--cu)', letterSpacing: '0.1em', paddingTop: '4px',
        flexShrink: 0, minWidth: '28px',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
          {step.label}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.78 }}>
          {step.text}
        </p>
      </div>
    </motion.div>
  )
}

function RelatedProjects({ currentSlug, navigate }) {
  const others = PROJECTS.filter(p => p.slug !== currentSlug).slice(0, 3)
  return (
    <div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--text3)', marginBottom: '20px',
      }}>
        More projects
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {others.map((p, i) => (
          <button
            key={p.slug}
            onClick={() => { navigate(`/project/${p.slug}`); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '16px', padding: '16px 0',
              borderTop: i === 0 ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border)',
              background: 'none', border: 'none', borderTop: '1px solid var(--border)',
              cursor: 'none', textAlign: 'left', width: '100%',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.013)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--text3)' }}>{p.n}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text2)' }}>{p.name}</span>
            </div>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.72rem', color: 'var(--text3)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ProjectPage({ slug }) {
  const { navigate } = useRoute()
  const project = getProject(slug)

  useEffect(() => {
    if (project) document.title = `${project.name} — Shoryavardhaan`
    return () => { document.title = 'Shoryavardhaan Gupta' }
  }, [project])

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', zIndex: 1, position: 'relative' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>PROJECT NOT FOUND</p>
        <BackButton />
      </div>
    )
  }

  const { n, name, tagline, tags, problem, solution, how, impact, github, live, liveLabel, period, featured } = project

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ── Nav bar ── */}
      <div style={{
        position: 'fixed', inset: '0 0 auto 0', height: '62px', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--pad)',
        background: 'rgba(9,9,9,0.9)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <BackButton />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          color: 'var(--text3)', letterSpacing: '0.1em',
        }}>
          {n} / {PROJECTS.length.toString().padStart(2, '0')}
        </span>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: '130px var(--pad) 70px', borderBottom: '1px solid var(--border)' }}>

        {/* ghost number */}
        <motion.div
          {...fade(0)}
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 'clamp(120px, 20vw, 260px)',
            fontWeight: 700, lineHeight: 0.85,
            letterSpacing: '-0.04em',
            color: 'var(--text)', opacity: 0.03,
            userSelect: 'none', pointerEvents: 'none',
            marginBottom: '-0.18em',
          }}
        >
          {n}
        </motion.div>

        <motion.div {...fade(0.05)} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--cu)' }}>
            {period}
          </span>
          {featured && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
              color: 'var(--cu)', border: '1px solid var(--cu-b)',
              padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.08em',
            }}>
              featured
            </span>
          )}
        </motion.div>

        <motion.h1 {...fade(0.1)} style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(2.6rem, 6vw, 6rem)',
          letterSpacing: '-0.02em', lineHeight: 1.05,
          color: 'var(--text)', marginBottom: '20px',
        }}>
          {name}
        </motion.h1>

        <motion.p {...fade(0.18)} style={{
          fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
          color: 'var(--text2)', lineHeight: 1.6,
          maxWidth: '600px', marginBottom: '32px',
        }}>
          {tagline}
        </motion.p>

        {/* Tags */}
        <motion.div {...fade(0.24)} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '36px' }}>
          {tags.map(t => (
            <span key={t} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              padding: '5px 12px',
              border: `1px solid ${featured ? 'var(--cu-b)' : 'var(--border)'}`,
              borderRadius: '3px',
              color: featured ? 'var(--cu)' : 'var(--text3)',
              letterSpacing: '0.06em',
            }}>
              {t}
            </span>
          ))}
        </motion.div>

        {/* Links */}
        <motion.div {...fade(0.30)} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
                letterSpacing: '0.06em', color: '#0a0a0a',
                background: 'var(--cu)', padding: '12px 26px', borderRadius: '5px',
                textDecoration: 'none', transition: 'background 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--go)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--cu)'; e.currentTarget.style.transform = 'none' }}
            >
              <i className="fa-brands fa-github" /> View on GitHub
            </a>
          )}
          {live && (
            <a
              href={live}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
                letterSpacing: '0.06em', color: 'var(--text2)',
                border: '1px solid var(--border)', padding: '12px 26px', borderRadius: '5px',
                textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <i className="fa-solid fa-arrow-up-right" /> {liveLabel ?? 'Live'}
            </a>
          )}
        </motion.div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '0', alignItems: 'start' }}>

        {/* Left: narrative */}
        <div style={{ padding: '64px var(--pad)', borderRight: '1px solid var(--border)' }}>

          {/* Problem */}
          <div style={{ marginBottom: '64px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text3)', marginBottom: '20px',
            }}>
              The Problem
            </div>
            {problem.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '0.92rem', color: 'var(--text2)', lineHeight: 1.92, marginBottom: '16px' }}>
                {para.trim()}
              </p>
            ))}
          </div>

          {/* Solution */}
          <div style={{ marginBottom: '64px' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text3)', marginBottom: '20px',
            }}>
              What I Built
            </div>
            {solution.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontSize: '0.92rem', color: 'var(--text2)', lineHeight: 1.92, marginBottom: '16px' }}>
                {para.trim()}
              </p>
            ))}
          </div>

          {/* How it works */}
          {how?.length > 0 && (
            <div style={{ marginBottom: '64px' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text3)', marginBottom: '28px',
              }}>
                How it works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {how.map((step, i) => <HowStep key={i} step={step} index={i} />)}
              </div>
            </div>
          )}

          {/* Related */}
          <RelatedProjects currentSlug={slug} navigate={navigate} />
        </div>

        {/* Right: stats sidebar (sticky) */}
        <div style={{ position: 'sticky', top: '80px', padding: '64px 40px' }}>

          {/* Impact */}
          {impact?.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text3)', marginBottom: '16px',
              }}>
                Impact
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {impact.map((item, i) => <ImpactCard key={i} {...item} />)}
              </div>
            </div>
          )}

          {/* GitHub link card */}
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--border)',
                borderRadius: '8px', textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.045)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-brands fa-github" style={{ color: 'var(--text2)', fontSize: '0.9rem' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'var(--text2)', letterSpacing: '0.04em' }}>
                  {github.replace('https://github.com/', '')}
                </span>
              </div>
              <i className="fa-solid fa-arrow-up-right" style={{ color: 'var(--text3)', fontSize: '0.65rem' }} />
            </a>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '48px var(--pad)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        <a
          href="mailto:shoryavardhaans2@gmail.com"
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
            color: 'var(--text3)', textDecoration: 'none', letterSpacing: '0.06em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cu)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          shoryavardhaans2@gmail.com →
        </a>
      </div>
    </div>
  )
}

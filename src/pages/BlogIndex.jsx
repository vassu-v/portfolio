import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { POSTS, LAST_UPDATED } from '../data/blog'
import { YEAR } from '../utils/meta'
import { useRoute } from '../router'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1], delay },
})

// ── Back button ────────────────────────────────────────────────────────────────

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
        cursor: 'none', padding: 0, transition: 'color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--cu)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M5 1L1 5M1 5L5 9M1 5H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      portfolio
    </button>
  )
}

// ── Featured post — full-width with image + overlay ────────────────────────────

function FeaturedPost({ post }) {
  const { navigate } = useRoute()
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  return (
    <motion.div
      {...fade(0.28)}
      ref={ref}
      onClick={() => navigate(`/blog/${post.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        height: 'clamp(340px, 52vh, 580px)',
        overflow: 'hidden',
        borderRadius: '8px',
        cursor: 'none',
        marginBottom: '20px',
      }}
    >
      {/* Parallax image */}
      <motion.img
        src={post.hero}
        alt={post.title}
        loading="lazy"
        animate={{ scale: hovered ? 1.04 : 1 }}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '130%',
          objectFit: 'cover',
          y: parallaxY,
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(9,9,9,0.92) 0%, rgba(9,9,9,0.45) 45%, rgba(9,9,9,0.1) 100%)',
      }} />

      {/* Top-right badges */}
      <div style={{ position: 'absolute', top: '20px', right: '24px', display: 'flex', gap: '6px' }}>
        {post.personal === 'best' && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            color: '#0a0a0a', background: 'var(--cu)',
            padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.1em',
          }}>
            my best
          </span>
        )}
        {post.personal === 'learned' && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            color: 'var(--cu)', border: '1px solid var(--cu-b)',
            padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.1em',
            background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(8px)',
          }}>
            genuinely learned
          </span>
        )}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
          color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)',
          padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.1em',
          background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(8px)',
        }}>
          Featured
        </span>
      </div>

      {/* Bottom content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(24px, 3.5vw, 48px)',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.53rem',
          color: 'var(--cu)', letterSpacing: '0.16em', textTransform: 'uppercase',
          marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span>{post.n}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--cu)' }} />
          <span>{post.category}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--cu)' }} />
          <span>{post.date}</span>
        </div>

        <h2 style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(1.8rem, 3.8vw, 3.8rem)',
          letterSpacing: '-0.025em', lineHeight: 1.07,
          color: '#fff', marginBottom: '12px',
          maxWidth: '680px',
        }}>
          {post.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: '0.86rem', color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, maxWidth: '480px',
          }}>
            {post.subtitle}
          </p>
          <motion.div
            animate={{ x: hovered ? 6 : 0, color: hovered ? 'var(--cu)' : 'rgba(255,255,255,0.4)' }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
              letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
            }}
          >
            Read
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.55rem' }} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Small card ─────────────────────────────────────────────────────────────────

function SmallCard({ post, delay }) {
  const { navigate } = useRoute()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      {...fade(delay)}
      onClick={() => navigate(`/blog/${post.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'none' }}
    >
      {/* Image */}
      <div style={{
        overflow: 'hidden', borderRadius: '6px',
        aspectRatio: '3 / 2', marginBottom: '18px',
        background: 'var(--border)', position: 'relative',
      }}>
        {post.hero && (
          <motion.img
            src={post.hero}
            alt={post.title}
            loading="lazy"
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Hover overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(9,9,9,0.4) 0%, transparent 60%)',
          }}
        />
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '5px' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            color: 'rgba(255,255,255,0.5)', background: 'rgba(9,9,9,0.5)',
            backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: '100px',
            letterSpacing: '0.06em',
          }}>
            {post.n}
          </span>
          {post.personal === 'best' && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
              color: '#0a0a0a', background: 'var(--cu)',
              padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.06em',
            }}>
              my best
            </span>
          )}
          {post.personal === 'learned' && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
              color: 'var(--cu)', border: '1px solid var(--cu-b)',
              padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.06em',
              background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(6px)',
            }}>
              genuinely learned
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
        color: 'var(--cu)', letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: '10px',
      }}>
        {post.category} · {post.date}
      </div>

      {/* Title */}
      <motion.h3
        animate={{ color: hovered ? 'var(--text)' : 'var(--text2)' }}
        transition={{ duration: 0.18 }}
        style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px',
        }}
      >
        {post.title}
      </motion.h3>

      {/* Excerpt */}
      <p style={{
        fontSize: '0.79rem', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '16px',
      }}>
        {post.subtitle}
      </p>

      {/* Read time + arrow */}
      <motion.div
        animate={{ x: hovered ? 4 : 0, color: hovered ? 'var(--cu)' : 'var(--text3)' }}
        transition={{ duration: 0.18 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}
      >
        {post.readTime}
        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.5rem' }} />
      </motion.div>
    </motion.div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BlogIndex() {
  useEffect(() => {
    document.title = 'Writing — Shoryavardhaan'
    return () => { document.title = 'Shoryavardhaan Gupta' }
  }, [])

  const [featured, ...rest] = POSTS

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ── Fixed nav ── */}
      <div style={{
        position: 'fixed', inset: '0 0 auto 0', height: '62px', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--pad)',
        background: 'rgba(9,9,9,0.9)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem',
          fontWeight: 600, color: 'var(--cu)', letterSpacing: '0.12em',
        }}>
          SG
        </span>
        <BackButton />
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: 'clamp(90px, 10vh, 120px) var(--pad) 48px' }}>

        {/* Label row */}
        <motion.div
          {...fade(0)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
            letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text3)',
          }}>
            Writing
          </span>

          {/* Last updated — auto-derives from newest post (keep POSTS newest-first) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              color: 'var(--text3)', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              <span style={{
                display: 'inline-block', width: '5px', height: '5px',
                borderRadius: '50%', background: 'var(--cu)', opacity: 0.8,
              }} />
              last log · {LAST_UPDATED}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
              color: 'var(--text3)', letterSpacing: '0.08em',
            }}>
              {String(POSTS.length).padStart(2, '0')} pieces
            </span>
          </div>
        </motion.div>

        {/* Horizontal rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          style={{
            height: '1px',
            background: 'linear-gradient(to right, var(--border), var(--border) 70%, transparent)',
            transformOrigin: 'left', marginBottom: '28px',
          }}
        />

        {/* Big heading */}
        <motion.h1
          {...fade(0.12)}
          style={{
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(3.5rem, 9vw, 9rem)',
            letterSpacing: '-0.035em', lineHeight: 0.95,
            color: 'var(--text)', marginBottom: '20px',
          }}
        >
          The Log.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          {...fade(0.2)}
          style={{
            fontSize: '0.88rem', color: 'var(--text3)',
            lineHeight: 1.75, maxWidth: '400px', marginBottom: '24px',
          }}
        >
          Thoughts on building, shipping, and learning in public — from Kolkata.
        </motion.p>

        {/* Personal curation note */}
        <motion.div
          {...fade(0.28)}
          style={{
            display: 'inline-flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 18px',
            border: '1px solid var(--border)',
            borderLeft: '2px solid var(--cu)',
            borderRadius: '0 4px 4px 0',
            background: 'rgba(197,123,43,0.04)',
            marginBottom: '48px',
            maxWidth: '420px',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--cu)', marginTop: '1px', flexShrink: 0 }}>✦</span>
          <p style={{
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.6,
          }}>
            These aren't posts. They're things I actually had something to say about — stuff I'd still stand behind.
          </p>
        </motion.div>
      </div>

      {/* ── Posts ── */}
      <div style={{ padding: '0 var(--pad) 80px' }}>

        {/* Featured */}
        <FeaturedPost post={featured} />

        {/* Rest — 2-column grid */}
        {rest.length > 0 && (
          <div className="bi-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}>
            {rest.map((post, i) => (
              <SmallCard key={post.slug} post={post} delay={0.32 + i * 0.08} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer strip ── */}
      <div style={{
        padding: '28px var(--pad)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BackButton />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          color: 'var(--text3)', letterSpacing: '0.06em',
        }}>
          Kolkata, India · {YEAR}
        </span>
      </div>

    </div>
  )
}

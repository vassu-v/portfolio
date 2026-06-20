import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRoute } from '../router'
import { POSTS, getPost } from '../data/blog'

// ── Scroll-brightening paragraph (same mechanic as About) ─────────────────────

function ReadingPara({ children, index }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 78%', 'start 44%'] })
  const color = useTransform(scrollYProgress, [0, 1], ['#4e4e4e', '#d4d4d4'])

  return (
    <div style={{ display: 'flex', gap: '28px', marginBottom: '26px', alignItems: 'start' }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem',
        color: 'var(--text3)', letterSpacing: '0.1em',
        paddingTop: '6px', minWidth: '20px', flexShrink: 0,
        userSelect: 'none',
      }}>
        {String(index).padStart(2, '0')}
      </span>
      <motion.p ref={ref} style={{
        fontSize: '0.93rem', lineHeight: 1.92, color,
        flex: 1,
      }}>
        {children}
      </motion.p>
    </div>
  )
}

// ── Pull quote ─────────────────────────────────────────────────────────────────

function PullQuote({ text }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="bp-pullquote"
      style={{
        margin: '52px 0 52px -28px',
        paddingLeft: '28px',
        borderLeft: '2px solid var(--cu)',
        background: 'rgba(197,123,43,0.04)',
        borderRadius: '0 8px 8px 0',
        padding: '24px 28px',
      }}
    >
      <p style={{
        fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
        fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)',
        color: 'var(--text)', lineHeight: 1.4, letterSpacing: '-0.01em',
      }}>
        "{text}"
      </p>
    </motion.div>
  )
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHead({ text }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginTop: '56px', marginBottom: '24px' }}
    >
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
        letterSpacing: '0.18em', color: 'var(--cu)', marginBottom: '8px',
      }}>
        //
      </div>
      <h3 style={{
        fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
        fontSize: 'clamp(1.3rem, 2.4vw, 1.9rem)',
        letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--text)',
      }}>
        {text}
      </h3>
    </motion.div>
  )
}

// ── Content renderer ───────────────────────────────────────────────────────────

function renderContent(blocks) {
  let paraIndex = 0
  return blocks.map((block, i) => {
    if (block.type === 'paragraph') {
      paraIndex++
      return <ReadingPara key={i} index={paraIndex}>{block.text}</ReadingPara>
    }
    if (block.type === 'pullquote') return <PullQuote key={i} text={block.text} />
    if (block.type === 'heading')   return <SectionHead key={i} text={block.text} />
    if (block.type === 'divider')   return (
      <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '48px 0' }}>
        {[0,1,2].map(d => <span key={d} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--cu)', opacity: 0.5 }} />)}
      </div>
    )
    return null
  })
}

// ── Back button ────────────────────────────────────────────────────────────────

function BackButton() {
  const { navigate } = useRoute()
  return (
    <button
      onClick={() => navigate('/blog')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--text3)', background: 'none', border: 'none',
        cursor: 'none', padding: 0, transition: 'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--cu)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M5 1L1 5M1 5L5 9M1 5H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      writing
    </button>
  )
}

// ── Continue reading ───────────────────────────────────────────────────────────

function ContinueReading({ url, platform }) {
  if (!url) return null
  return (
    <div className="bp-continue" style={{
      margin: '56px 0',
      padding: '28px 32px',
      border: '1px solid var(--cu-b)',
      borderRadius: '6px',
      background: 'rgba(197,123,43,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
    }}>
      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--text3)', marginBottom: '6px',
        }}>
          This is a summary
        </div>
        <p style={{
          fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.55,
        }}>
          The full piece lives on <span style={{ color: 'var(--cu)' }}>{platform}</span>. Read it there if you want the whole thing.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '9px', flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#0a0a0a', background: 'var(--cu)',
          padding: '12px 22px', borderRadius: '4px', textDecoration: 'none',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--go)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--cu)' }}
      >
        Continue on {platform}
        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.55rem' }} />
      </a>
    </div>
  )
}

// ── More posts ─────────────────────────────────────────────────────────────────

function MorePosts({ currentSlug }) {
  const { navigate } = useRoute()
  const others = POSTS.filter(p => p.slug !== currentSlug).slice(0, 2)

  return (
    <div style={{ marginTop: '80px' }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--text3)', marginBottom: '20px',
      }}>
        More from the log
      </div>
      {others.map((p, i) => (
        <button
          key={p.slug}
          onClick={() => navigate(`/blog/${p.slug}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', padding: '18px 0', width: '100%',
            borderTop: '1px solid var(--border)',
            borderBottom: i === others.length - 1 ? '1px solid var(--border)' : 'none',
            background: 'none', border: 'none',
            borderTop: '1px solid var(--border)',
            cursor: 'none', textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.013)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: 'var(--text3)' }}>{p.n}</span>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: 'var(--cu)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>{p.category}</div>
              <span style={{ fontSize: '0.9rem', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300, color: 'var(--text2)' }}>{p.title}</span>
            </div>
          </div>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.72rem', color: 'var(--text3)', flexShrink: 0 }} />
        </button>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
})

export default function BlogPost({ slug }) {
  const post = getPost(slug)
  const heroRef = useRef(null)
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(heroScroll, [0, 1], ['0%', '30%'])

  useEffect(() => {
    if (post) document.title = `${post.title} — Shoryavardhaan`
    return () => { document.title = 'Shoryavardhaan Gupta' }
  }, [post])

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>POST NOT FOUND</p>
        <BackButton />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ── Fixed nav bar ── */}
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
          {post.n} / {String(POSTS.length).padStart(2, '0')}
        </span>
      </div>

      {/* ── Hero / title area ── */}
      <div style={{ padding: '100px var(--pad) 0', position: 'relative', overflow: 'hidden' }}>

        {/* Ghost category — huge background text */}
        <div aria-hidden style={{
          position: 'absolute', right: '-0.05em', top: '60px',
          fontFamily: 'Instrument Serif, serif',
          fontSize: 'clamp(100px, 18vw, 220px)',
          fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em',
          color: 'var(--text)', opacity: 0.03,
          userSelect: 'none', pointerEvents: 'none',
          textTransform: 'uppercase',
        }}>
          {post.category}
        </div>

        {/* Category + meta */}
        <motion.div {...fade(0)} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
            letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--cu)',
          }}>
            {post.category}
          </span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text3)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>
            {post.date}
          </span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text3)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: 'var(--text3)', letterSpacing: '0.06em' }}>
            {post.readTime}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 {...fade(0.08)} style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(2.4rem, 5.5vw, 5.5rem)',
          letterSpacing: '-0.025em', lineHeight: 1.06,
          color: 'var(--text)', marginBottom: '18px',
          maxWidth: '820px', position: 'relative',
        }}>
          {post.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p {...fade(0.16)} style={{
          fontSize: 'clamp(0.88rem, 1.3vw, 1.05rem)',
          color: 'var(--text2)', lineHeight: 1.65,
          maxWidth: '560px', marginBottom: '48px',
        }}>
          {post.subtitle}
        </motion.p>

        {/* Hero image — parallax */}
        {post.hero && (
          <motion.div
            ref={heroRef}
            {...fade(0.22)}
            style={{
              width: '100%', height: 'clamp(260px, 42vh, 500px)',
              overflow: 'hidden', borderRadius: '8px',
              marginBottom: '64px',
            }}
          >
            <motion.img
              src={post.hero}
              alt=""
              style={{
                width: '100%', height: '130%',
                objectFit: 'cover', objectPosition: 'center',
                y: heroY,
              }}
            />
          </motion.div>
        )}

        {/* Divider rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{
            height: '1px', marginBottom: '56px',
            background: 'linear-gradient(to right, var(--cu-b), var(--border), transparent)',
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* ── Body ── */}
      <div className="bp-body" style={{
        display: 'grid',
        gridTemplateColumns: '1fr min(68ch, 100%) 1fr',
        padding: '0 var(--pad) 80px',
      }}>
        <div className="bp-spacer" /> {/* left spacer */}
        <div>
          {renderContent(post.content)}
          <ContinueReading url={post.externalUrl} platform={post.platform} />
          <MorePosts currentSlug={slug} />
        </div>
        <div className="bp-spacer" /> {/* right spacer */}
      </div>

      {/* ── Footer strip ── */}
      <div style={{
        padding: '32px var(--pad)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BackButton />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
          color: 'var(--text3)', letterSpacing: '0.06em',
        }}>
          {post.date} · Kolkata, India
        </span>
      </div>
    </div>
  )
}

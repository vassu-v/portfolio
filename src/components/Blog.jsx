import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { POSTS } from '../data/blog'
import { useRoute } from '../router'

function PostCard({ post, index }) {
  const [hovered, setHovered] = useState(false)
  const { navigate } = useRoute()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 96%', 'start 55%'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y       = useTransform(scrollYProgress, [0, 1], [36, 0])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, cursor: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/blog/${post.slug}`)}
    >
      {/* Image */}
      <div style={{
        overflow: 'hidden',
        borderRadius: '6px',
        aspectRatio: '4 / 3',
        marginBottom: '18px',
        background: 'var(--border)',
        position: 'relative',
      }}>
        {post.hero && (
          <motion.img
            src={post.hero}
            alt=""
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Subtle overlay on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(9,9,9,0.45) 0%, transparent 60%)',
          }}
        />
        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '5px' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
            color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em',
            background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(8px)',
            padding: '3px 8px', borderRadius: '100px',
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
              background: 'rgba(9,9,9,0.5)', backdropFilter: 'blur(8px)',
            }}>
              genuinely learned
            </span>
          )}
        </div>
      </div>

      {/* Category · Date */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem',
        color: 'var(--cu)', letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: '9px',
      }}>
        {post.category} · {post.date}
      </div>

      {/* Title */}
      <motion.h3
        animate={{ color: hovered ? 'var(--text)' : 'var(--text2)' }}
        transition={{ duration: 0.18 }}
        style={{
          fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
          fontSize: 'clamp(1.15rem, 1.8vw, 1.45rem)',
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px',
        }}
      >
        {post.title}
      </motion.h3>

      {/* Excerpt */}
      <p style={{
        fontSize: '0.77rem', color: 'var(--text3)', lineHeight: 1.65, marginBottom: '16px',
      }}>
        {post.subtitle}
      </p>

      {/* Read link */}
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

export default function Blog() {
  const { navigate } = useRoute()

  return (
    <section
      id="writing"
      className="sec-section"
      style={{ padding: '0 var(--pad) 80px', position: 'relative', zIndex: 1 }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: '32px',
      }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--text3)', marginBottom: '8px',
          }}>
            Writing
          </div>
          <h2 style={{
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(1.6rem, 2.8vw, 2.6rem)',
            letterSpacing: '-0.025em', lineHeight: 1.05,
            color: 'var(--text2)',
          }}>
            The Log.
          </h2>
        </div>

        <button
          onClick={() => navigate('/blog')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text3)', background: 'none', border: 'none',
            cursor: 'none', padding: 0, marginBottom: '6px',
            transition: 'color 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--cu)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}
        >
          All posts
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.52rem' }} />
        </button>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '28px',
      }}>
        {POSTS.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </div>
    </section>
  )
}

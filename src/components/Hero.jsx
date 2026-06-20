import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AGE, YEAR } from '../utils/meta'
import { useMobile, PORTRAIT_QUERY } from '../hooks/useMobile'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function useScramble(target, startDelay = 0, duration = 850) {
  const [text, setText] = useState(target.replace(/[A-Z0-9]/g, '·'))
  useEffect(() => {
    let raf, timeout
    timeout = setTimeout(() => {
      const start = performance.now()
      function run(now) {
        const elapsed  = now - start
        const progress = Math.min(elapsed / duration, 1)
        const revealed = Math.floor(progress * target.length)
        setText(
          target.split('').map((char, i) =>
            i < revealed ? char : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          ).join('')
        )
        if (progress < 1) raf = requestAnimationFrame(run)
        else setText(target)
      }
      raf = requestAnimationFrame(run)
    }, startDelay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [target, startDelay, duration])
  return text
}

const fade = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1], delay },
})

export default function Hero() {
  const sectionRef = useRef(null)
  const photoRef   = useRef(null)
  const line1      = useScramble('SHORYA',   320, 820)
  const line2      = useScramble('VARDHAAN', 500, 900)
  const isMobile   = useMobile(PORTRAIT_QUERY)

  const { scrollY } = useScroll()
  const textY      = useTransform(scrollY, [0, 600], [0, -80])
  const textOp     = useTransform(scrollY, [0, 400], [1, 0])
  const textBlur   = useTransform(scrollY, [0, 400], ['blur(0px)', 'blur(6px)'])
  const photoOp    = useTransform(scrollY, [0, 560], [1, 0.05])
  const photoY     = useTransform(scrollY, [0, 600], [0, -30])
  const photoScale = useTransform(scrollY, [0, 600], [1, 1.05])

  useEffect(() => {
    const t = setTimeout(() => {
      if (photoRef.current) photoRef.current.style.opacity = '1'
    }, 120)

    if (isMobile) return () => clearTimeout(t)

    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf
    const onMove = e => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      targetX = (e.clientX - cx) / cx * 11
      targetY = (e.clientY - cy) / cy * 6
    }
    const runParallax = () => {
      curX += (targetX - curX) * 0.055
      curY += (targetY - curY) * 0.055
      if (photoRef.current) {
        photoRef.current.style.transform =
          `translateX(calc(-50% + ${curX.toFixed(2)}px)) translateY(${curY.toFixed(2)}px)`
      }
      raf = requestAnimationFrame(runParallax)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(runParallax)

    return () => {
      clearTimeout(t)
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [isMobile])

  // ── Mobile layout ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '100%', height: '50%',
          background: 'radial-gradient(ellipse at 70% 35%, rgba(197,123,43,0.10) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Text block */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '96px var(--pad) 28px', position: 'relative', zIndex: 2,
        }}>
          <motion.div {...fade(0.2)} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--cu)', display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '18px',
          }}>
            <span style={{ width: '20px', height: '1px', background: 'var(--cu)', flexShrink: 0 }} />
            Kolkata, India &nbsp;·&nbsp; {YEAR}
          </motion.div>

          <span style={{
            display: 'block', fontSize: 'clamp(52px, 17vw, 88px)',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700, lineHeight: 0.88, letterSpacing: '-0.03em', marginBottom: '24px',
          }}>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01, delay: 0.30 }} style={{ display: 'block' }}>
              {line1}
            </motion.span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01, delay: 0.46 }} style={{ display: 'block', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.18)' }}>
              {line2}
            </motion.span>
          </span>

          <motion.p {...fade(0.72)} style={{
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(15px, 4.5vw, 20px)', color: 'var(--text2)', lineHeight: 1.5,
            marginBottom: '24px', maxWidth: '340px',
          }}>
            Building <em style={{ fontStyle: 'normal', color: 'var(--text)' }}>something that might matter</em> — from a desk in Kolkata.
          </motion.p>

          <motion.div {...fade(0.9)} style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem',
              color: 'var(--cu)', background: 'var(--cu-d)', border: '1px solid var(--cu-b)',
              padding: '5px 12px', borderRadius: '100px', letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cu)', animation: 'live 2.4s ease-in-out infinite' }} />
              Open to collaborate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text2)' }}>
                {AGE}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>
                y/o
              </span>
            </div>
          </motion.div>
        </div>

        {/* Photo strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          style={{
            height: 'clamp(220px, 56vw, 320px)',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}
        >
          <img
            ref={photoRef}
            src="/preview (1).jpg"
            alt="Shoryavardhaan Gupta"
            style={{
              position: 'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              height: '115%', width: 'auto', maxWidth: 'none',
              objectFit: 'contain', objectPosition: 'bottom center',
              opacity: 1,
            }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: 'linear-gradient(to right, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '30%', height: '100%', background: 'linear-gradient(to left, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
        </motion.div>
      </section>
    )
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className="hero-section"
      style={{ minHeight: '100svh', display: 'grid', gridTemplateColumns: '55fr 45fr', position: 'relative', overflow: 'hidden', zIndex: 1 }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '55%', height: '100%',
        background: 'radial-gradient(ellipse at 70% 35%, rgba(197,123,43,0.13) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(91,143,175,0.06) 0%, transparent 50%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div
        style={{ y: textY, opacity: textOp, filter: textBlur }}
        className="hero-text-col"
      >
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '100px var(--pad) 60px', height: '100%',
          position: 'relative', zIndex: 2,
        }}>
          <motion.div {...fade(0.2)} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.66rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--cu)', display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '22px',
          }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--cu)', flexShrink: 0 }} />
            Kolkata, India &nbsp;·&nbsp; {YEAR}
          </motion.div>

          <span style={{
            display: 'block', fontSize: 'clamp(58px, 9.5vw, 140px)',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700, lineHeight: 0.88, letterSpacing: '-0.03em', marginBottom: '32px',
          }}>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01, delay: 0.30 }} style={{ display: 'block' }}>
              {line1}
            </motion.span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01, delay: 0.46 }} style={{ display: 'block', color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.18)' }}>
              {line2}
            </motion.span>
          </span>

          <motion.p {...fade(0.72)} style={{
            fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
            fontSize: 'clamp(16px, 1.9vw, 24px)', color: 'var(--text2)', lineHeight: 1.45,
            marginBottom: '36px', maxWidth: '500px',
          }}>
            Building <em style={{ fontStyle: 'normal', color: 'var(--text)' }}>something that might matter</em> —<br />
            from a desk in Kolkata.
          </motion.p>

          <motion.div {...fade(0.9)} style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.64rem',
              color: 'var(--cu)', background: 'var(--cu-d)', border: '1px solid var(--cu-b)',
              padding: '6px 13px', borderRadius: '100px', letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cu)', animation: 'live 2.4s ease-in-out infinite' }} />
              Open to collaborate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text2)' }}>
                {AGE}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>
                y/o
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div style={{ y: photoY, opacity: photoOp, scale: photoScale, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <img
          ref={photoRef}
          src="/preview (1).jpg"
          alt="Shoryavardhaan Gupta"
          style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            height: '88%', width: 'auto', maxWidth: '100%',
            display: 'block', objectFit: 'contain', objectPosition: 'bottom center',
            opacity: 0, transition: 'opacity 0.9s ease 0.6s',
            willChange: 'transform',
          }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', background: 'linear-gradient(to right, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 3 }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}
        style={{ position: 'absolute', bottom: '36px', left: 'var(--pad)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}
      >
        <div style={{ width: '40px', height: '1px', background: 'var(--border2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, var(--cu), transparent)', animation: 'sc-sweep 1.8s ease-in-out infinite' }} />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          scroll
        </span>
      </motion.div>
    </section>
  )
}

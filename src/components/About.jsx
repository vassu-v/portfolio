import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

function ScrollReveal({ children, yFrom = 36, xFrom = 0, style }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'start 22%'] })
  const opacity = useTransform(scrollYProgress, [0, 0.65], [0, 1])
  const y       = useTransform(scrollYProgress, [0, 0.65], [yFrom, 0])
  const x       = useTransform(scrollYProgress, [0, 0.65], [xFrom, 0])
  return <motion.div ref={ref} style={{ opacity, y, x, ...style }}>{children}</motion.div>
}

// Paragraph whose text brightens as it scrolls into reading position (~50% viewport)
function ReadingPara({ children }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 78%', 'start 46%'] })
  const color = useTransform(scrollYProgress, [0, 1], ['#7a7a7a', '#d8d8d8'])
  return (
    <ScrollReveal yFrom={20}>
      <motion.p ref={ref} style={{
        fontSize: '0.92rem', lineHeight: 1.95,
        borderLeft: '1px solid var(--border)', paddingLeft: '20px',
        color,
      }}>
        {children}
      </motion.p>
    </ScrollReveal>
  )
}

export default function About() {
  const photoRef = useRef(null)
  // Photo parallax — moves slower than scroll, creating depth
  const { scrollYProgress: photoScroll } = useScroll({ target: photoRef, offset: ['start end', 'end start'] })
  const photoY = useTransform(photoScroll, [0, 1], [40, -40])

  return (
    <section
      id="about"
      className="sec-section"
      style={{ padding: '40px var(--pad) 80px', position: 'relative', zIndex: 1 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 340px) 1fr', gap: '72px', alignItems: 'start' }}>

        {/* Photo with independent parallax */}
        <div ref={photoRef}>
          <ScrollReveal>
            <motion.div style={{ y: photoY }}>
              <img
                src="/1758438412149.png"
                alt="Shoryavardhaan Gupta"
                style={{
                  width: '100%', aspectRatio: '4/5', objectFit: 'cover', objectPosition: 'top center',
                  borderRadius: '10px', display: 'block',
                  filter: 'grayscale(10%) contrast(1.03)',
                  transition: 'filter 0.6s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'none'}
                onMouseLeave={e => e.currentTarget.style.filter = 'grayscale(10%) contrast(1.03)'}
              />
            </motion.div>
          </ScrollReveal>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <ScrollReveal yFrom={28} style={{ marginBottom: '52px' }}>
            <p style={{
              fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(28px, 3.5vw, 52px)', lineHeight: 1.22, color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>
              I don't wait to be qualified.<br />
              I ship things, see what breaks,<br />
              and figure it out{' '}
              <em style={{ fontStyle: 'normal', color: 'var(--cu)' }}>from there.</em>
            </p>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ReadingPara>At 16, in 11th grade navigating PCM — while leading <strong>Bits&amp;Bytes Kolkata</strong>, consulting at <strong>4MQ.org</strong>, and building open-source tools that solve real gaps, not demo projects.</ReadingPara>
            <ReadingPara>Work spans hardware (LiFi mesh networks, Arduino reaction simulators), AI research (planning systems and grounding failures on Zenodo), and product — Buy4Chai for India's Stripe exclusion problem, SarkarSathi for civic accountability. The thread: constraint thinking. Building the right thing with what's actually available.</ReadingPara>
            <ReadingPara>Published research at 15. National ideathon recognition. First international payment from Kolkata. None of it felt like an achievement at the time — it felt like the next thing to figure out.</ReadingPara>

          </div>
        </div>
      </div>
    </section>
  )
}

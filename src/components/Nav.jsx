import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoute } from '../router'
import { useMobile, PORTRAIT_QUERY } from '../hooks/useMobile'

const IDS  = ['about', 'projects', 'highlights', 'contact']
const NUMS = ['01',    '02',       '03',          '04']

function NavLink({ id, index, isActive }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.a
      href={`#${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'inline-block', paddingBottom: '3px', textDecoration: 'none' }}
    >
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="num"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute', right: '100%', paddingRight: '6px',
              top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem',
              color: 'var(--text3)', letterSpacing: '0.1em',
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}
          >
            {NUMS[index]}
          </motion.span>
        )}
      </AnimatePresence>

      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
        letterSpacing: '0.10em',
        color: isActive ? 'var(--cu)' : hovered ? 'var(--text)' : 'var(--text2)',
        transition: 'color 0.15s', display: 'block',
      }}>
        {id}
      </span>

      {!isActive && (
        <motion.span
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '1px', background: 'var(--border2)',
            transformOrigin: 'left', display: 'block',
          }}
        />
      )}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '1px', background: 'var(--cu)', display: 'block',
          }}
        />
      )}
    </motion.a>
  )
}

// ── Mobile overlay ─────────────────────────────────────────────────────────────

function MobileMenu({ open, onClose }) {
  const { navigate } = useRoute()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(9,9,9,0.97)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 40px 60px',
          }}
        >
          {IDS.map((id, i) => (
            <motion.a
              key={id}
              href={`#${id}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: i * 0.055 }}
              onClick={onClose}
              style={{
                fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(2.6rem, 11vw, 4.2rem)',
                letterSpacing: '-0.025em', lineHeight: 1.1,
                color: 'var(--text2)', textDecoration: 'none',
                padding: '10px 0',
                transition: 'color 0.15s',
              }}
              onTouchStart={e => { e.currentTarget.style.color = 'var(--cu)' }}
              onTouchEnd={e => { e.currentTarget.style.color = 'var(--text2)' }}
            >
              {id}
            </motion.a>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: IDS.length * 0.055 + 0.04 }}
            style={{ width: '28px', height: '1px', background: 'var(--border2)', margin: '6px 0' }}
          />

          <motion.a
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: IDS.length * 0.055 + 0.08 }}
            href="/blog"
            onClick={e => { e.preventDefault(); navigate('/blog'); onClose() }}
            style={{
              fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(2.6rem, 11vw, 4.2rem)',
              letterSpacing: '-0.025em', lineHeight: 1.1,
              color: 'var(--cu)', textDecoration: 'none',
              padding: '10px 0', transition: 'color 0.15s',
            }}
            onTouchStart={e => { e.currentTarget.style.color = 'var(--text)' }}
            onTouchEnd={e => { e.currentTarget.style.color = 'var(--cu)' }}
          >
            log
          </motion.a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Hamburger button ──────────────────────────────────────────────────────────

function Hamburger({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px', display: 'flex', flexDirection: 'column',
        gap: '5px', alignItems: 'flex-end', zIndex: 201, position: 'relative',
      }}
    >
      <motion.span
        animate={{ width: open ? '20px' : '22px', rotate: open ? 45 : 0, y: open ? 9 : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'block', height: '1.5px', background: open ? 'var(--text)' : 'var(--text2)', width: '22px', transformOrigin: 'center' }}
      />
      <motion.span
        animate={{ opacity: open ? 0 : 1, width: open ? 0 : '15px' }}
        transition={{ duration: 0.2 }}
        style={{ display: 'block', height: '1.5px', background: 'var(--text2)', width: '15px' }}
      />
      <motion.span
        animate={{ width: open ? '20px' : '22px', rotate: open ? -45 : 0, y: open ? -9 : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'block', height: '1.5px', background: open ? 'var(--text)' : 'var(--text2)', width: '22px', transformOrigin: 'center' }}
      />
    </button>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────

export default function Nav() {
  const [stuck,   setStuck]   = useState(false)
  const [active,  setActive]  = useState('')
  const [logHov,  setLogHov]  = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { navigate } = useRoute()
  const isMobile = useMobile(PORTRAIT_QUERY)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = IDS.map(id => document.getElementById(id)).filter(Boolean)
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { threshold: 0, rootMargin: '-62px 0px -55% 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Close menu on route change / resize to desktop
  useEffect(() => { if (!isMobile) setMenuOpen(false) }, [isMobile])

  return (
    <>
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.88 }}
        style={{
          position: 'fixed', inset: '0 0 auto 0', zIndex: menuOpen ? 201 : 50,
          height: '62px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--pad)',
          background: stuck || menuOpen ? 'rgba(9,9,9,0.98)' : 'rgba(9,9,9,0.55)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${stuck || menuOpen ? 'var(--border2)' : 'var(--border)'}`,
          transition: 'background 0.35s, border-color 0.35s',
        }}
      >
        {/* Logo */}
        <motion.a
          href="#"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem',
            fontWeight: 500, color: 'var(--cu)', letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center', textDecoration: 'none',
            zIndex: 202,
          }}
        >
          SG
          <span style={{
            display: 'inline-block', width: '2px', height: '14px',
            background: 'var(--cu)', marginLeft: '2px', verticalAlign: '-2px',
            animation: 'blink 1.1s step-end infinite',
          }} />
        </motion.a>

        {/* Desktop links */}
        {!isMobile && (
          <ul style={{ display: 'flex', gap: '36px', listStyle: 'none', alignItems: 'center' }}>
            {IDS.map((id, i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.92 + i * 0.06 }}
              >
                <NavLink id={id} index={i} isActive={active === id} />
              </motion.li>
            ))}

            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.18 }}
              style={{ width: '1px', height: '14px', background: 'var(--border2)', flexShrink: 0 }}
            />

            <motion.li
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.22 }}
            >
              <button
                onClick={() => navigate('/blog')}
                onMouseEnter={() => setLogHov(true)}
                onMouseLeave={() => setLogHov(false)}
                style={{
                  position: 'relative', background: 'none', border: 'none',
                  padding: '0 0 3px', cursor: 'none',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem',
                  letterSpacing: '0.10em',
                  color: logHov ? 'var(--cu)' : 'var(--text2)',
                  transition: 'color 0.15s', display: 'block',
                }}
              >
                log
                <motion.span
                  animate={{ scaleX: logHov ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '1px', background: 'var(--cu)',
                    transformOrigin: 'left', display: 'block',
                  }}
                />
              </button>
            </motion.li>
          </ul>
        )}

        {/* Mobile hamburger */}
        {isMobile && <Hamburger open={menuOpen} onClick={() => setMenuOpen(o => !o)} />}
      </motion.nav>

      {/* Mobile menu overlay */}
      {isMobile && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </>
  )
}

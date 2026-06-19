import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const IDS  = ['about', 'projects', 'highlights', 'contact']
const NUMS = ['01',    '02',       '03',          '04']

function NavLink({ id, index, isActive }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.a
      href={`#${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-block',
        paddingBottom: '3px',
        textDecoration: 'none',
      }}
    >
      {/* Section number — ghosts in to the left when this link is active */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="num"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              right: '100%',
              paddingRight: '6px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.5rem',
              color: 'var(--text3)',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {NUMS[index]}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Link label */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.68rem',
        letterSpacing: '0.10em',
        color: isActive ? 'var(--cu)' : hovered ? 'var(--text)' : 'var(--text2)',
        transition: 'color 0.15s',
        display: 'block',
      }}>
        {id}
      </span>

      {/* Hover underline — wipes in from left, only when not active */}
      {!isActive && (
        <motion.span
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '1px',
            background: 'var(--border2)',
            transformOrigin: 'left',
            display: 'block',
          }}
        />
      )}

      {/* Active underline — slides between links via layoutId */}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '1px',
            background: 'var(--cu)',
            display: 'block',
          }}
        />
      )}
    </motion.a>
  )
}

export default function Nav() {
  const [stuck,  setStuck]  = useState(false)
  const [active, setActive] = useState('')

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

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.88 }}
      style={{
        position: 'fixed', inset: '0 0 auto 0', zIndex: 50, height: '62px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--pad)',
        background: stuck ? 'rgba(9,9,9,0.96)' : 'rgba(9,9,9,0.55)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${stuck ? 'var(--border2)' : 'var(--border)'}`,
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
        }}
      >
        SG
        <span style={{
          display: 'inline-block', width: '2px', height: '14px',
          background: 'var(--cu)', marginLeft: '2px', verticalAlign: '-2px',
          animation: 'blink 1.1s step-end infinite',
        }} />
      </motion.a>

      {/* Links */}
      <ul style={{ display: 'flex', gap: '36px', listStyle: 'none' }}>
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
      </ul>
    </motion.nav>
  )
}

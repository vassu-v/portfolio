import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROJECTS } from '../../data/projects'
import { EXP } from '../../components/Experience'
import { useRoute } from '../../router'
import { useMobile } from '../../hooks/useMobile'
import { room, live, useRoom, focusOn } from './store'
import { isNight } from './hour'

const RoomScene = lazy(() => import('./RoomScene'))

const mono = { fontFamily: 'JetBrains Mono, monospace' }
const serif = { fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300 }

const SPOTS = [
  { id: 'drawer', label: 'projects', hint: 'drawer' },
  { id: 'diary', label: 'log', hint: 'diary' },
  { id: 'corkboard', label: 'experience', hint: 'corkboard' },
  { id: 'phone', label: 'contact', hint: 'phone' },
  { id: 'laptop', label: 'terminal', hint: 'laptop' },
]

function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      live.scroll = v
      setP(v)
      const explore = v > 0.93
      if (room.get().explore !== explore) room.set({ explore })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  return p
}

function HoverLabel() {
  const hover = useRoom(s => s.hover)
  const ref = useRef()
  useEffect(() => {
    const on = e => { if (ref.current) ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)` }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [])
  return (
    <div ref={ref} style={{ position: 'fixed', left: 0, top: 0, zIndex: 60, pointerEvents: 'none' }}>
      <AnimatePresence>
        {hover && (
          <motion.div
            key={hover.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.06em', color: '#f3e9da', background: 'rgba(14,11,8,0.78)', border: '1px solid rgba(197,123,43,0.45)', padding: '6px 10px', borderRadius: 4, whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}
          >
            {hover.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...mono, fontSize: '0.66rem', letterSpacing: '0.08em', textTransform: 'lowercase',
        color: active ? '#120d08' : '#f0e6d8', background: active ? 'var(--go)' : 'rgba(14,11,8,0.55)',
        border: '1px solid rgba(212,152,58,0.35)', borderRadius: 999, padding: '8px 14px', backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  )
}

function FocusPanel({ focus }) {
  const mobile = useMobile(768)
  const folder = useRoom(s => s.folder)
  const card = useRoom(s => s.card)
  const { navigate } = useRoute()
  let title = '', body = null
  if (focus === 'drawer') {
    const p = PROJECTS[folder]
    title = p ? p.name : 'Projects'
    body = p
      ? <><p>{p.tagline}</p><button style={linkBtn} onClick={() => navigate(`/project/${p.slug}`)}>open case study →</button></>
      : <p>Every folder is a project. Pick one out.</p>
  } else if (focus === 'corkboard') {
    const e = EXP[card]
    title = e ? `${e.org}` : 'The work so far'
    body = e
      ? <><p style={{ color: 'var(--go)' }}>{e.primaryRole} · {e.period}</p><p>{e.desc}</p></>
      : <p>Roles pinned in order, string runs oldest → newest. Tap a card.</p>
  } else if (focus === 'diary') {
    title = 'The log'
    body = <><p>Essays on building, tech and thinking clearly.</p><button style={linkBtn} onClick={() => navigate('/blog')}>read the log →</button></>
  } else if (focus === 'phone') {
    title = 'Say hi'
    body = <>
      <p><a style={link} href="mailto:shoryavardhaans2@gmail.com">shoryavardhaans2@gmail.com</a></p>
      <p><a style={link} href="https://cal.com/shoryavardhaan/30min?overlayCalendar=true" target="_blank" rel="noreferrer">book a 30-min call →</a></p>
      <p><a style={link} href="https://www.linkedin.com/in/shoryavardhaan" target="_blank" rel="noreferrer">linkedin</a> · <a style={link} href="https://github.com/vassu-v" target="_blank" rel="noreferrer">github</a></p>
    </>
  } else if (focus === 'laptop') {
    title = 'Terminal'
    body = <><p>Prefer text? There's a full CLI version of this site.</p><a style={link} href="/terminal/index.html">open cli mode →</a></>
  }
  return (
    <motion.aside
      key={focus + folder + card}
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'fixed', left: mobile ? 16 : 'var(--pad)', right: mobile ? 16 : 'auto', bottom: mobile ? 72 : 48, zIndex: 50, maxWidth: mobile ? 'none' : 380, color: '#efe6d8', ...mono, fontSize: '0.78rem', lineHeight: 1.65, background: 'rgba(12,10,8,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '20px 22px' }}
    >
      <h2 style={{ ...serif, fontSize: '2.2rem', lineHeight: 1.05, marginBottom: 10, color: '#f6efe4' }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>{body}</div>
    </motion.aside>
  )
}

const link = { color: 'var(--go)', textDecoration: 'none', borderBottom: '1px solid rgba(212,152,58,0.4)' }
const linkBtn = { ...link, ...mono, background: 'none', border: 'none', borderBottom: '1px solid rgba(212,152,58,0.4)', padding: 0, fontSize: '0.78rem', justifySelf: 'start' }

function Debug() {
  const hour = useRoom(s => s.hour)
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 70, ...mono, fontSize: 11, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 6 }}>
      hour {hour.toFixed(1)}
      <input type="range" min="0" max="23.9" step="0.1" value={hour} onChange={e => room.set({ hour: +e.target.value })} style={{ display: 'block', width: 220 }} />
    </div>
  )
}

export default function RoomHome() {
  const p = useScrollProgress()
  const focus = useRoom(s => s.focus)
  const explore = useRoom(s => s.explore)
  const hour = useRoom(s => s.hour)
  const debug = useRoom(s => s.debug)
  const lampOn = useRoom(s => s.lampOn)
  const mobile = useMobile(768)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: 0 }))
    let raf, t0
    const delay = setTimeout(() => {
      const run = now => {
        t0 ??= now
        live.intro = Math.min(1, (now - t0) / 2600)
        if (live.intro < 1) raf = requestAnimationFrame(run)
      }
      raf = requestAnimationFrame(run)
    }, 900)
    const onKey = e => { if (e.key === 'Escape') room.set({ focus: null, folder: -1, card: -1 }) }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [])

  const copyOp = (a, b, c, d) => (p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1)
  const timeWord = isNight(hour) ? 'night' : hour < 11 ? 'morning' : hour < 16.5 ? 'afternoon' : 'evening'

  return (
    <>
      <Suspense fallback={null}><RoomScene /></Suspense>
      {/* scroll runway that drives the camera */}
      <div style={{ height: '420vh', position: 'relative', zIndex: 0, pointerEvents: 'none' }} />

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px var(--pad)', pointerEvents: 'none' }}>
        <span style={{ ...mono, color: 'var(--cu)', fontSize: '0.9rem', letterSpacing: '0.12em' }}>SG</span>
        <span style={{ ...mono, color: 'rgba(240,230,216,0.6)', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
          {timeWord} light · {lampOn ? 'lamp on' : 'lamp off'} · <a href="/?classic" style={{ color: 'inherit', pointerEvents: 'auto' }}>classic view</a>
        </span>
      </header>

      {/* scroll copy */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        <motion.div animate={{ opacity: focus ? 0 : copyOp(-1, 0, 0.04, 0.1) }} style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', ...mono, fontSize: '0.62rem', letterSpacing: '0.24em', color: 'rgba(240,230,216,0.7)' }}>
          SCROLL
        </motion.div>
        <motion.div animate={{ opacity: focus ? 0 : copyOp(0.44, 0.52, 0.66, 0.74) }} style={{ position: 'absolute', left: 'var(--pad)', top: '30%', maxWidth: 520 }}>
          <p style={{ ...serif, fontSize: 'clamp(2.2rem, 4.8vw, 4rem)', lineHeight: 1.02, color: '#f6efe4', textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
            Building something<br />that might matter.
          </p>
          <p style={{ ...mono, marginTop: 16, fontSize: '0.75rem', color: 'rgba(240,230,216,0.75)', letterSpacing: '0.04em' }}>from a desk in Kolkata.</p>
        </motion.div>
      </div>

      {/* explore chips — also the accessible way to reach every object */}
      <AnimatePresence>
        {(explore || focus) && (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ position: 'fixed', right: mobile ? 16 : 'var(--pad)', left: mobile ? 16 : 'auto', bottom: mobile ? 20 : 40, zIndex: 50, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: mobile ? 'center' : 'flex-end', maxWidth: mobile ? 'none' : 520 }}
          >
            {focus && <Chip onClick={() => room.set({ focus: null, folder: -1, card: -1 })}>← back to the desk</Chip>}
            {(!focus || !mobile) && SPOTS.map(s => (
              <Chip key={s.id} active={focus === s.id} onClick={() => focusOn(s.id)}>{s.label} · {s.hint}</Chip>
            ))}
            {(!focus || !mobile) && <Chip onClick={() => { const on = !room.get().lampOn; room.set({ lampOn: on }); document.documentElement.dataset.theme = on ? 'warm' : 'dark' }}>lamp {lampOn ? 'off' : 'on'}</Chip>}
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">{focus && <FocusPanel key={focus} focus={focus} />}</AnimatePresence>
      <HoverLabel />
      {debug && <Debug />}
    </>
  )
}

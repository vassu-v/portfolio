import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROJECTS } from '../../data/projects'
import { SIDE_PROJECTS } from '../../data/sideProjects'
import { POSTS } from '../../data/blog'
import { ITEMS, CAL } from './corkData'
import { PHOTOS } from './DeskPhotos'
import LaptopTerminal from './LaptopTerminal'
import { useRoute } from '../../router'
import { useMobile } from '../../hooks/useMobile'
import { room, live, useRoom, focusOn, closeLayer, inHand } from './store'
import { forgetTier } from './tier'
import { TOUR, goToStop, tourU, RUNWAY_UNITS } from './tourData'

const RoomScene = lazy(() => import('./RoomScene'))

const mono = { fontFamily: 'JetBrains Mono, monospace' }
const serif = { fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300 }

// Chips scroll the tour to a section's stop; only the side drawer and the
// laptop (no stop of their own) open directly.
const SPOTS = [
  { id: 'drawer', label: 'projects', hint: 'drawer', stop: 'projects' },
  { id: 'sides', label: 'side projects', hint: 'drawer 2' },
  { id: 'diary', label: 'log', hint: 'diary', stop: 'diary' },
  { id: 'corkboard', label: 'experience', hint: 'corkboard', stop: 'experience' },
  { id: 'phone', label: 'contact', hint: 'phone', stop: 'finale' },
  { id: 'laptop', label: 'terminal', hint: 'laptop' },
]

// Scroll position → live.scroll (read every frame by CameraRig, which also
// publishes the tour stop and explore state back into the store).
// Magnetic stops: each stop has some give (the camera holds for the first
// ~30% of a leg), but if you stop scrolling mid-journey between two stops
// the tour finishes the move in the direction you were going — never
// stranded halfway between two shots.
function useScrollProgress() {
  useEffect(() => {
    let last = window.scrollY, dir = 0, idle
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      live.scroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (window.scrollY !== last) dir = Math.sign(window.scrollY - last)
      last = window.scrollY
      clearTimeout(idle)
      idle = setTimeout(settle, 260)
    }
    const settle = () => {
      const s = room.get()
      if (s.focus || s.roam || s.pin || s.folder >= 0 || s.side >= 0) return
      const u = tourU(live.scroll)
      const i = Math.floor(u), f = u - i
      const hold = i === 0 ? 0.72 : 0.3
      if (i >= TOUR.length - 1 || f <= hold || f >= 0.97) return
      goToStop(TOUR[dir < 0 ? i : i + 1].id)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { clearTimeout(idle); window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
}

const STOP_COPY = {
  experience: { n: '01', label: 'the work so far', title: "Where I've been.", line: 'Five roles, one string, oldest → newest. Tap a card to pull it off the board.' },
  wins: { n: '02', label: 'wins & receipts', title: 'Proof, pinned.', line: 'A national semi-final, a first international payment, a preprint, a book at fourteen.' },
  projects: { n: '03', label: 'the drawer', title: "Things I've built.", line: 'Every folder is a project. Pull one out and flip through it.', ps: 'P.S. the drawer below holds the side projects — the not-so-serious ones.' },
  diary: { n: '04', label: 'the log', title: 'I write things down.', line: 'Essays on building, tech and thinking clearly. Tap a page to turn it.' },
  ping: { n: '05', label: 'incoming', title: 'Something just came in.', line: 'Your phone, actually. Keep scrolling.' },
  finale: { n: '06', label: 'say hi', title: 'Want to build something together?', line: 'shoryavardhaans2@gmail.com', links: true },
}

const ic = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const SOCIALS = [
  { name: 'Email', href: 'mailto:shoryavardhaans2@gmail.com', icon: <svg {...ic}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></svg> },
  { name: 'Book a 30-min call', href: 'https://cal.com/shoryavardhaan/30min?overlayCalendar=true', icon: <svg {...ic}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg> },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/shoryavardhaan', icon: <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V17M8 7.2v.1M12 17v-3.6a2.4 2.4 0 0 1 4.8 0V17M12 10.5V17" /></svg> },
  { name: 'GitHub', href: 'https://github.com/vassu-v', icon: <svg {...ic}><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></svg> },
  { name: 'X / Twitter', href: 'https://x.com/shoryavardhaan', icon: <svg {...ic}><path d="M4 4l16 16M20 4 4 20" /></svg> },
  { name: 'Instagram', href: 'https://www.instagram.com/let_shorya.be/', icon: <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.1" /></svg> },
  { name: 'ORCID — research', href: 'https://orcid.org/0009-0009-1370-5230', icon: <svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M9 10v6M9 7.5v.1M12.5 16v-6h1.6a3 3 0 0 1 0 6z" /></svg> },
  { name: 'CLI mode — the web terminal', href: '/terminal/', icon: <svg {...ic}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M12.5 15H17" /></svg> },
]

// icon row: hover (or keyboard focus) shows the full name; each opens in a new tab
function Socials({ compact }) {
  const [hot, setHot] = useState(-1)
  const sz = compact ? 34 : 40
  return (
    <div style={{ marginTop: compact ? 10 : 16, pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', gap: compact ? 6 : 8, flexWrap: 'wrap' }}>
        {SOCIALS.map((l, i) => (
          <a key={l.name} href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer" aria-label={l.name}
            onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(-1)} onFocus={() => setHot(i)} onBlur={() => setHot(-1)}
            style={{ display: 'grid', placeItems: 'center', width: sz, height: sz, borderRadius: 10, color: hot === i ? '#120d08' : '#efe6d8', background: hot === i ? 'var(--cu)' : 'rgba(255,240,220,0.06)', border: '1px solid rgba(132,208,232,0.35)', transition: 'background .15s, color .15s' }}>
            {l.icon}
          </a>
        ))}
      </div>
      <p style={{ ...mono, marginTop: compact ? 6 : 10, minHeight: '1.2em', fontSize: '0.66rem', letterSpacing: '0.06em', color: hot >= 0 ? 'var(--cu)' : 'rgba(240,230,216,0.4)' }}>
        {hot >= 0 ? SOCIALS[hot].name + ' ↗' : 'hover an icon'}
      </p>
    </div>
  )
}

// The end of the tour has no big caption — just a small rotating reminder
// that the room is still yours to poke at.
const HINTS = ['drag to look around', 'click anything — it opens', 'throw a paper ball at the bin', 'the lamp switch is top right', 'click the curtains', 'scroll back up any time']
function FreeHints({ mobile }) {
  const stop = useRoom(s => s.tourStop)
  const busy = useRoom(s => !!(s.focus || s.pin || s.folder >= 0 || s.side >= 0))
  const [n, setN] = useState(-1)
  useEffect(() => {
    if (stop !== 'free') return
    let k = 0, hide
    const show = () => { setN(k++ % HINTS.length); clearTimeout(hide); hide = setTimeout(() => setN(-1), 3800) }
    const first = setTimeout(show, 900)
    const every = setInterval(show, 14000)
    return () => { clearTimeout(first); clearInterval(every); clearTimeout(hide); setN(-1) }
  }, [stop])
  return (
    <AnimatePresence>
      {n >= 0 && !busy && stop === 'free' && (
        <motion.div key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          style={{ position: 'fixed', left: 0, right: 0, top: mobile ? 70 : 80, zIndex: 45, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ ...mono, fontSize: '0.7rem', letterSpacing: '0.08em', color: '#efe6d8', background: 'rgba(12,10,8,0.6)', border: '1px solid rgba(132,208,232,0.3)', borderRadius: 999, padding: '7px 14px', backdropFilter: 'blur(8px)' }}>
            {HINTS[n]}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Tour text. The intro's lettering lives in 3D (IntroPhoto) — here is only
// the shadow veil around the lit photo, lifting as you scroll. Each later
// stop gets a short caption while the camera holds there.
function TourCopy({ hidden, mobile }) {
  const stop = useRoom(s => s.tourStop)
  const veil = useRef()
  useEffect(() => {
    let raf, lastKey = ''
    const run = () => {
      raf = requestAnimationFrame(run)
      const u = tourU(live.scroll)
      const lift = Math.min(1, Math.max(0, (u - 0.2) / 0.65))
      const [x, y] = live.photoPx || [window.innerWidth * 0.4, window.innerHeight * 0.45]
      const key = `${lift.toFixed(3)}|${Math.round(x)}|${Math.round(y)}|${hidden}`
      if (key === lastKey) return
      lastKey = key
      if (veil.current) {
        veil.current.style.opacity = String((1 - lift) * (hidden ? 0 : 1))
        // clear over the photo and the name above it, dark towards the edges
        veil.current.style.background = `radial-gradient(${window.innerWidth * (mobile ? 0.75 : 0.62)}px ${window.innerHeight * 0.62}px at ${x}px ${y - window.innerHeight * 0.1}px, rgba(8,7,6,0) 0%, rgba(8,7,6,0) 55%, rgba(8,7,6,0.85) 100%)`
      }
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [hidden, mobile])
  const c = STOP_COPY[stop]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
      <div ref={veil} style={{ position: 'absolute', inset: 0 }} />
      <AnimatePresence>
        {c && !hidden && (
          <motion.div key={stop}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              // phones: a compact card along the bottom; CameraRig lifts the
              // scene above it so it never sits on what the stop is about
              ...(mobile ? { position: 'absolute', left: 12, right: 12, bottom: 14 } : { position: 'absolute', left: 'var(--pad)', bottom: 48, maxWidth: 440 }),
              background: 'rgba(12,10,8,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: mobile ? '12px 14px' : '20px 24px', ...(mobile ? { background: 'rgba(12,10,8,0.82)' } : {}),
            }}>
            <p style={{ ...mono, fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--cu)', marginBottom: 10, textTransform: 'uppercase' }}>{c.n && <span style={{ color: 'var(--go)' }}>{c.n} — </span>}{c.label}</p>
            <p style={{ ...serif, fontSize: mobile ? '1.55rem' : 'clamp(2.2rem, 3.6vw, 3.2rem)', lineHeight: 1.02, color: '#f6efe4', textShadow: '0 2px 30px rgba(0,0,0,0.6)' }}>{c.title}</p>
            {c.links
              ? <a href="mailto:shoryavardhaans2@gmail.com" style={{ ...mono, display: 'inline-block', marginTop: 12, fontSize: '0.78rem', color: 'var(--cu)', pointerEvents: 'auto', borderBottom: '1px solid rgba(132,208,232,0.4)', textDecoration: 'none' }}>{c.line}</a>
              : <p style={{ ...mono, marginTop: mobile ? 6 : 12, fontSize: mobile ? '0.68rem' : '0.74rem', lineHeight: 1.6, color: 'rgba(240,230,216,0.78)', textShadow: '0 1px 12px rgba(0,0,0,0.7)' }}>{c.line}</p>}
            {c.ps && <p style={{ ...mono, marginTop: 10, fontSize: '0.7rem', lineHeight: 1.6, color: 'var(--go)' }}>{c.ps}</p>}
            {c.links && <Socials compact={mobile} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
            style={{ ...mono, fontSize: '0.68rem', letterSpacing: '0.06em', color: '#f3e9da', background: 'rgba(14,11,8,0.78)', border: '1px solid rgba(240,122,26,0.45)', padding: '6px 10px', borderRadius: 4, whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}
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
        color: active ? '#120d08' : '#f0e6d8', background: active ? 'var(--cu)' : 'rgba(14,11,8,0.55)',
        border: '1px solid rgba(132,208,232,0.35)', borderRadius: 999, padding: '8px 14px', backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  )
}

// Content comes in as props (a snapshot), not live from the store: when the
// panel closes, AnimatePresence keeps rendering the *last* props while it
// fades, so its contents can't flip to "nothing pinned" mid-exit — that flip
// used to swap in a fresh element that never got an exit, and the panel
// ("The work so far") stayed on screen for good.
function FocusPanel({ focus, folder, pin, spread, page, side }) {
  const mobile = useMobile(768)
  const { navigate } = useRoute()
  const closeDrawer = () => room.set({ focus: null, folder: -1, side: -1 })
  let title = '', body = null
  if (focus === 'drawer') {
    const p = PROJECTS[folder]
    title = p ? p.name : 'Projects'
    body = p
      ? <><p>{p.tagline}</p><p style={{ opacity: 0.6 }}>page {page + 1} / 4 · click the page to turn it · click away to file it</p><button style={linkBtn} onClick={() => navigate(`/project/${p.slug}`)}>open case study →</button></>
      : <><p>Every folder is a project. Pick one out.</p><button style={linkBtn} onClick={closeDrawer}>close the drawer</button></>
  } else if (focus === 'sides') {
    const s = SIDE_PROJECTS[side]
    title = s ? s.name : 'Side projects'
    body = s
      ? <><p>{s.line}</p>{s.href && <a style={link} href={s.href} target="_blank" rel="noreferrer">open it →</a>}{s.placeholder && <p style={{ opacity: 0.5 }}>placeholder — the real list is coming</p>}</>
      : <><p>Not so serious. Just listed, or still on them. Pick a card out.</p><button style={linkBtn} onClick={closeDrawer}>close the drawer</button></>
  } else if (focus === 'corkboard') {
    const it = ITEMS.find(i => i.id === pin)
    title = it ? it.panel.title : 'The work so far'
    body = it
      ? <>
          {it.panel.sub && <p style={{ color: 'var(--cu)' }}>{it.panel.sub}</p>}
          <p>{it.panel.text}</p>
          {it.panel.project && <button style={linkBtn} onClick={() => navigate(`/project/${it.panel.project}`)}>see the project →</button>}
          {it.panel.cta && <a style={link} href={it.panel.cta.href} target="_blank" rel="noreferrer">{it.panel.cta.label} →</a>}
          {it.support.length > 0 && <p style={{ opacity: 0.6 }}>supporting material pulled up beside it — tap a link card to open it</p>}
        </>
      : <p>Roles across the top, the string runs oldest → newest. Wins and receipts below. Tap anything pinned.</p>
  } else if (focus === 'diary') {
    const post = spread > 0 && spread <= POSTS.length ? POSTS[spread - 1] : null
    const next = spread < POSTS.length ? POSTS[spread] : null
    title = spread === 0 ? 'The log' : post.title
    body = <>
      <p>{spread === 0 ? 'Essays on building, tech and thinking clearly. Tap an entry or a coloured tab; tap a page to turn it.' : post.subtitle}</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button style={linkBtn} onClick={() => room.set({ spread: Math.max(0, spread - 1) })} disabled={spread === 0}>← prev</button>
        <button style={linkBtn} onClick={() => room.set({ spread: Math.min(POSTS.length, spread + 1) })} disabled={spread >= POSTS.length}>next →</button>
        {post && <button style={linkBtn} onClick={() => navigate(`/blog/${post.slug}`)}>read this entry →</button>}
        <button style={linkBtn} onClick={() => navigate('/blog')}>all entries</button>
      </div>
      {spread === 0 && next && <p style={{ opacity: 0.6 }}>open on the right: {next.title}</p>}
    </>
  } else if (focus === 'phone') {
    title = 'Say hi'
    body = <>
      <p><a style={link} href="mailto:shoryavardhaans2@gmail.com">shoryavardhaans2@gmail.com</a></p>
      <p><a style={link} href="https://cal.com/shoryavardhaan/30min?overlayCalendar=true" target="_blank" rel="noreferrer">book a 30-min call →</a></p>
      <p><a style={link} href="https://www.linkedin.com/in/shoryavardhaan" target="_blank" rel="noreferrer">linkedin</a> · <a style={link} href="https://github.com/vassu-v" target="_blank" rel="noreferrer">github</a></p>
    </>
  } else if (focus === 'laptop') {
    title = 'Terminal'
    body = <><p>It's live — click the screen and type. Try <code>help</code>, <code>ls</code>, <code>cat about.md</code>.</p><a style={link} href="/terminal/index.html">open full screen →</a></>
  }
  return (
    <motion.aside
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      // phones: a compact bottom sheet that scrolls itself, so it never
      // covers more than ~a third of the screen (the scene is lifted above it)
      style={{ position: 'fixed', left: mobile ? 12 : 'var(--pad)', right: mobile ? 12 : 'auto', bottom: mobile ? 62 : 48, zIndex: 50, maxWidth: mobile ? 'none' : 380, maxHeight: mobile ? '34vh' : 'none', overflowY: mobile ? 'auto' : 'visible', color: '#efe6d8', ...mono, fontSize: mobile ? '0.72rem' : '0.78rem', lineHeight: 1.6, background: mobile ? 'rgba(12,10,8,0.82)' : 'rgba(12,10,8,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: mobile ? '14px 16px' : '20px 22px' }}
    >
      <h2 style={{ ...serif, fontSize: mobile ? '1.6rem' : '2.2rem', lineHeight: 1.05, marginBottom: mobile ? 6 : 10, color: '#f6efe4' }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10 }}>{body}</div>
    </motion.aside>
  )
}

const link = { color: 'var(--cu)', textDecoration: 'none', borderBottom: '1px solid rgba(132,208,232,0.4)' }
const linkBtn = { ...link, ...mono, background: 'none', border: 'none', borderBottom: '1px solid rgba(132,208,232,0.4)', padding: 0, fontSize: '0.78rem', justifySelf: 'start' }

// Inspection panel for ?roam / ?debug: live cost, quality tier, time, lamp.
function Inspector({ full }) {
  const hour = useRoom(s => s.hour)
  const tier = useRoom(s => s.tier)
  const reason = useRoom(s => s.tierReason)
  const lampOn = useRoom(s => s.lampOn)
  const [perf, setPerf] = useState(null)
  const [open, setOpen] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setPerf(live.perf && { ...live.perf }), 500)
    return () => clearInterval(id)
  }, [])
  const setTier = t => { forgetTier(); room.set({ tier: t, tierReason: 'picked in inspector' }) }
  const row = { display: 'flex', justifyContent: 'space-between', gap: 12 }
  return (
    <div style={{ position: 'fixed', right: 12, top: full ? 12 : 'auto', bottom: full ? 'auto' : 12, zIndex: 70, ...mono, fontSize: 11, lineHeight: 1.6, color: '#efe6d8', background: 'rgba(12,10,8,0.78)', border: '1px solid rgba(132,208,232,0.3)', backdropFilter: 'blur(8px)', padding: '10px 12px', borderRadius: 8, width: open ? 248 : 'auto' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...mono, fontSize: 11, color: 'var(--cu)', background: 'none', border: 'none', padding: 0 }}>{open ? '▾' : '▸'} inspector</button>
      {open && (
        <div style={{ marginTop: 6, display: 'grid', gap: 2 }}>
          <div style={row}><span>fps</span><span>{perf?.fps ?? '–'}</span></div>
          <div style={row}><span>draw calls</span><span>{perf?.calls ?? '–'}</span></div>
          <div style={row}><span>triangles</span><span>{perf ? Math.round(perf.tris / 1000) + 'k' : '–'}</span></div>
          <div style={row}><span>render px</span><span>{perf?.px ?? '–'} @{perf?.dpr ?? ''}</span></div>
          <div style={row}><span>js heap</span><span>{perf?.heapMB ?? '–'} MB</span></div>
          <div style={{ marginTop: 8, color: 'rgba(239,230,216,0.6)' }}>tier · {reason}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['high', 'mid', 'low', 'poster'].map(t => (
              <button key={t} onClick={() => setTier(t)} style={{ ...mono, fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(132,208,232,0.4)', background: tier === t ? 'var(--cu)' : 'transparent', color: tier === t ? '#120d08' : '#efe6d8' }}>{t}</button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>time {String(Math.floor(hour)).padStart(2, '0')}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}</div>
          <input type="range" min="0" max="23.9" step="0.1" value={hour} onChange={e => room.set({ hour: +e.target.value })} style={{ width: '100%' }} />
          <button onClick={() => room.set({ lampOn: !lampOn })} style={{ ...mono, fontSize: 11, marginTop: 4, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(132,208,232,0.4)', background: 'transparent', color: '#efe6d8', justifySelf: 'start' }}>lamp {lampOn ? 'off' : 'on'}</button>
          {full && <div style={{ marginTop: 8, color: 'rgba(239,230,216,0.6)' }}>drag to orbit · scroll/pinch to zoom · right-drag to pan · click objects</div>}
        </div>
      )}
    </div>
  )
}

const MODE_KEY = 'room-mode'
function storedMode() {
  try { return localStorage.getItem(MODE_KEY) } catch { return null }
}
function rememberMode(m) {
  try { localStorage.setItem(MODE_KEY, m) } catch { /* storage blocked */ }
}

// Weak devices get asked before anything heavy loads: the fast text-only
// CLI, or the 3D room anyway. Phones aren't flagged just for being phones —
// only real signals (no WebGL2, data saver, low RAM / cores, software GPU).
function shouldAsk(tier, reason) {
  if (new URLSearchParams(window.location.search).has('ask')) return true
  if (storedMode()) return false
  // only when the 3D genuinely can't run well (no WebGL2, software GPU, data
  // saver, a truly tiny machine). Everyone else just loads; if it then runs
  // slow, the measured-FPS probe steps quality down and offers the CLI.
  return tier === 'poster' && !/url override|remembered/.test(reason || '')
}

// Signals that mean the 3D room genuinely can't run here (not "might be
// heavy"): on these the CLI isn't just offered, it's the default.
const POTATO = /no WebGL2|software rendering|GB RAM, \d cores/i

// kind 'before'  — asked before anything heavy loads (poster-tier signals)
// kind 'measured' — the room loaded, but measured far too slow to enjoy
function DeviceChoice({ onContinue, reason, still, kind = 'before', fps }) {
  const mobile = useMobile(768)
  const potato = kind === 'measured' || POTATO.test(reason || '')
  // potato machines go to the CLI on their own unless the visitor picks the room
  const [left, setLeft] = useState(potato ? 8 : 0)
  useEffect(() => {
    if (!left) return
    const id = setTimeout(() => {
      if (left === 1) { rememberMode('cli'); window.location.href = '/terminal/' }
      else setLeft(left - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [left])
  const stop = () => setLeft(0)
  const title = kind === 'measured'
    ? `The room is running at ${fps || 'a few'} fps here.`
    : potato ? "This device can't run the 3D room smoothly." : 'This device might find the 3D room heavy.'
  return (
    <motion.div role="dialog" aria-modal="true" aria-labelledby="dc-title"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16, background: kind === 'measured' ? 'rgba(11,9,7,0.92)' : 'radial-gradient(900px 600px at 50% 0%, rgba(240,122,26,0.12), transparent 60%), #0b0907' }}>
      <div style={{ width: 'min(520px, 100%)', ...mono, color: '#efe6d8', border: '1px solid rgba(255,240,220,0.1)', borderRadius: 14, padding: mobile ? '26px 20px' : '34px 34px 28px', background: 'rgba(255,240,220,0.02)' }}>
        <p style={{ fontSize: '0.66rem', letterSpacing: '0.18em', color: 'var(--cu)', marginBottom: 14 }}>{kind === 'measured' ? 'HEADS UP' : 'BEFORE WE LOAD THE ROOM'}</p>
        <h2 id="dc-title" style={{ ...serif, fontSize: mobile ? '2.1rem' : '2.6rem', lineHeight: 1.05, marginBottom: 12, color: '#f6efe4' }}>{title}</h2>
        <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: 'rgba(239,230,216,0.72)', marginBottom: 22 }}>
          The CLI version has everything (projects, work, writing, contact) and opens instantly{potato ? ' — it is the better way to see this site on this device' : ''}. Or {kind === 'measured' ? 'stay in' : 'load'} the 3D room anyway; you can switch any time.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <a href="/terminal/" onClick={() => rememberMode('cli')} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '14px 18px', borderRadius: 10, background: 'var(--cu)', color: '#120d08', fontWeight: 500, fontSize: '0.85rem' }}>
            open CLI mode — fast, text-first{left ? ` (opening in ${left}s)` : ''}
          </a>
          <button onClick={() => { stop(); rememberMode('3d'); onContinue() }} style={{ ...mono, padding: '13px 18px', borderRadius: 10, background: 'transparent', color: '#efe6d8', border: '1px solid rgba(132,208,232,0.4)', fontSize: '0.85rem' }}>
            {kind === 'measured' ? 'stay in the 3D room' : still ? 'continue to the site' : 'continue to the 3D room'}
          </button>
          {left > 0 && <button onClick={stop} style={{ ...mono, background: 'none', border: 0, color: 'rgba(239,230,216,0.5)', fontSize: '0.7rem', textDecoration: 'underline' }}>wait — let me choose</button>}
        </div>
        <p style={{ marginTop: 16, fontSize: '0.62rem', color: 'rgba(239,230,216,0.4)' }}>why: {kind === 'measured' ? `measured ${fps} fps on the lightest quality` : reason}</p>
      </div>
    </motion.div>
  )
}

const RETURN_KEY = 'room-return'
function readReturn() {
  try {
    const r = JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null')
    sessionStorage.removeItem(RETURN_KEY)
    return r && Date.now() - r.at < 30 * 60 * 1000 ? r : null
  } catch { return null }
}

// Sun / moon switch for the desk lamp (= the site's light / dark).
function LampToggle({ on }) {
  const flip = () => { const v = !room.get().lampOn; room.set({ lampOn: v }); document.documentElement.dataset.theme = v ? 'warm' : 'dark' }
  const icon = { width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }
  return (
    <button onClick={flip} role="switch" aria-checked={on} aria-label={on ? 'lamp on — switch it off' : 'lamp off — switch it on'} title={on ? 'lamp on' : 'lamp off'}
      style={{ pointerEvents: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 9px', borderRadius: 999, border: '1px solid rgba(132,208,232,0.35)', background: 'rgba(14,11,8,0.55)', backdropFilter: 'blur(8px)', color: 'rgba(240,230,216,0.55)' }}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        style={{ position: 'absolute', top: 3, bottom: 3, width: 26, borderRadius: 999, background: on ? 'var(--go)' : 'var(--cu)', left: on ? 3 : 'auto', right: on ? 'auto' : 3 }} />
      <svg viewBox="0 0 24 24" {...icon} style={{ position: 'relative', color: on ? '#120d08' : undefined }}>
        <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
      <svg viewBox="0 0 24 24" {...icon} style={{ position: 'relative', color: on ? undefined : '#0b1418' }}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  )
}

// One-liners from the room itself (paper-ball shots…), gone after ~2 s.
function RoomToast() {
  const toast = useRoom(s => s.toast)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => room.get().toast === toast && room.set({ toast: null }), 2200)
    return () => clearTimeout(id)
  }, [toast])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div key={toast.at} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
          style={{ position: 'fixed', top: '18%', left: 0, right: 0, zIndex: 56, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ ...serif, fontSize: '2.4rem', color: '#f6efe4', textShadow: '0 2px 24px rgba(0,0,0,0.75)' }}>{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SlowToast() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 60, ...mono, fontSize: '0.72rem', color: '#efe6d8', background: 'rgba(12,10,8,0.85)', border: '1px solid rgba(132,208,232,0.35)', borderRadius: 999, padding: '8px 10px 8px 16px', display: 'flex', gap: 10, alignItems: 'center', backdropFilter: 'blur(8px)' }}>
      running slow?
      <a href="/terminal/" onClick={() => rememberMode('cli')} style={{ color: 'var(--cu)' }}>try CLI mode →</a>
      <button aria-label="dismiss" onClick={() => setHidden(true)} style={{ ...mono, background: 'none', border: 0, color: 'rgba(239,230,216,0.5)', fontSize: '0.8rem' }}>✕</button>
    </motion.div>
  )
}

// Devices that can't run the 3D get a still of the same room and the same
// chips, so every section is still one tap away.
function Poster() {
  const mobile = useMobile(768)
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, background: `#0b0907 url(${mobile ? '/room-poster-portrait.jpg' : '/room-poster.jpg'}) center / cover no-repeat` }} />
  )
}

export default function RoomHome() {
  useScrollProgress()
  const focus = useRoom(s => s.focus)
  const tourStop = useRoom(s => s.tourStop)
  const hand = useRoom(inHand)
  const folder = useRoom(s => s.folder)
  const pin = useRoom(s => s.pin)
  const side = useRoom(s => s.side)
  const spread = useRoom(s => s.spread)
  const page = useRoom(s => s.page)
  const hireSeen = useRoom(s => s.hireSeen)
  // a detail panel shows for anything explicitly opened, or a card / folder
  // pulled out at a tour stop
  const panelFor = useRoom(s => s.focus || (s.pin ? 'corkboard' : s.folder >= 0 ? 'drawer' : s.side >= 0 ? 'sides' : null))
  const debug = useRoom(s => s.debug)
  const lampOn = useRoom(s => s.lampOn)
  const roam = useRoom(s => s.roam)
  const photo = useRoom(s => s.photo)
  const tier = useRoom(s => s.tier)
  const capture = new URLSearchParams(window.location.search).has('capture')
  const mobile = useMobile(768)
  const poster = tier === 'poster'
  const { navigate } = useRoute()
  const tierReason = useRoom(s => s.tierReason)
  const struggling = useRoom(s => s.struggling)
  const measuredFps = useRoom(s => s.measuredFps)
  const [measuredDone, setMeasuredDone] = useState(false)
  const [asking, setAsking] = useState(() => shouldAsk(tier, tierReason))
  // give the loading screen a responsive moment before the heavy 3D build
  // starts (evaluating three.js, building the room) — so a quick "switch to
  // CLI mode" always gets through
  const [sceneGo, setSceneGo] = useState(false)
  useEffect(() => { const id = setTimeout(() => setSceneGo(true), 1100); return () => clearTimeout(id) }, [])
  useEffect(() => { document.documentElement.classList.toggle('lite', tier === 'low') }, [tier])
  // no 3D to warm up (still image, or waiting on the device choice): don't hold the loader
  useEffect(() => { if (poster || asking) window.dispatchEvent(new Event('room-warm')) }, [poster, asking])

  useEffect(() => {
    const open = e => e.detail && navigate(`/blog/${e.detail}`)
    const proj = e => e.detail && navigate(`/project/${e.detail}`)
    window.addEventListener('room-open-post', open)
    window.addEventListener('room-open-project', proj)
    return () => { window.removeEventListener('room-open-post', open); window.removeEventListener('room-open-project', proj) }
  }, [navigate])

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    // back from a case study / post: land where the visitor left — same tour
    // spot, same object open, the pulled-out folder or card filed away
    const mountedAt = performance.now()
    const back = readReturn()
    const y = back ? back.y : 0
    window.scrollTo(0, y)
    window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: y }))
    if (back) {
      live.intro = 1
      room.set({ focus: back.focus, folder: -1, side: -1, pin: null, photo: -1, spread: back.focus === 'diary' ? back.spread : 0, hover: null })
    } else room.set({ focus: null, folder: -1, side: -1, pin: null, photo: -1, hover: null })
    let raf, t0
    const delay = setTimeout(() => {
      const run = now => {
        t0 ??= now
        live.intro = Math.min(1, (now - t0) / 2600)
        if (live.intro < 1) raf = requestAnimationFrame(run)
      }
      raf = requestAnimationFrame(run)
    }, 900)
    if (room.get().roam || room.get().tier === 'poster') { live.intro = 1; room.set({ explore: true }) }
    if (new URLSearchParams(window.location.search).has('capture')) { live.intro = 1; live.scroll = 1 }
    const onKey = e => { if (e.key === 'Escape') room.set({ focus: null, folder: -1, side: -1, pin: null }) }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(delay); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey)
      const s = room.get()
      // (dev StrictMode remounts instantly — that's not the visitor leaving)
      if (performance.now() - mountedAt > 1500) try { sessionStorage.setItem(RETURN_KEY, JSON.stringify({ y: window.scrollY, focus: s.focus, spread: s.spread, at: Date.now() })) } catch { /* storage blocked */ }
    }
  }, [])

  return (
    <>
      <AnimatePresence>{asking && <DeviceChoice key="choice" reason={tierReason} still={poster} onContinue={() => setAsking(false)} />}</AnimatePresence>
      {struggling === 'mild' && !roam && <SlowToast />}
      <AnimatePresence>{struggling === 'severe' && !roam && !asking && !storedMode() && !measuredDone && (
        <DeviceChoice key="measured" kind="measured" fps={measuredFps} onContinue={() => setMeasuredDone(true)} />
      )}</AnimatePresence>
      {poster ? <Poster /> : !asking && sceneGo && <Suspense fallback={null}><RoomScene /></Suspense>}
      {roam && <Inspector full />}
      {!roam && debug && <Inspector />}
      {capture ? null : <>
      {/* scroll runway that drives the camera */}
      {!roam && !poster && <div style={{ height: `${100 + RUNWAY_UNITS * 95}vh`, position: 'relative', zIndex: 0, pointerEvents: 'none' }} />}

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px var(--pad)', pointerEvents: 'none' }}>
        <span style={{ ...mono, color: 'var(--cu)', fontSize: '0.9rem', letterSpacing: '0.12em' }}>SG</span>
        {roam
          ? <a href="/" style={{ ...mono, color: 'rgba(240,230,216,0.6)', fontSize: '0.62rem', letterSpacing: '0.1em', pointerEvents: 'auto' }}>← back to the site</a>
          : <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* the one call to action, on hand everywhere past the opening */}
              <AnimatePresence>
                {hireSeen && (
                  <motion.a key="hire" href={CAL} target="_blank" rel="noreferrer"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    style={{ ...mono, pointerEvents: 'auto', fontSize: '0.68rem', letterSpacing: '0.06em', fontWeight: 600, color: '#120d08', background: 'var(--go)', borderRadius: 999, padding: '8px 14px', textDecoration: 'none', boxShadow: '0 4px 18px rgba(240,122,26,0.35)' }}>
                    {mobile ? 'hire me →' : 'hire me · book a call →'}
                  </motion.a>
                )}
              </AnimatePresence>
              <LampToggle on={lampOn} />
            </span>}
      </header>

      {!roam && !poster && <TourCopy hidden={!!panelFor} mobile={mobile} />}
      {!roam && !poster && <FreeHints mobile={mobile} />}

      {/* explore chips — also the accessible way to reach every object */}
      <AnimatePresence>
        {!roam && (tourStop === 'free' || poster || panelFor) && (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ position: 'fixed', right: mobile ? 16 : 'var(--pad)', left: mobile ? 16 : 'auto', bottom: mobile ? 20 : 40, zIndex: 50, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: mobile ? 'center' : 'flex-end', maxWidth: mobile ? 'none' : 520 }}
          >
            {panelFor && <Chip onClick={closeLayer}>{focus ? '← back to the desk' : '← back'}</Chip>}
            {!panelFor && SPOTS.map(s => (
              <Chip key={s.id} active={hand === s.id} onClick={() => (s.stop ? goToStop(s.stop) : focusOn(s.id))}>{s.label} · {s.hint}</Chip>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* no mode="wait": with rapid open/close (click a card, click away,
          scroll on) its exit could stall and leave a stale panel on screen */}
      <AnimatePresence>{panelFor && (
        <FocusPanel key={`${panelFor}|${pin}|${folder}|${side}|${panelFor === 'diary' ? spread : ''}`}
          focus={panelFor} folder={folder} pin={pin} side={side} spread={spread} page={page} />
      )}</AnimatePresence>
      <AnimatePresence>
        {photo >= 0 && (
          <motion.div key={'photo' + photo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: mobile ? 90 : 34, zIndex: 55, textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ ...serif, fontSize: '1.6rem', color: '#f6efe4', textShadow: '0 2px 18px rgba(0,0,0,0.7)' }}>{PHOTOS[photo].caption}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <RoomToast />
      <LaptopTerminal />
      <HoverLabel />
      </>}
    </>
  )
}

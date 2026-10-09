import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PROJECTS } from '../../data/projects'
import { SIDE_PROJECTS } from '../../data/sideProjects'
import { POSTS } from '../../data/blog'
import { ITEMS } from './corkData'
import { PHOTOS } from './DeskPhotos'
import LaptopTerminal from './LaptopTerminal'
import { useRoute } from '../../router'
import { useMobile } from '../../hooks/useMobile'
import { room, live, useRoom, focusOn } from './store'
import { isNight } from './hour'
import { forgetTier } from './tier'

const RoomScene = lazy(() => import('./RoomScene'))

const mono = { fontFamily: 'JetBrains Mono, monospace' }
const serif = { fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontWeight: 300 }

const SPOTS = [
  { id: 'drawer', label: 'projects', hint: 'drawer' },
  { id: 'sides', label: 'side projects', hint: 'drawer 2' },
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

function FocusPanel({ focus }) {
  const mobile = useMobile(768)
  const folder = useRoom(s => s.folder)
  const pin = useRoom(s => s.pin)
  const spread = useRoom(s => s.spread)
  const page = useRoom(s => s.page)
  const side = useRoom(s => s.side)
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
      key={focus + folder + side + pin + (focus === 'diary' ? spread : '')}
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
  return tier === 'poster' || (tier === 'low' && /RAM|core|software/i.test(reason || ''))
}

function DeviceChoice({ onContinue, reason, still }) {
  const mobile = useMobile(768)
  return (
    <motion.div role="dialog" aria-modal="true" aria-labelledby="dc-title"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16, background: 'radial-gradient(900px 600px at 50% 0%, rgba(240,122,26,0.12), transparent 60%), #0b0907' }}>
      <div style={{ width: 'min(520px, 100%)', ...mono, color: '#efe6d8', border: '1px solid rgba(255,240,220,0.1)', borderRadius: 14, padding: mobile ? '26px 20px' : '34px 34px 28px', background: 'rgba(255,240,220,0.02)' }}>
        <p style={{ fontSize: '0.66rem', letterSpacing: '0.18em', color: 'var(--cu)', marginBottom: 14 }}>BEFORE WE LOAD THE ROOM</p>
        <h2 id="dc-title" style={{ ...serif, fontSize: mobile ? '2.1rem' : '2.6rem', lineHeight: 1.05, marginBottom: 12, color: '#f6efe4' }}>This device might find the 3D room heavy.</h2>
        <p style={{ fontSize: '0.8rem', lineHeight: 1.7, color: 'rgba(239,230,216,0.72)', marginBottom: 22 }}>
          The CLI version has everything (projects, work, writing, contact) and opens instantly. Or load the 3D room anyway; you can switch any time.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <a href="/terminal/" onClick={() => rememberMode('cli')} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '14px 18px', borderRadius: 10, background: 'var(--cu)', color: '#120d08', fontWeight: 500, fontSize: '0.85rem' }}>
            open CLI mode — fast, text-first
          </a>
          <button onClick={() => { rememberMode('3d'); onContinue() }} style={{ ...mono, padding: '13px 18px', borderRadius: 10, background: 'transparent', color: '#efe6d8', border: '1px solid rgba(132,208,232,0.4)', fontSize: '0.85rem' }}>
            {still ? 'continue to the site' : 'continue to the 3D room'}
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: '0.62rem', color: 'rgba(239,230,216,0.4)' }}>why: {reason}</p>
      </div>
    </motion.div>
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
  const p = useScrollProgress()
  const focus = useRoom(s => s.focus)
  const explore = useRoom(s => s.explore)
  const hour = useRoom(s => s.hour)
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
  const [asking, setAsking] = useState(() => shouldAsk(tier, tierReason))

  useEffect(() => {
    const open = e => e.detail && navigate(`/blog/${e.detail}`)
    const proj = e => e.detail && navigate(`/project/${e.detail}`)
    window.addEventListener('room-open-post', open)
    window.addEventListener('room-open-project', proj)
    return () => { window.removeEventListener('room-open-post', open); window.removeEventListener('room-open-project', proj) }
  }, [navigate])

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
    if (room.get().roam || room.get().tier === 'poster') { live.intro = 1; room.set({ explore: true }) }
    if (new URLSearchParams(window.location.search).has('capture')) { live.intro = 1; live.scroll = 1 }
    const onKey = e => { if (e.key === 'Escape') room.set({ focus: null, folder: -1, side: -1, pin: null }) }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [])

  const copyOp = (a, b, c, d) => (p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1)
  const timeWord = isNight(hour) ? 'night' : hour < 11 ? 'morning' : hour < 16.5 ? 'afternoon' : 'evening'

  return (
    <>
      <AnimatePresence>{asking && <DeviceChoice key="choice" reason={tierReason} still={poster} onContinue={() => setAsking(false)} />}</AnimatePresence>
      {struggling && !roam && <SlowToast />}
      {poster ? <Poster /> : !asking && <Suspense fallback={null}><RoomScene /></Suspense>}
      {roam && <Inspector full />}
      {!roam && debug && <Inspector />}
      {capture ? null : <>
      {/* scroll runway that drives the camera */}
      {!roam && !poster && <div style={{ height: '420vh', position: 'relative', zIndex: 0, pointerEvents: 'none' }} />}

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px var(--pad)', pointerEvents: 'none' }}>
        <span style={{ ...mono, color: 'var(--cu)', fontSize: '0.9rem', letterSpacing: '0.12em' }}>SG</span>
        <span style={{ ...mono, color: 'rgba(240,230,216,0.6)', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
          {roam ? <a href="/" style={{ color: 'inherit', pointerEvents: 'auto' }}>← back to the site</a> : <>{timeWord} light · {lampOn ? 'lamp on' : 'lamp off'} · <a href="/?classic" style={{ color: 'inherit', pointerEvents: 'auto' }}>classic view</a></>}
        </span>
      </header>

      {/* scroll copy */}
      {!roam && !poster && <div style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
        <motion.div animate={{ opacity: focus ? 0 : copyOp(-1, 0, 0.04, 0.1) }} style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', ...mono, fontSize: '0.62rem', letterSpacing: '0.24em', color: 'rgba(240,230,216,0.7)' }}>
          SCROLL
        </motion.div>
        <motion.div animate={{ opacity: focus ? 0 : copyOp(0.44, 0.52, 0.66, 0.74) }} style={{ position: 'absolute', left: 'var(--pad)', top: '30%', maxWidth: 520 }}>
          <p style={{ ...serif, fontSize: 'clamp(2.2rem, 4.8vw, 4rem)', lineHeight: 1.02, color: '#f6efe4', textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
            Building something<br />that might matter.
          </p>
          <p style={{ ...mono, marginTop: 16, fontSize: '0.75rem', color: 'rgba(240,230,216,0.75)', letterSpacing: '0.04em' }}>from a desk in Kolkata.</p>
        </motion.div>
      </div>}

      {/* explore chips — also the accessible way to reach every object */}
      <AnimatePresence>
        {!roam && (explore || focus) && (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ position: 'fixed', right: mobile ? 16 : 'var(--pad)', left: mobile ? 16 : 'auto', bottom: mobile ? 20 : 40, zIndex: 50, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: mobile ? 'center' : 'flex-end', maxWidth: mobile ? 'none' : 520 }}
          >
            {focus && <Chip onClick={() => room.set({ focus: null, folder: -1, side: -1, pin: null })}>← back to the desk</Chip>}
            {(!focus || !mobile) && SPOTS.map(s => (
              <Chip key={s.id} active={focus === s.id} onClick={() => focusOn(s.id)}>{s.label} · {s.hint}</Chip>
            ))}
            {(!focus || !mobile) && <Chip onClick={() => { const on = !room.get().lampOn; room.set({ lampOn: on }); document.documentElement.dataset.theme = on ? 'warm' : 'dark' }}>lamp {lampOn ? 'off' : 'on'}</Chip>}
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">{focus && <FocusPanel key={focus} focus={focus} />}</AnimatePresence>
      <AnimatePresence>
        {photo >= 0 && (
          <motion.div key={'photo' + photo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: mobile ? 90 : 34, zIndex: 55, textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ ...serif, fontSize: '1.6rem', color: '#f6efe4', textShadow: '0 2px 18px rgba(0,0,0,0.7)' }}>{PHOTOS[photo].caption}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <LaptopTerminal />
      <HoverLabel />
      </>}
    </>
  )
}

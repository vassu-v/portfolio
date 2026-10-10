import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createModel as createPhone } from './lib/iphone'
import { prepModel, Hotspot, damp } from './common'
import { bakeStatic } from './bake'
import { room, live, useRoom, wake, dirtyShadows, focusOn } from './store'
import { goToStop } from './tourData'
import { PINGS, ping } from './pings'

const extra = import.meta.glob('./props/stand.js', { eager: true })
const createPhoneStand = extra['./props/stand.js']?.createPhoneStand

const Y = 0.75
const DESK_POS = new THREE.Vector3(0.56, Y + 0.0045, -0.42)
const DESK_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, -0.35, 0, 'YXZ'))
const STAND_POS = [0.5, Y, -0.6]
const STAND_ROT = -0.42

// Contact buttons drawn on the screen; y ranges are canvas pixels (900×1860).
const BUTTONS = [
  { y: 980, label: 'Email me', sub: 'shoryavardhaans2@gmail.com', href: 'mailto:shoryavardhaans2@gmail.com' },
  { y: 1160, label: 'Book a 30-min call', sub: 'cal.com/shoryavardhaan', href: 'https://cal.com/shoryavardhaan/30min?overlayCalendar=true' },
  { y: 1340, label: 'LinkedIn', sub: 'in/shoryavardhaan', href: 'https://www.linkedin.com/in/shoryavardhaan' },
  { y: 1520, label: 'GitHub', sub: 'github.com/vassu-v', href: 'https://github.com/vassu-v' },
]
const BTN_H = 150

function wrapLines(ctx, text, maxW) {
  const out = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w } else line = t
  }
  if (line) out.push(line)
  return out
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r)
}

function drawLock(ctx, w, h, ui) {
  const now = new Date()
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#132430'); g.addColorStop(1, '#0b0907')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.35 + 0.65 * ui.wake
  ctx.textAlign = 'center'
  ctx.fillStyle = '#efe6d8'
  ctx.font = '300 250px "Instrument Serif", serif'
  ctx.fillText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), w / 2, 520)
  ctx.font = '500 42px "JetBrains Mono", monospace'
  ctx.fillStyle = '#8fb0be'
  ctx.fillText(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }), w / 2, 600)
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
  // incoming notification slides down from above the clock
  if (ui.notif > 0.01) {
    const y = 680 - (1 - ui.notif) * 260
    ctx.globalAlpha = ui.notif
    ctx.fillStyle = 'rgba(255,240,220,0.14)'
    rr(ctx, 50, y, w - 100, 260, 54); ctx.fill()
    ctx.fillStyle = '#F07A1A'
    ctx.beginPath(); ctx.arc(130, y + 90, 46, 0, 7); ctx.fill()
    ctx.fillStyle = '#1d1208'; ctx.font = '600 40px "JetBrains Mono", monospace'; ctx.textAlign = 'center'
    ctx.fillText('SG', 130, y + 104); ctx.textAlign = 'left'
    ctx.fillStyle = '#84D0E8'; ctx.font = '600 36px "JetBrains Mono", monospace'; ctx.fillText(ui.msg.app, 200, y + 80)
    ctx.fillStyle = 'rgba(239,230,216,0.55)'; ctx.font = '400 30px "JetBrains Mono", monospace'; ctx.fillText('now', w - 160, y + 80)
    ctx.fillStyle = '#efe6d8'; ctx.font = '400 38px "JetBrains Mono", monospace'
    wrapLines(ctx, ui.msg.text, w - 300).slice(0, 2).forEach((l, i) => ctx.fillText(l, 200, y + 150 + i * 54))
    ctx.globalAlpha = 1
  }
}

function drawCard(ctx, w, h, ui) {
  ctx.globalAlpha = ui.app
  ctx.fillStyle = '#0b1218'; ctx.fillRect(0, 0, w, h)
  const glow = ctx.createRadialGradient(w / 2, 300, 0, w / 2, 300, 600)
  glow.addColorStop(0, 'rgba(240,122,26,0.35)'); glow.addColorStop(1, 'rgba(240,122,26,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#F07A1A'
  ctx.beginPath(); ctx.arc(w / 2, 300, 110, 0, 7); ctx.fill()
  ctx.fillStyle = '#1d1208'; ctx.font = '600 84px "JetBrains Mono", monospace'; ctx.fillText('SG', w / 2, 330)
  ctx.fillStyle = '#f6efe4'; ctx.font = 'italic 300 84px "Instrument Serif", serif'
  ctx.fillText('Want to build', w / 2, 560)
  ctx.fillText('something together?', w / 2, 650)
  ctx.fillStyle = '#8fb0be'; ctx.font = '400 34px "JetBrains Mono", monospace'
  ctx.fillText('Shoryavardhaan · Kolkata', w / 2, 740)
  ctx.textAlign = 'left'
  BUTTONS.forEach((b, i) => {
    const hot = ui.hot === i
    const slide = Math.min(1, Math.max(0, ui.app * 1.6 - 0.25 - i * 0.12))
    const x = 70 + (1 - slide) * 120
    ctx.globalAlpha = ui.app * slide
    ctx.fillStyle = hot ? '#84D0E8' : 'rgba(255,240,220,0.08)'
    rr(ctx, x, b.y, w - 140, BTN_H - 20, 40); ctx.fill()
    ctx.strokeStyle = 'rgba(132,208,232,0.45)'; ctx.lineWidth = 3; rr(ctx, x, b.y, w - 140, BTN_H - 20, 40); ctx.stroke()
    ctx.fillStyle = hot ? '#120d08' : '#f3e9da'; ctx.font = '600 44px "JetBrains Mono", monospace'
    ctx.fillText(b.label, x + 50, b.y + 60)
    ctx.fillStyle = hot ? '#3a2410' : 'rgba(239,230,216,0.55)'; ctx.font = '400 30px "JetBrains Mono", monospace'
    ctx.fillText(b.sub, x + 50, b.y + 104)
    ctx.fillStyle = hot ? '#120d08' : '#84D0E8'; ctx.font = '600 52px "JetBrains Mono", monospace'
    ctx.fillText('→', w - 150 - (1 - slide) * 0, b.y + 82)
  })
  ctx.globalAlpha = ui.app
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(239,230,216,0.4)'; ctx.font = '400 30px "JetBrains Mono", monospace'
  ctx.fillText('or: curl shoryavardhaan.vercel.app', w / 2, 1760)
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}

// Two cards: the 'incoming' invitation, and the big line at the finale
// (the phone screen is too small to carry it on its own).
function cardCanvas(kind) {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = kind === 'invite' ? 300 : 360
  const ctx = c.getContext('2d')
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const draw = () => {
    const H = c.height
    ctx.clearRect(0, 0, 1024, H)
    ctx.fillStyle = 'rgba(22,30,36,0.96)'
    rr(ctx, 6, 6, 1012, H - 12, 64); ctx.fill()
    ctx.strokeStyle = 'rgba(132,208,232,0.7)'; ctx.lineWidth = 4; rr(ctx, 6, 6, 1012, H - 12, 64); ctx.stroke()
    if (kind === 'invite') {
      ctx.fillStyle = '#F07A1A'; ctx.beginPath(); ctx.arc(110, 110, 56, 0, 7); ctx.fill()
      ctx.fillStyle = '#1d1208'; ctx.font = '600 44px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('SG', 110, 126); ctx.textAlign = 'left'
      ctx.fillStyle = '#84D0E8'; ctx.font = '600 40px "JetBrains Mono", monospace'; ctx.fillText('Shorya', 200, 94)
      ctx.fillStyle = 'rgba(239,230,216,0.55)'; ctx.font = '400 32px "JetBrains Mono", monospace'; ctx.fillText('now', 900, 94)
      ctx.fillStyle = '#f6efe4'; ctx.font = 'italic 300 62px "Instrument Serif", serif'
      ctx.fillText('Want to collaborate on', 200, 172)
      ctx.fillText('building something cool?', 200, 240)
    } else {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#F07A1A'; ctx.font = '500 34px "JetBrains Mono", monospace'; ctx.fillText('● SAY HI', 512, 82)
      ctx.fillStyle = '#f6efe4'; ctx.font = 'italic 300 96px "Instrument Serif", serif'
      ctx.fillText('Want to build', 512, 182)
      ctx.fillText('something together?', 512, 276)
      ctx.textAlign = 'left'
    }
    t.needsUpdate = true
  }
  draw(); document.fonts?.ready.then(draw)
  return t
}

// A card popping up out of the phone like the phone ads do: rises off the
// glass, turns to face you, glows. Waits a beat after you arrive.
const CARD_DELAY = 1100
function PopCard({ kind, on, holder }) {
  const ref = useRef()
  const tex = useMemo(() => cardCanvas(kind), [kind])
  const st = useRef({ k: 0, since: 0 })
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), up: new THREE.Vector3(), q: new THREE.Quaternion() }), [])
  const h = kind === 'invite' ? 0.0586 : 0.0703
  useFrame(({ camera, clock, size }, dt) => {
    const g = ref.current, s = st.current
    const now = performance.now()
    if (!on) s.since = 0
    else if (!s.since) s.since = now
    const want = on && now - s.since > CARD_DELAY ? 1 : 0
    s.k = damp(s.k, want, want ? 3 : 6, dt)
    const t = s.k
    g.visible = t > 0.01
    if (on && !want) wake(200)
    if (!g.visible) return
    const e = 1 - Math.pow(1 - t, 3)
    // from the phone's glass, up and towards the camera
    holder.current.getWorldPosition(tmp.p)
    holder.current.getWorldQuaternion(tmp.q)
    tmp.up.copy(camera.position).sub(tmp.p).normalize()
    g.position.copy(tmp.p).addScaledVector(tmp.up, 0.06 * e)
    g.position.y += (kind === 'invite' ? 0.11 : 0.12) * e + Math.sin(clock.elapsedTime * 1.6) * 0.003 * e
    g.quaternion.slerpQuaternions(tmp.q, camera.quaternion, Math.min(1, e * 1.2))
    // phones see the desk from further back — a bigger card to stay readable
    const big = size.width / size.height < 1 ? 1.9 : 1
    g.scale.setScalar((0.25 + 0.75 * e) * big)
    if (big > 1) g.position.x -= 0.1 * e
    g.children[0].material.opacity = Math.min(1, t * 1.5)
    if (t > 0.01 && t < 0.99) wake(100)
  })
  return (
    <group ref={ref} visible={false}>
      <mesh renderOrder={3}>
        <planeGeometry args={[0.2, h]} />
        <meshStandardMaterial color="#000" map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.6} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function Phone() {
  const focus = useRoom(s => s.focus)
  const explore = useRoom(s => s.explore)
  const tourStop = useRoom(s => s.tourStop)
  // the tour's finale stands the phone up with the contact card on screen
  const finale = !focus && tourStop === 'finale'
  // the stop before it: the phone lights up flat on the desk and the
  // message pops out of it in 3D (NotifCard)
  const incoming = !focus && tourStop === 'ping'
  // once it has been stood up it stays on the stand — no flopping back down
  const [stood, setStood] = useState(false)
  if (finale && !stood) setStood(true)
  const focused = focus === 'phone' || finale || stood
  const holder = useRef()
  const glow = useRef()
  // screen UI state, read by the canvas draw callback outside React's render
  const ui = useMemo(() => ({ current: { notif: 0, wake: 0, app: 0, hot: -1, dirty: true, buzz: 0, minute: -1, pingId: 0, msg: PINGS[0] } }), [])

  const model = useMemo(() => {
    const m = prepModel(createPhone())
    m.rotation.set(0, 0, 0)
    m.userData.display((ctx, w, h) => {
      drawLock(ctx, w, h, ui.current)
      if (ui.current.app > 0.01) drawCard(ctx, w, h, ui.current)
    })
    return bakeStatic(m, { keep: [m.userData.parts.screen] })
  }, [])

  const stand = useMemo(() => (createPhoneStand ? prepModel(createPhoneStand()) : null), [])
  const standPose = useMemo(() => {
    const g = new THREE.Group()
    g.position.set(...STAND_POS)
    g.rotation.y = STAND_ROT
    g.updateMatrixWorld(true)
    const c = stand?.userData.cradle
    const pos = c ? c.position.clone().applyMatrix4(g.matrixWorld) : new THREE.Vector3(STAND_POS[0], Y + 0.08, STAND_POS[2])
    const q = g.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(c ? c.rotation : new THREE.Euler(-0.3, 0, 0)))
    return { pos, q }
  }, [stand])

  // notifications land now and then, alternating phone / laptop — the first
  // one on the phone shortly after the visitor steps into the room
  useEffect(() => {
    if (!explore) return
    let id
    const next = first => {
      id = setTimeout(() => {
        const s = room.get()
        if (s.focus !== 'phone' && s.focus !== 'laptop' && s.tourStop !== 'ping' && s.tourStop !== 'finale') ping(first ? 'phone' : undefined)
        next(false)
      }, first ? 1400 : 16000 + Math.random() * 14000)
    }
    next(true)
    return () => clearTimeout(id)
  }, [explore])

  // arriving at the incoming stop: the invitation lands, with a buzz
  useEffect(() => {
    if (!incoming) { if (live.ping?.id === -2) live.ping = null; return }
    // arrive first, then the message lands
    const id = setTimeout(() => { live.ping = { ...PINGS[0], until: performance.now() + 60000, id: -2 }; wake(1500) }, CARD_DELAY)
    return () => clearTimeout(id)
  }, [incoming])

  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Quaternion() }), [])
  useFrame(({ clock }, dt) => {
    const u = ui.current
    const now = performance.now()
    const p = live.ping
    if (p && p.where === 'phone' && p.id !== u.pingId) { u.pingId = p.id; u.msg = p; u.buzz = 1; u.dirty = true }
    const notifOn = focused || (p?.where === 'phone' && now < p.until)
    if (focused && u.msg !== PINGS[0]) { u.msg = PINGS[0]; u.dirty = true }
    const before = u.notif + u.wake + u.app
    u.notif = damp(u.notif, notifOn ? 1 : 0, 6, dt)
    u.wake = damp(u.wake, notifOn || focused ? 1 : 0, 5, dt)
    u.app = damp(u.app, focused ? 1 : 0, 3.2, dt)
    const minute = new Date().getMinutes()
    if (Math.abs(u.notif + u.wake + u.app - before) > 0.0005 || u.dirty || minute !== u.minute) {
      u.dirty = false
      u.minute = minute
      model.userData.update(clock.elapsedTime)
      model.position.set(0, 0, 0)
      model.rotation.set(0, 0, 0)
    }

    // the screen throws a little light on the desk when it wakes
    if (glow.current) glow.current.intensity = 0.12 * u.wake + 0.1 * u.notif * (focused ? 0 : 1)
    const h = holder.current
    h.userData.k = damp(h.userData.k ?? 0, focused ? 1 : 0, 3.6, dt)
    const k = h.userData.k
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
    tmp.p.lerpVectors(DESK_POS, standPose.pos, e)
    tmp.p.y += Math.sin(e * Math.PI) * 0.12
    tmp.q.slerpQuaternions(DESK_QUAT, standPose.q, e)
    h.position.copy(tmp.p)
    h.quaternion.copy(tmp.q)
    if (k > 0.002 && k < 0.998) dirtyShadows(2)
    // vibrate on the desk when a message lands
    if (u.buzz > 0.01 && !focused) {
      u.buzz = Math.max(0, u.buzz - dt * 1.4)
      const on = Math.sin(clock.elapsedTime * 90) * (Math.floor(u.buzz * 6) % 2 ? 1 : 0)
      h.rotateZ(on * 0.02 * u.buzz)
      h.position.x += on * 0.0012 * u.buzz
    }
  })

  const screen = model.userData.parts.screen
  const hitButton = e => {
    // the glass layer sits in front of the screen — look through it for the UV
    // buttons only once you're looking at the phone up close
    const hit = focus === 'phone' && e.intersections?.find(i => i.object === screen)
    if (!hit?.uv) return -1
    const y = (1 - hit.uv.y) * 1860
    return BUTTONS.findIndex(b => y >= b.y && y <= b.y + BTN_H - 20)
  }

  return (
    <>
      {stand && <primitive object={stand} position={STAND_POS} rotation={[0, STAND_ROT, 0]} />}
      <PopCard kind="invite" on={incoming} holder={holder} />
      <PopCard kind="hello" on={finale} holder={holder} />
      <group ref={holder}>
        <Hotspot id="phone" label={focus === 'phone' ? 'tap a button' : focused ? 'pick up the phone' : 'Phone — 1 new message'} onClick={e => {
          // first click brings you to the phone (or the phone to you); only
          // then are its buttons live
          if (!focused) return goToStop('finale')
          if (focus !== 'phone') return focusOn('phone')
          const i = hitButton(e)
          if (i >= 0) window.open(BUTTONS[i].href, BUTTONS[i].href.startsWith('mailto') ? '_self' : '_blank', 'noopener')
        }}>
          <group onPointerMove={e => {
            const i = hitButton(e)
            if (i !== ui.current.hot) {
              ui.current.hot = i
              ui.current.dirty = true
              wake(300)
              room.set({ hover: i >= 0 ? { id: 'btn', label: BUTTONS[i].label } : null })
            }
          }}>
            <primitive object={model} scale={0.053} />
            <pointLight ref={glow} position={[0, 0.03, 0]} color="#9fdcf0" distance={0.5} decay={2} intensity={0} />
          </group>
        </Hotspot>
      </group>
    </>
  )
}


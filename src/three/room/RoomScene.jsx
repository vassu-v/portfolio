import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, OrbitControls } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, ToneMapping, SMAA, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import * as THREE from 'three'
import Room, { LEFT, WIN } from './Room'
import Desk from './Desk'
import Props from './Props'
import Corkboard from './Corkboard'
import Diary from './Diary'
import Dossier from './Dossier'
import Phone from './Phone'
import DeskPhotos from './DeskPhotos'
import Extras from './Extras'
import PaperBalls from './PaperBalls'
import IntroPhoto from './IntroPhoto'
import CameraRig from './CameraRig'
import PerfProbe from './PerfProbe'
import { sky as skyAt } from './timeOfDay'
import { room, live, useRoom, wake, off, closeLayer, dirtyShadows } from './store'
import { TIERS, downgrade, rememberTier, dprFor } from './tier'

RectAreaLightUniformsLib.init()
const LVH = typeof CSS !== 'undefined' && CSS.supports?.('height', '100lvh') ? '100lvh' : '100vh'

// Sun (or moon) through the window — the main shadow caster. Its frustum is
// fitted to the room so the window frame lands on the desk and wall.
function Sun({ sky, mapSize }) {
  const ref = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const lampOn = useRoom(s => s.lampOn)
  const shut = useRoom(s => s.curtains)
  const dim = useRef(1)
  useEffect(() => {
    target.position.set(0, 0.6, -0.3)
    ref.current.target = target
    ref.current.shadow.camera.layers.enable(1)
  }, [target])
  useFrame((_, dt) => {
    const l = ref.current
    l.position.copy(target.position).addScaledVector(sky.dir, -7)
    l.color.copy(sky.sunColor)
    // drawn curtains let a little through the cloth
    dim.current = THREE.MathUtils.damp(dim.current, shut ? 0.18 : 1, 3.5, dt)
    l.intensity = sky.sun * (lampOn && sky.night ? 0.85 : 1) * dim.current
  })
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        castShadow={!off.has('shadow')}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={off.has('r1') ? 1 : off.has('r2') ? 2 : 4}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />
    </>
  )
}

// Image-based light from emissive cards (window panel in the sky colour,
// soft ceiling/wall bounce). Re-rendered only when time or lamp changes.
function Env({ sky, lampOn }) {
  const winZ = (WIN.z0 + WIN.z1) / 2
  const key = `${sky.hour.toFixed(1)}-${lampOn}`
  return (
    <Environment key={key} resolution={64} frames={1} environmentIntensity={0.9}>
      <color attach="background" args={['#0d0b09']} />
      <Lightformer form="rect" intensity={1.2 + sky.amb * 5} color={sky.skyBot} position={[LEFT - 0.2, 1.55, winZ]} rotation={[0, Math.PI / 2, 0]} scale={[1.2, 1.2, 1]} />
      <Lightformer form="rect" intensity={0.25 + sky.amb * 1.5} color="#f1e4d0" position={[0.5, 2.6, 0.8]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 3, 1]} />
      <Lightformer form="rect" intensity={0.2 + sky.amb} color="#d8cbb8" position={[2.5, 1.3, 0.8]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 2, 1]} />
      {lampOn && <Lightformer form="circle" intensity={3} color="#ffcf94" position={[0.45, 1.15, -0.8]} scale={0.3} />}
    </Environment>
  )
}

function Dust({ sky }) {
  if (!sky.day || sky.sun < 1) return null
  return <Sparkles count={36} scale={[0.9, 1.0, 1.1]} position={[-1.15, 1.35, -0.15]} size={0.7} speed={0.12} opacity={0.18} color={sky.sunColor} noise={0.5} />
}

// The scene is mostly still, so it isn't re-rendered blindly 60×/s:
//  · full rate while anything moves (scroll, pointer, camera easing, focus
//    transitions — anything that calls wake()),
//  · otherwise an idle cap that just keeps steam/dust/blink alive.
// Shadow maps only re-render when something that casts one actually moved.
function Driver({ idleFps }) {
  const { gl, invalidate } = useThree()
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    let raf, last = 0
    const loop = now => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      if (now < live.activeUntil || live.shadowFrames > 0 || now - last >= 1000 / idleFps) {
        last = now
        invalidate()
      }
    }
    raf = requestAnimationFrame(loop)
    const poke = () => wake(900)
    window.addEventListener('scroll', poke, { passive: true })
    window.addEventListener('pointermove', poke, { passive: true })
    window.addEventListener('pointerdown', poke, { passive: true })
    window.addEventListener('wheel', poke, { passive: true })
    window.addEventListener('resize', poke)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', poke)
      window.removeEventListener('pointermove', poke)
      window.removeEventListener('pointerdown', poke)
      window.removeEventListener('wheel', poke)
      window.removeEventListener('resize', poke)
      gl.shadowMap.autoUpdate = true
    }
  }, [gl, invalidate, idleFps])

  useFrame(() => {
    if (live.shadowFrames > 0) {
      gl.shadowMap.needsUpdate = true
      live.shadowFrames--
    }
  })
  return null
}

// Watches real frame times once the intro has settled; if this device can't
// hold the tier it was given, step down once and remember it for next visit.
// Only back-to-back frames count (frameloop is on demand, so the gap after an
// idle spell says nothing about the GPU), and the first seconds are skipped —
// that's shader compiles and texture uploads, which made capable laptops look
// slow and wrongly offered them the CLI.
function TierProbe() {
  const tier = useRoom(s => s.tier)
  const samples = useRef([])
  const done = useRef(false)
  const started = useRef(0)
  const lastActive = useRef(false)
  useEffect(() => { samples.current = []; done.current = false; started.current = 0 }, [tier])
  useFrame((_, dt) => {
    const now = performance.now()
    const active = now < live.activeUntil
    const consecutive = active && lastActive.current
    lastActive.current = active
    if (done.current || live.intro < 1 || !consecutive || dt > 0.5) return
    if (!started.current) started.current = now
    if (now - started.current < 2500) return
    samples.current.push(dt)
    // decide after 120 frames, or after 6 s of watching on a device too slow
    // to ever reach 120 (at 3 fps that would take 40 s)
    if (samples.current.length < 120 && !(samples.current.length >= 15 && now - started.current > 2500 + 6000)) return
    done.current = true
    const s = [...samples.current].sort((a, b) => a - b)
    const fps = 1 / s[Math.floor(s.length / 2)]
    const floor = tier === 'high' ? 40 : tier === 'mid' ? 26 : 22
    // the "try CLI mode" nudge is for genuinely struggling devices only
    const roomy = (navigator.deviceMemory || 0) >= 8 || (navigator.hardwareConcurrency || 0) >= 8
    // low tier still crawling: below ~8 fps is a machine the room can't
    // serve — the CLI is offered properly (a prompt, CLI first); below the
    // softer line it's just the small "running slow?" nudge
    if (tier === 'low' && fps < 8) room.set({ struggling: 'severe', measuredFps: Math.round(fps) })
    else if (tier === 'low' && fps < (roomy ? 10 : 16)) room.set({ struggling: 'mild', measuredFps: Math.round(fps) })
    if (fps < floor && tier !== 'low') {
      const next = downgrade(tier)
      room.set({ tier: next, tierReason: `measured ${Math.round(fps)} fps on ${tier}` })
      rememberTier(next)
    } else {
      rememberTier(tier)
    }
  })
  return null
}

// Free-orbit inspection: walls between the camera and the desk fade out so
// you can walk all the way around the setup like a dollhouse.
function Roam() {
  const { camera, scene, size } = useThree()
  const walls = useRef([])
  useEffect(() => {
    camera.position.set(2.6, 2.1, 2.8)
    const list = []
    scene.traverse(o => { if (o.userData.wall) list.push(o) })
    walls.current = list
    return () => list.forEach(w => w.layers.set(0))
  }, [camera, scene])
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const fov = size.width / size.height < 0.8 ? 62 : 42
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    for (const w of walls.current) {
      const { normal, center } = w.userData.wall
      v.copy(camera.position).sub(center)
      // layer 1 = invisible to the camera but still seen by shadow cameras,
      // so the room keeps its daylight while a wall is cut away
      w.layers.set(v.dot(normal) > 0 ? 0 : 1)
    }
  })
  return (
    <OrbitControls
      makeDefault
      target={[0.05, 0.85, -0.55]}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.35}
      maxDistance={6}
      maxPolarAngle={Math.PI * 0.495}
      onChange={() => wake(600)}
    />
  )
}

function Post({ cfg }) {
  if (!cfg.post) return null
  return cfg.ao ? (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={0.35} intensity={2.4} distanceFalloff={0.6} color="#1a120c" quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.35} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.45} />
      <SMAA />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.3} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.45} />
      <SMAA />
    </EffectComposer>
  )
}

// With no composer, tone-map in the renderer itself so the look stays close.
function RendererTone({ post }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = post ? THREE.NoToneMapping : THREE.AgXToneMapping
    gl.toneMappingExposure = 1
  }, [gl, post])
  return null
}

function SceneContent() {
  const hour = useRoom(s => s.hour)
  const lampOn = useRoom(s => s.lampOn)
  const tier = useRoom(s => s.tier)
  const roam = useRoom(s => s.roam)
  const debug = useRoom(s => s.debug)
  const cfg = TIERS[tier] || TIERS.low
  const sky = useMemo(() => skyAt(hour), [hour])
  // Phones skip the image-based environment light: building it (PMREM blur)
  // compiles shaders that can't be done in the background — a multi-second
  // freeze on load — and sampling it costs every pixel. A sky/floor
  // hemisphere light stands in for the soft bounce.
  const env = cfg.post && !off.has('env')
  // Built in stages, a frame apart, so no single step locks the page (the
  // loading screen's CLI link has to stay clickable). The scene stays hidden
  // until Warmup has compiled everything (see there).
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (stage >= 3) return
    const id = setTimeout(() => setStage(stage + 1), 30)
    return () => clearTimeout(id)
  }, [stage])

  return (
    <>
      <RendererTone post={cfg.post && !off.has('post')} />
      {env ? <Env sky={sky} lampOn={lampOn} /> : <hemisphereLight args={['#f1e4d0', '#3a2a1c', 0.5 + sky.amb * 1.4]} />}
      <Sun key={`sun-${cfg.sunMap}`} sky={sky} mapSize={cfg.sunMap} />
      <Room sky={sky} sway={false} />
      <Desk />
      {stage >= 1 && <Props tier={tier} />}
      {stage >= 2 && <><Corkboard /><Diary /><Dossier /><Phone /></>}
      {stage >= 3 && <><DeskPhotos /><Extras /><PaperBalls />{!roam && <IntroPhoto />}</>}
      {cfg.dust && <Dust sky={sky} />}
      {roam ? <Roam /> : stage >= 1 && <CameraRig />}
      <Driver idleFps={cfg.idleFps} />
      {!roam && !/[?&]tier=/.test(window.location.search) && <TierProbe />}
      <Warmup post={cfg.post && !off.has('post')} env={env} ready={stage >= 3} />
      {(debug || roam) && <PerfProbe selfRender={!(cfg.post && !off.has('post'))} />}
      {!off.has('post') && <Post key={tier} cfg={cfg} />}
    </>
  )
}

// Compile every shader up front, in the background, before the room is
// first drawn. On Windows each shader goes through DirectX translation
// (~0.3 s apiece); compiled lazily, they froze the page — at the first frame
// (one 12 s block, during which the loading screen's "switch to CLI mode"
// and C key did nothing) and again mid-scroll on phones. compileAsync hands
// the work to the GPU process (KHR_parallel_shader_compile) without blocking.
function Warmup({ post, env, ready }) {
  const { gl, scene, camera } = useThree()
  const done = useRef(false)
  useEffect(() => {
    // once per canvas: a later change (a quality drop turning post-processing
    // off) must never hide the scene again mid-visit — it read as a black screen
    if (done.current) return
    if (!room.get().debug) gl.debug.checkShaderErrors = false
    else window.__gl = gl
    scene.visible = false
    if (!ready) return
    done.current = true
    let cancelled = false, raf
    const t0 = performance.now()
    // everything hidden (except lights — the light count is part of every
    // shader, and the switched-off library lights must stay off) is shown
    // just for the compile call, so its shaders are included
    const reveal = () => {
      const hidden = []
      scene.traverse(o => { if (!o.visible && !o.isLight) { hidden.push(o); o.visible = true } })
      return () => hidden.forEach(o => { o.visible = false })
    }
    const run = async () => {
      // the scene stays hidden until it's done, so no frame compiles on the spot
      scene.visible = true
      let hide = reveal()
      // with post-processing the scene is drawn into a (linear, untonemapped)
      // buffer, not the screen — compile for that, or every shader differs
      const target = post ? new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }) : null
      const prev = gl.getRenderTarget()
      gl.setRenderTarget(target)
      const done = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera))
      gl.setRenderTarget(prev)
      hide()
      scene.visible = false
      await Promise.race([done.catch(() => {}), new Promise(r => setTimeout(r, 15000))])
      target?.dispose()
      scene.visible = true
      dirtyShadows(2)
      wake(300)
      window.__roomWarm = true
      window.dispatchEvent(new Event('room-warm'))
    }
    // wait for the environment map (it changes every lit material's shader)
    const wait = () => {
      if (cancelled) return
      if (env && !scene.environment && performance.now() - t0 < 4000) { raf = requestAnimationFrame(wait); return }
      run()
    }
    raf = requestAnimationFrame(wait)
    return () => { cancelled = true; cancelAnimationFrame(raf); scene.visible = true }
  }, [gl, scene, camera, post, env, ready])
  return null
}

export default function RoomScene() {
  const tier = useRoom(s => s.tier)
  const cfg = TIERS[tier] || TIERS.low
  // only a width change re-plans resolution: on phones the address bar
  // sliding in/out changes the height on every scroll direction change
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setWidth(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const dpr = useMemo(() => dprFor(cfg, width), [cfg, width])

  useEffect(() => {
    const onMove = e => {
      live.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      live.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    const id = setInterval(() => {
      if (!new URLSearchParams(window.location.search).has('hour')) room.set({ hour: new Date().getHours() + new Date().getMinutes() / 60 })
    }, 60000)
    return () => { window.removeEventListener('pointermove', onMove); clearInterval(id) }
  }, [])

  // If the GPU drops the WebGL context (phones do this under memory
  // pressure) the canvas just goes black. Show the still of the room
  // instead, then rebuild the 3D — on the browser's restore event, or with a
  // fresh context if that never comes.
  const [gen, setGen] = useState(0)
  const [lost, setLost] = useState(false)
  const onCreated = ({ gl }) => {
    const el = gl.domElement
    let timer
    // the still stays up until the rebuilt room has compiled (room-warm)
    const rebuild = () => {
      clearTimeout(timer)
      const back = () => setLost(false)
      window.addEventListener('room-warm', back, { once: true })
      setTimeout(back, 8000)
      setGen(g => g + 1)
    }
    el.addEventListener('webglcontextlost', e => {
      e.preventDefault()
      setLost(true)
      timer = setTimeout(rebuild, 2500)
    })
    el.addEventListener('webglcontextrestored', rebuild)
  }

  return (
    <>
    {lost && <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 1, background: `#0b0907 url(${window.innerWidth < window.innerHeight ? '/room-poster-portrait.jpg' : '/room-poster.jpg'}) center / cover no-repeat` }} />}
    <Canvas
      // a quality change no longer rebuilds the canvas (that hid the room for
      // seconds, mid-scroll); only a lost GPU context does
      key={gen}
      onCreated={onCreated}
      // 'percentage' (PCF), stated explicitly: `true` asks for PCFSoft, which
      // three swaps for PCF at draw time — but not when pre-compiling, so
      // every shadowed shader got compiled twice (once as each)
      shadows={off.has('vsm') ? 'variance' : off.has('basic') ? 'basic' : 'percentage'}
      flat
      frameloop="demand"
      dpr={dpr}
      gl={{ antialias: !cfg.post, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [1, 1.25, 0.9], fov: 36, near: 0.01, far: 40 }}
      // sized to the *large* viewport (address bar hidden) so the canvas
      // never reallocates as the bar slides in and out on phones
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: LVH, zIndex: 0, touchAction: room.get().roam ? 'none' : 'auto' }}
      onPointerMissed={closeLayer}
    >
      <SceneContent />
    </Canvas>
    </>
  )
}

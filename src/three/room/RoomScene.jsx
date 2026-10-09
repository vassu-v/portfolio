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
import CameraRig from './CameraRig'
import PerfProbe from './PerfProbe'
import { sky as skyAt } from './timeOfDay'
import { room, live, useRoom, wake, off } from './store'
import { TIERS, downgrade, rememberTier, dprFor } from './tier'

RectAreaLightUniformsLib.init()

// Sun (or moon) through the window — the main shadow caster. Its frustum is
// fitted to the room so the window frame lands on the desk and wall.
function Sun({ sky, mapSize }) {
  const ref = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const lampOn = useRoom(s => s.lampOn)
  useEffect(() => {
    target.position.set(0, 0.6, -0.3)
    ref.current.target = target
    ref.current.shadow.camera.layers.enable(1)
  }, [target])
  useFrame(() => {
    const l = ref.current
    l.position.copy(target.position).addScaledVector(sky.dir, -7)
    l.color.copy(sky.sunColor)
    l.intensity = sky.sun * (lampOn && sky.night ? 0.85 : 1)
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
function TierProbe() {
  const tier = useRoom(s => s.tier)
  const samples = useRef([])
  const done = useRef(false)
  useEffect(() => { samples.current = []; done.current = false }, [tier])
  useFrame((_, dt) => {
    if (done.current || live.intro < 1 || performance.now() > live.activeUntil) return
    samples.current.push(dt)
    if (samples.current.length < 90) return
    done.current = true
    const s = [...samples.current].sort((a, b) => a - b)
    const fps = 1 / s[Math.floor(s.length / 2)]
    const floor = tier === 'high' ? 45 : tier === 'mid' ? 32 : 22
    if (fps < 20 && tier === 'low') room.set({ struggling: true })
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

  return (
    <>
      <RendererTone post={cfg.post && !off.has('post')} />
      {!off.has('env') && <Env sky={sky} lampOn={lampOn} />}
      <Sun key={`sun-${cfg.sunMap}`} sky={sky} mapSize={cfg.sunMap} />
      <Room sky={sky} sway={false} />
      <Desk />
      <Props tier={tier} />
      <Corkboard />
      <Diary />
      <Dossier />
      <Phone />
      <DeskPhotos />
      <Extras />
      {cfg.dust && <Dust sky={sky} />}
      {roam ? <Roam /> : <CameraRig />}
      <Driver idleFps={cfg.idleFps} />
      {!roam && !/[?&]tier=/.test(window.location.search) && <TierProbe />}
      {(debug || roam) && <PerfProbe selfRender={!(cfg.post && !off.has('post'))} />}
      {!off.has('post') && <Post key={tier} cfg={cfg} />}
    </>
  )
}

export default function RoomScene() {
  const tier = useRoom(s => s.tier)
  const cfg = TIERS[tier] || TIERS.low
  const [dpr, setDpr] = useState(() => dprFor(cfg))
  useEffect(() => {
    const on = () => setDpr(dprFor(cfg))
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [cfg])

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

  return (
    <Canvas
      key={tier}
      shadows={off.has('vsm') ? 'variance' : off.has('basic') ? 'basic' : true}
      flat
      frameloop="demand"
      dpr={dpr}
      gl={{ antialias: !cfg.post, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [1, 1.25, 0.9], fov: 36, near: 0.01, far: 40 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0, touchAction: room.get().roam ? 'none' : 'auto' }}
      // clicking empty space closes one layer at a time: a held photo or
      // pulled-out card first, then the object itself
      onPointerMissed={() => {
        const s = room.get()
        if (s.photo >= 0) room.set({ photo: -1 })
        else if (s.folder >= 0 || s.pin || s.side >= 0) room.set({ folder: -1, pin: null, side: -1 })
        else if (s.focus) room.set({ focus: null })
      }}
    >
      <SceneContent />
    </Canvas>
  )
}

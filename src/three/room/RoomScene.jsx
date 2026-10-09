import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, ToneMapping, SMAA, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import * as THREE from 'three'
import Room, { LEFT, WIN } from './Room'
import Desk from './Desk'
import Props from './Props'
import Corkboard from './Corkboard'
import CameraRig from './CameraRig'
import { sky as skyAt } from './timeOfDay'
import { room, live, useRoom } from './store'

RectAreaLightUniformsLib.init()

const lowTier = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4)

// Sun (or moon) through the window. The only big shadow caster; its shadow
// frustum is fitted to the room so the window frame and mullions land on the
// desk and floor as a crisp-but-soft light patch.
function Sun({ sky }) {
  const ref = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const lampOn = useRoom(s => s.lampOn)
  useEffect(() => {
    target.position.set(0, 0.6, -0.3)
    ref.current.target = target
  }, [target])
  useFrame(() => {
    const l = ref.current
    l.position.copy(target.position).addScaledVector(sky.dir, -7)
    l.color.copy(sky.sunColor)
    // a lit lamp makes the eye adapt — the window reads a touch dimmer
    l.intensity = sky.sun * (lampOn && sky.night ? 0.85 : 1)
  })
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={ref}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
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

// Image-based light built from emissive cards: a big window panel in the sky
// colour plus a faint warm ceiling bounce. Rendered once per lighting state.
function Env({ sky, lampOn }) {
  const winZ = (WIN.z0 + WIN.z1) / 2
  const key = `${sky.hour.toFixed(1)}-${lampOn}`
  return (
    <Environment key={key} resolution={128} frames={1} environmentIntensity={0.9}>
      <color attach="background" args={['#0d0b09']} />
      <Lightformer form="rect" intensity={1.2 + sky.amb * 5} color={sky.skyBot} position={[LEFT - 0.2, 1.55, winZ]} rotation={[0, Math.PI / 2, 0]} scale={[1.2, 1.2, 1]} />
      <Lightformer form="rect" intensity={0.25 + sky.amb * 1.5} color="#f1e4d0" position={[0.5, 2.6, 0.8]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 3, 1]} />
      <Lightformer form="rect" intensity={0.2 + sky.amb} color="#d8cbb8" position={[2.5, 1.3, 0.8]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 2, 1]} />
      {lampOn && <Lightformer form="circle" intensity={3} color="#ffcf94" position={[0.45, 1.15, -0.8]} scale={0.3} />}
    </Environment>
  )
}

// Dust motes drifting in the light by the window, daytime only.
function Dust({ sky }) {
  if (!sky.day || sky.sun < 1) return null
  return <Sparkles count={36} scale={[0.9, 1.0, 1.1]} position={[-1.15, 1.35, -0.15]} size={0.7} speed={0.12} opacity={0.18} color={sky.sunColor} noise={0.5} />
}

function SceneContent({ tier }) {
  const hour = useRoom(s => s.hour)
  const lampOn = useRoom(s => s.lampOn)
  const sky = useMemo(() => skyAt(hour), [hour])

  return (
    <>
      <Env sky={sky} lampOn={lampOn} />
      <Sun sky={sky} />
      <Room sky={sky} />
      <Desk />
      <Props />
      <Corkboard />
      <Dust sky={sky} />
      <CameraRig />
      {tier === 'low' ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.35} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={0.35} intensity={2.4} distanceFalloff={0.6} color="#1a120c" quality={tier === 'high' ? 'medium' : 'performance'} halfRes />
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.35} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  )
}

export default function RoomScene() {
  const [tier, setTier] = useState(() => (lowTier() ? 'low' : 'high'))
  const [dpr] = useState(() => (lowTier() ? 1 : Math.min(1.5, window.devicePixelRatio || 1)))

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
      shadows
      flat
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ position: [1, 1.25, 0.9], fov: 36, near: 0.01, far: 40 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      onPointerMissed={() => { if (room.get().focus) room.set({ folder: -1, card: -1 }) }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => { if (!document.hidden) setTier(t => (t === 'high' ? 'mid' : t)) }}
      />
      <SceneContent tier={tier} />
    </Canvas>
  )
}

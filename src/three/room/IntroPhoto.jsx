import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { live } from './store'
import { PHOTO } from './CameraRig'
import { TOUR } from './tourData'

// The tour's opening shot. A spotlight on the framed photo; the cut-out of
// the same photo standing proud of the frame; and the name set *behind* the
// cut-out, magazine-cover style. The first bit of scroll dissolves the name
// into drifting particles (sampled from the same lettering), then slides
// the cut-out back into the frame, leaving the real framed print.
const SIZE = 0.145
const NAME_W = 0.47
const CW = 2048, CH = 420

// deterministic scatter, so the dissolve looks the same every visit
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x) }

function drawName(ctx) {
  ctx.clearRect(0, 0, CW, CH)
  ctx.fillStyle = '#f6efe4'
  let px = 300
  ctx.font = `italic 300 ${px}px "Instrument Serif", serif`
  let w = ctx.measureText('Shoryavardhaan').width
  if (w > CW - 80) { px = Math.floor(px * (CW - 80) / w); ctx.font = `italic 300 ${px}px "Instrument Serif", serif`; w = ctx.measureText('Shoryavardhaan').width }
  ctx.textAlign = 'center'
  ctx.fillText('Shoryavardhaan', CW / 2, 330)
  // the kicker sits over the first letters, clear of the head
  ctx.textAlign = 'left'
  ctx.fillStyle = '#84D0E8'
  ctx.font = '500 40px "JetBrains Mono", monospace'
  ctx.fillText('HELLO, I\'M', (CW - w) / 2 + 24, 96)
}

export default function IntroPhoto() {
  const { size } = useThree()
  const plane = useRef()
  const spot = useRef()
  const nameGroup = useRef()
  const crisp = useRef()
  const dots = useRef()

  const tex = useMemo(() => {
    const t = new THREE.TextureLoader().load('/me-cutout.webp')
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.copy(PHOTO.center)
    return o
  }, [])
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), PHOTO.normal), [])

  // the lettering: a crisp canvas texture at rest, and the particle cloud
  // (sampled from the same canvas) that takes over once it starts to go
  const name = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CW; c.height = CH
    const ctx = c.getContext('2d', { willReadFrequently: true })
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const geo = new THREE.BufferGeometry()
    const k = NAME_W / CW
    const step = 4
    const build = () => {
      drawName(ctx)
      texture.needsUpdate = true
      const data = ctx.getImageData(0, 0, CW, CH).data
      const base = [], col = [], seed = []
      let r = 1
      for (let y = 0; y < CH; y += step) {
        for (let x = 0; x < CW; x += step) {
          const i = (y * CW + x) * 4
          if (data[i + 3] < 120) continue
          base.push((x - CW / 2) * k, -(y - CH / 2) * k, 0)
          col.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, 1)
          // delay sweeps left → right; drift up, right and out towards you
          seed.push(x / CW * 0.5 + rnd(r++) * 0.14, 0.04 + rnd(r++) * 0.16, 0.02 + rnd(r++) * 0.14, (rnd(r++) - 0.2) * 0.12)
        }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3))
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
      geo.userData = { base: new Float32Array(base), seed: new Float32Array(seed), last: -1 }
    }
    build()
    return { texture, geo, build, dot: step * k * 1.15 }
  }, [])
  useEffect(() => {
    document.fonts?.load('italic 300 300px "Instrument Serif"').catch(() => {}).then(() => name.build())
  }, [name])

  useFrame(() => {
    const u = live.scroll * (TOUR.length - 1)
    const d = THREE.MathUtils.smoothstep(u, 0.005, 0.3)
    const lift = THREE.MathUtils.smoothstep(u, 0.2, 0.5)
    const fadeIn = Math.min(1, live.intro * 1.4)

    const p = plane.current
    p.visible = lift < 0.999
    p.position.copy(PHOTO.center).addScaledVector(PHOTO.normal, 0.05 * (1 - lift) + 0.012)
    p.position.y += 0.012 * (1 - lift)
    p.scale.setScalar(1 - 0.3 * lift)
    p.material.opacity = 1 - lift
    spot.current.intensity = 0.4 + 2.2 * (1 - lift) * fadeIn

    // name: behind the cut-out, a touch in front of the frame, at neck
    // height where the cut-out is narrowest
    const g = nameGroup.current
    g.visible = d < 0.999
    g.position.copy(PHOTO.center).addScaledVector(PHOTO.normal, 0.03)
    g.position.y -= 0.036
    g.scale.setScalar(size.width / size.height < 1 ? 0.66 : 1)
    crisp.current.visible = d < 0.002
    crisp.current.material.opacity = fadeIn
    dots.current.visible = d >= 0.002
    const geo = name.geo, ud = geo.userData
    if (dots.current.visible && geo.attributes.position && Math.abs(ud.last - d) > 0.0005) {
      ud.last = d
      const pos = geo.attributes.position.array, colr = geo.attributes.color.array, s = ud.seed
      for (let i = 0, n = pos.length / 3; i < n; i++) {
        const j = i * 4
        const t = THREE.MathUtils.clamp((d - s[j]) / 0.36, 0, 1)
        const e = t * t
        pos[i * 3] = ud.base[i * 3] + s[j + 1] * e * 1.4 + Math.sin(i + t * 6) * 0.004 * t
        pos[i * 3 + 1] = ud.base[i * 3 + 1] + s[j + 2] * e
        pos[i * 3 + 2] = s[j + 3] * e + 0.05 * e
        colr[j + 3] = 1 - t
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
    }
  })

  return (
    <>
      <primitive object={target} />
      <spotLight ref={spot} target={target} position={PHOTO.center.clone().add(new THREE.Vector3(0.05, 0.45, 0.42))}
        color="#fff0dc" angle={0.34} penumbra={0.75} decay={2} distance={2} />
      <group ref={nameGroup} quaternion={quat}>
        <mesh ref={crisp} renderOrder={1}>
          <planeGeometry args={[NAME_W, NAME_W * CH / CW]} />
          <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={name.texture} emissiveIntensity={2.6} alphaMap={name.texture} transparent depthWrite={false} depthTest={false} />
        </mesh>
        <points ref={dots} geometry={name.geo} renderOrder={1}>
          <pointsMaterial size={name.dot} color={[2.4, 2.4, 2.4]} sizeAttenuation vertexColors transparent depthWrite={false} depthTest={false} />
        </points>
      </group>
      <mesh ref={plane} quaternion={quat} renderOrder={2}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#000" map={tex} transparent alphaTest={0.02} roughness={0.9} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.1} depthWrite={false} />
      </mesh>
    </>
  )
}

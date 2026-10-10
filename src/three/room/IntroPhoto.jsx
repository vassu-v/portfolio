import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { live } from './store'
import { PHOTO } from './CameraRig'
import { tourU } from './tourData'

// The tour's opening shot. A spotlight on the framed photo; the cut-out of
// the same photo standing proud of the frame; the name set *behind* the
// cut-out up at turban height, magazine-cover style, and a line below the
// photo. The first stretch of scroll slowly breaks all the lettering into
// drifting particles, then slides the cut-out back into the frame.
const SIZE = 0.145
const CW = 2048

// deterministic scatter, so the dissolve looks the same every visit
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x) }

function drawName(ctx, h) {
  ctx.clearRect(0, 0, CW, h)
  ctx.fillStyle = '#F07A1A'
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

function drawHint(ctx, h) {
  ctx.clearRect(0, 0, CW, h)
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(240,230,216,0.85)'
  ctx.font = '500 64px "JetBrains Mono", monospace'
  ctx.fillText('scroll to step into the room ↓', CW / 2, 96)
}

// Lettering drawn on a canvas, shown crisp at rest and swapped for a particle
// cloud sampled from the very same pixels the moment it starts to go.
// glow: emissive strength — a saturated colour (the orange name) needs less,
// or tone mapping washes it towards white
function Lettering({ draw, height, width, offsetY, seed, range, tallScale = 0.66, glow = 2.6 }) {
  const crisp = useRef()
  const dots = useRef()
  const group = useRef()
  const { size } = useThree()
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), PHOTO.normal), [])
  const L = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CW; c.height = height
    const ctx = c.getContext('2d', { willReadFrequently: true })
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const geo = new THREE.BufferGeometry()
    const k = width / CW
    const step = 2 // dense: ~4x the particles of the first pass
    const build = () => {
      draw(ctx, height)
      texture.needsUpdate = true
      const data = ctx.getImageData(0, 0, CW, height).data
      const base = [], col = [], sd = []
      let r = seed
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < CW; x += step) {
          const i = (y * CW + x) * 4
          if (data[i + 3] < 120) continue
          base.push((x - CW / 2) * k, -(y - height / 2) * k, 0)
          col.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, 1)
          // delay sweeps left → right; drift up, right and out towards you
          sd.push(x / CW * 0.5 + rnd(r++) * 0.16, 0.04 + rnd(r++) * 0.16, 0.02 + rnd(r++) * 0.14, (rnd(r++) - 0.2) * 0.12)
        }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3))
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
      geo.userData = { base: new Float32Array(base), seed: new Float32Array(sd), last: -1 }
    }
    build()
    return { texture, geo, build, dot: step * k * 1.3 }
  }, [draw, height, width, seed])
  useEffect(() => {
    Promise.all([
      document.fonts?.load('italic 300 300px "Instrument Serif"'),
      document.fonts?.load('500 40px "JetBrains Mono"'),
    ]).catch(() => {}).then(() => L.build())
  }, [L])

  useFrame(() => {
    const u = tourU(live.scroll)
    const d = THREE.MathUtils.smoothstep(u, range[0], range[1])
    const g = group.current
    g.visible = d < 0.999
    if (!g.visible) return
    g.position.copy(PHOTO.center).addScaledVector(PHOTO.normal, 0.03)
    const tall = size.width / size.height < 1
    g.position.y += offsetY * (tall ? 0.8 : 1)
    g.scale.setScalar(tall ? tallScale : 1)
    crisp.current.visible = d < 0.002
    crisp.current.material.opacity = Math.min(1, live.intro * 1.4)
    dots.current.visible = d >= 0.002
    const geo = L.geo, ud = geo.userData
    if (dots.current.visible && geo.attributes.position && Math.abs(ud.last - d) > 0.0005) {
      ud.last = d
      const pos = geo.attributes.position.array, colr = geo.attributes.color.array, s = ud.seed
      for (let i = 0, n = pos.length / 3; i < n; i++) {
        const j = i * 4
        const t = THREE.MathUtils.clamp((d - s[j]) / 0.5, 0, 1)
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
    <group ref={group} quaternion={quat}>
      <mesh ref={crisp} renderOrder={1}>
        <planeGeometry args={[width, width * height / CW]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={L.texture} emissiveIntensity={glow} map={L.texture} transparent depthWrite={false} depthTest={false} />
      </mesh>
      <points ref={dots} geometry={L.geo} renderOrder={1}>
        <pointsMaterial size={L.dot} color={[glow * 0.92, glow * 0.92, glow * 0.92]} sizeAttenuation vertexColors transparent depthWrite={false} depthTest={false} />
      </points>
    </group>
  )
}

export default function IntroPhoto() {
  const plane = useRef()
  const spot = useRef()
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

  useFrame(() => {
    const u = tourU(live.scroll)
    const lift = THREE.MathUtils.smoothstep(u, 0.6, 0.86)
    const p = plane.current
    p.visible = lift < 0.999
    p.position.copy(PHOTO.center).addScaledVector(PHOTO.normal, 0.05 * (1 - lift) + 0.012)
    p.position.y += 0.012 * (1 - lift)
    p.scale.setScalar(1 - 0.3 * lift)
    p.material.opacity = 1 - lift
    spot.current.intensity = 0.4 + 2.2 * (1 - lift) * Math.min(1, live.intro * 1.4)
  })

  return (
    <>
      <primitive object={target} />
      <spotLight ref={spot} target={target} position={PHOTO.center.clone().add(new THREE.Vector3(0.05, 0.45, 0.42))}
        color="#fff0dc" angle={0.38} penumbra={0.75} decay={2} distance={2} />
      {/* name up at the turban, behind the cut-out; the hint below the photo */}
      <Lettering draw={drawName} height={420} width={0.47} offsetY={0.112} seed={1} range={[0.004, 0.62]} glow={1.8} />
      <Lettering draw={drawHint} height={140} width={0.3} offsetY={-0.098} seed={9001} range={[0.004, 0.5]} tallScale={1.05} />
      <mesh ref={plane} quaternion={quat} renderOrder={2}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#000" map={tex} transparent alphaTest={0.02} roughness={0.9} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={1.1} depthWrite={false} />
      </mesh>
    </>
  )
}

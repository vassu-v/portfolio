import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const GREEN = '#4ade80'

function drawScreen(ctx, canvas, text, isTag, blinkOn) {
  const { width: w, height: h } = canvas

  const bg = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.72)
  bg.addColorStop(0, '#0b2413')
  bg.addColorStop(1, '#03110a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  ctx.shadowColor = GREEN
  ctx.shadowBlur = 14
  ctx.fillStyle = GREEN
  ctx.textBaseline = 'middle'

  if (isTag) {
    ctx.textAlign = 'left'
    ctx.font = '500 22px "JetBrains Mono", monospace'
    ctx.fillText('$ cat tag', 42, 62)

    ctx.textAlign = 'center'
    ctx.font = '700 46px "JetBrains Mono", monospace'
    ctx.fillText(String(text).toUpperCase(), w / 2, h / 2 + 4)

    ctx.font = '500 20px "JetBrains Mono", monospace'
    ctx.globalAlpha = 0.55
    ctx.fillText('─────────────', w / 2, h / 2 + 58)
    ctx.globalAlpha = 0.8
    ctx.fillText(`loaded${blinkOn ? ' █' : ''}`, w / 2, h - 62)
    ctx.globalAlpha = 1
  } else {
    ctx.textAlign = 'left'
    ctx.font = '500 24px "JetBrains Mono", monospace'
    ctx.fillText('$ system init', 42, 64)
    ctx.font = '500 21px "JetBrains Mono", monospace'
    ctx.globalAlpha = 0.75
    ctx.fillText(`posts: ${text}`, 42, 122)
    ctx.fillText('bytes: synced', 42, 158)
    ctx.fillText('status: ready', 42, 210)
    ctx.globalAlpha = 1
    if (blinkOn) ctx.fillText('█', 42, 258)
  }

  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(0,0,0,0.38)'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1)

  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.68)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

// Bulged CRT glass — patch of a large sphere so the texture curves like real tube glass
function Screen({ text, isTag }) {
  const mat = useRef(null)
  const blinkRef = useRef(true)

  const { texture, ctx, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 384
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    drawScreen(ctx, canvas, text, isTag, true)
    return { texture, ctx, canvas }
  }, [text, isTag])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const blink = Math.floor(t * 1.6) % 2 === 0
    if (blink !== blinkRef.current) {
      blinkRef.current = blink
      drawScreen(ctx, canvas, text, isTag, blink)
      texture.needsUpdate = true
    }
    if (mat.current) {
      const flicker = 0.955 + 0.045 * Math.sin(t * 31) * Math.sin(t * 7.3)
      mat.current.color.setScalar(flicker)
    }
  })

  const R = 2.4
  const phi = 0.5
  const theta = 0.38
  return (
    <mesh position={[0, 0.1, 0.36 - R]}>
      <sphereGeometry args={[R, 48, 36, Math.PI / 2 - phi / 2, phi, Math.PI / 2 - theta / 2, theta]} />
      <meshBasicMaterial ref={mat} map={texture} toneMapped={false} />
    </mesh>
  )
}

// Fat vintage terminal — cream plastic, deep tube hump, sits on a low wedge base (no neck)
function Monitor({ text, isTag }) {
  const group = useRef(null)
  const cream = { color: '#d8cfba', roughness: 0.88, metalness: 0.02 }
  const creamDark = { color: '#c7beaa', roughness: 0.9, metalness: 0.02 }

  useFrame(({ clock, pointer }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    const targetY = -0.42 + Math.sin(t * 0.45) * 0.05 + pointer.x * 0.14
    const targetX = 0.03 + Math.sin(t * 0.6) * 0.015 - pointer.y * 0.06
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05
    group.current.position.y = 0.12 + Math.sin(t * 0.8) * 0.015
  })

  return (
    <group ref={group} position={[-0.16, 0.12, 0]}>
      {/* Front shell */}
      <RoundedBox args={[1.58, 1.3, 0.42]} radius={0.09} smoothness={4} position={[0, 0.06, 0.06]}>
        <meshStandardMaterial {...cream} />
      </RoundedBox>

      {/* Fat rear tube hump */}
      <RoundedBox args={[1.36, 1.12, 0.95]} radius={0.12} smoothness={4} position={[0, 0.03, -0.5]}>
        <meshStandardMaterial {...cream} />
      </RoundedBox>
      <RoundedBox args={[1.0, 0.84, 0.4]} radius={0.1} smoothness={4} position={[0, 0.0, -0.85]}>
        <meshStandardMaterial {...creamDark} />
      </RoundedBox>

      {/* Bezel frame around the glass — 4 bars so the tube shows through */}
      {[
        { args: [1.38, 0.14, 0.08], pos: [0, 0.6, 0.3] },
        { args: [1.38, 0.2, 0.08], pos: [0, -0.42, 0.3] },
        { args: [0.13, 1.1, 0.08], pos: [-0.63, 0.09, 0.3] },
        { args: [0.13, 1.1, 0.08], pos: [0.63, 0.09, 0.3] },
      ].map((b, i) => (
        <RoundedBox key={i} args={b.args} radius={0.03} smoothness={2} position={b.pos}>
          <meshStandardMaterial {...cream} />
        </RoundedBox>
      ))}

      {/* Dark cavity behind the glass edges */}
      <mesh position={[0, 0.1, 0.2]}>
        <planeGeometry args={[1.3, 1.0]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      <Screen text={text} isTag={isTag} />

      {/* Screen glow spilling onto the bezel */}
      <pointLight position={[0, 0.1, 0.8]} intensity={0.5} color={GREEN} distance={1.8} decay={2} />

      {/* Vent grooves on top of the hump */}
      {[-0.34, -0.24, -0.14, -0.04, 0.06, 0.16].map(z => (
        <mesh key={z} position={[0, 0.6, -0.5 + z]}>
          <boxGeometry args={[0.78, 0.012, 0.045]} />
          <meshStandardMaterial color="#9a917d" roughness={1} />
        </mesh>
      ))}

      {/* Knobs + power LED on the chin */}
      <mesh position={[0.4, -0.44, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.035, 20]} />
        <meshStandardMaterial color="#b5ac97" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0.54, -0.44, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.035, 20]} />
        <meshStandardMaterial color="#b5ac97" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[-0.5, -0.44, 0.345]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* Badge strip */}
      <mesh position={[-0.44, 0.6, 0.345]}>
        <boxGeometry args={[0.34, 0.045, 0.01]} />
        <meshStandardMaterial color="#8a8270" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Low wedge base — no neck, classic tilt-swivel look */}
      <RoundedBox args={[1.34, 0.16, 0.96]} radius={0.05} smoothness={3} position={[0, -0.66, -0.18]}>
        <meshStandardMaterial {...creamDark} />
      </RoundedBox>
    </group>
  )
}

export default function CRTMonitor3D({ text, isTag = false }) {
  return (
    <div style={{ width: '320px', height: '360px', background: 'radial-gradient(closest-side, rgba(74,222,128,0.07), transparent 72%)' }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.22, 3.9], fov: 38 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} color="#fff4e2" />
        <directionalLight position={[3, 3.5, 3]} intensity={0.9} color="#ffe9c9" />
        <directionalLight position={[-3, 1.5, -2]} intensity={0.4} color="#7a9fd4" />
        <Monitor text={text} isTag={isTag} />
        <ContactShadows position={[-0.16, -0.63, 0]} opacity={0.65} scale={4.2} blur={2.6} far={1.6} resolution={256} color="#000000" />
      </Canvas>
    </div>
  )
}

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// Stage targets: camera position, look-at, lid rotation (0 closed → -1.92 open ≈ 110°)
const STAGES = [
  { id: 'hero',       cam: [2.9, 1.7, 3.6],   look: [0, 0.3, 0],  lid: -0.06 },
  { id: 'about',      cam: [1.9, 1.25, 2.7],  look: [0, 0.35, 0], lid: -1.88 },
  { id: 'experience', cam: [1.3, 1.0, 2.3],   look: [0, 0.4, 0],  lid: -1.95 },
  { id: 'projects',   cam: [-1.6, 1.05, 2.55], look: [0, 0.4, 0], lid: -1.95 },
  { id: 'writing',    cam: [0, 1.1, 2.6],     look: [0, 0.45, 0], lid: -1.95 },
  { id: 'highlights', cam: [1.7, 1.35, 2.9],  look: [0, 0.4, 0],  lid: -1.95 },
  { id: 'currently',  cam: [2.0, 1.5, 3.1],   look: [0, 0.35, 0], lid: -1.95 },
  { id: 'contact',    cam: [2.6, 2.0, 3.9],   look: [0, 0.25, 0], lid: -0.06 },
]

const SCREEN_TEXT = {
  hero: [],
  about: ['$ whoami', '', '16 · kolkata · builder', '', 'building something', 'that might matter'],
  experience: ['$ ls work/', '', 'bits&bytes   fork lead', '4mq.org      consultant', 'freelance    ui design', 'beyond rote  outreach', 'utsavy       ux intern'],
  projects: ['$ ls projects/', '', 'buy4chai/', 'sarkarsathi/', 'lifi-mesh/', 'chemx/', 'grounded-planning/'],
  writing: ['$ cat log/latest', '', 'nobody told me', 'to start.', 'that was the point.'],
  highlights: ['$ ./achievements', '', 'top 1k / 26,000+', '$300 intl · kolkata', 'published @ 15'],
  currently: ['$ ps aux | active', '', 'bits&bytes kolkata', '4mq consulting', 'buy4chai v2'],
  contact: ['$ mail -s "hey"', '', '> get in touch'],
}

const SECTION_IDS = ['about', 'experience', 'projects', 'writing', 'highlights', 'currently', 'contact']

function useStageRef() {
  const stageRef = useRef(0)
  useEffect(() => {
    const measure = () => {
      let idx = 0
      const threshold = window.innerHeight * 0.45
      for (let i = 0; i < SECTION_IDS.length; i++) {
        const el = document.getElementById(SECTION_IDS[i])
        if (el && el.getBoundingClientRect().top < threshold) idx = i + 1
      }
      stageRef.current = idx
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return stageRef
}

function Screen({ screenRef }) {
  const { texture, ctx, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return { texture, ctx, canvas }
  }, [])

  const local = useRef({ stage: -1, reveal: 0, blink: 0, blinkOn: true, dirty: true })

  useFrame((state, delta) => {
    const s = local.current
    const target = screenRef.current.stage
    if (s.stage !== target) {
      s.stage = target
      s.reveal = 0
      s.dirty = true
    }
    const lines = SCREEN_TEXT[STAGES[s.stage]?.id] || []
    const total = lines.join('\n').length
    if (s.reveal < total) {
      s.reveal = Math.min(total, s.reveal + delta * 120)
      s.dirty = true
    }
    s.blink += delta
    if (s.blink > 0.5) {
      s.blink = 0
      s.blinkOn = !s.blinkOn
      s.dirty = true
    }
    if (!s.dirty) return
    s.dirty = false

    ctx.fillStyle = '#070604'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = '500 24px "JetBrains Mono", monospace'
    ctx.textBaseline = 'top'
    let remaining = Math.floor(s.reveal)
    let y = 26
    let lastX = 28
    let lastY = y
    for (const line of lines) {
      const take = Math.max(0, Math.min(line.length, remaining))
      const shown = line.slice(0, take)
      ctx.fillStyle = line.startsWith('$') ? '#8a6220' : '#D4983A'
      ctx.fillText(shown, 28, y)
      lastX = 28 + ctx.measureText(shown).width
      lastY = y
      remaining -= line.length + 1
      y += 34
      if (remaining < 0) break
    }
    if (s.blinkOn) {
      ctx.fillStyle = '#D4983A'
      ctx.fillRect(lastX + 6, lastY + 2, 12, 22)
    }
    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    for (let sy = 0; sy < canvas.height; sy += 4) ctx.fillRect(0, sy, canvas.width, 1)
    texture.needsUpdate = true
  })

  return (
    <mesh position={[0, -0.024, 0.375]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.0, 0.62]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function Laptop({ lidRef, screenRef, glowRef }) {
  return (
    <group position={[0.1, 0, 0.1]}>
      {/* Base */}
      <RoundedBox args={[1.15, 0.05, 0.78]} radius={0.02} position={[0, 0.028, 0]}>
        <meshStandardMaterial color="#141210" roughness={0.55} metalness={0.5} />
      </RoundedBox>
      {/* Keyboard well */}
      <mesh position={[0, 0.055, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 0.42]} />
        <meshStandardMaterial color="#0b0a09" roughness={0.9} />
      </mesh>
      {/* Trackpad */}
      <mesh position={[0, 0.056, 0.31]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.34, 0.11]} />
        <meshStandardMaterial color="#191613" roughness={0.7} />
      </mesh>
      {/* Lid — hinged at back edge */}
      <group ref={lidRef} position={[0, 0.055, -0.37]}>
        <RoundedBox args={[1.15, 0.035, 0.76]} radius={0.02} position={[0, 0, 0.375]}>
          <meshStandardMaterial color="#161311" roughness={0.5} metalness={0.55} />
        </RoundedBox>
        <Screen screenRef={screenRef} />
      </group>
      {/* Screen light spilling onto the desk */}
      <pointLight ref={glowRef} position={[0, 0.5, 0.7]} color="#D4983A" intensity={0} distance={2.4} decay={2} />
    </group>
  )
}

function Props() {
  return (
    <group>
      {/* Chai cup */}
      <group position={[0.95, 0, 0.32]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.055, 0.045, 0.12, 24]} />
          <meshStandardMaterial color="#241a10" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.048, 24]} />
          <meshStandardMaterial color="#6b4218" roughness={0.35} emissive="#4a2c0e" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.065, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.035, 0.008, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#241a10" roughness={0.6} />
        </mesh>
      </group>
      {/* Notebook */}
      <group position={[-0.75, 0, 0.34]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[0.36, 0.024, 0.5]} />
          <meshStandardMaterial color="#2a1e10" roughness={0.85} />
        </mesh>
        <mesh position={[0.04, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0.06]}>
          <planeGeometry args={[0.26, 0.44]} />
          <meshStandardMaterial color="#3a2c18" roughness={0.9} />
        </mesh>
      </group>
      {/* Breadboard */}
      <group position={[-1.15, 0, -0.15]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.42, 0.03, 0.28]} />
          <meshStandardMaterial color="#1c1c1e" roughness={0.75} />
        </mesh>
        <mesh position={[-0.1, 0.035, 0.04]}>
          <boxGeometry args={[0.06, 0.014, 0.06]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.5} emissive="#C57B2B" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0.08, 0.033, -0.05]}>
          <boxGeometry args={[0.1, 0.01, 0.04]} />
          <meshStandardMaterial color="#14261a" roughness={0.6} />
        </mesh>
      </group>
      {/* Lamp */}
      <group position={[1.35, 0, -0.42]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.04, 24]} />
          <meshStandardMaterial color="#111010" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[-0.1, 0.42, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.014, 0.014, 0.85, 10]} />
          <meshStandardMaterial color="#131211" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[-0.32, 0.78, 0]} rotation={[0, 0, 2.2]}>
          <coneGeometry args={[0.11, 0.18, 20, 1, true]} />
          <meshStandardMaterial color="#171410" roughness={0.5} metalness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.36, 0.72, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#F5C580" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function Desk() {
  return (
    <group>
      <RoundedBox args={[3.6, 0.1, 1.8]} radius={0.02} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#181109" roughness={0.82} />
      </RoundedBox>
      {[[-1.66, -1.66], [1.66, -1.66], [-1.66, 1.66], [1.66, 1.66]].map(([x], i) => {
        const z = i < 2 ? -0.78 : 0.78
        return (
          <mesh key={i} position={[x, -0.7, z]}>
            <boxGeometry args={[0.09, 1.2, 0.09]} />
            <meshStandardMaterial color="#120c06" roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

function Rig({ stageRef, screenRef }) {
  const lidRef = useRef()
  const glowRef = useRef()
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const look = useRef(new THREE.Vector3(0, 0.3, 0))

  useEffect(() => {
    const onMove = e => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, delta) => {
    const stage = STAGES[stageRef.current] || STAGES[0]
    screenRef.current.stage = stageRef.current
    const k = 1 - Math.pow(0.0018, delta)

    camera.position.x += (stage.cam[0] + mouse.current.x * 0.14 - camera.position.x) * k
    camera.position.y += (stage.cam[1] - mouse.current.y * 0.1 - camera.position.y) * k
    camera.position.z += (stage.cam[2] - camera.position.z) * k
    look.current.x += (stage.look[0] - look.current.x) * k
    look.current.y += (stage.look[1] - look.current.y) * k
    look.current.z += (stage.look[2] - look.current.z) * k
    camera.lookAt(look.current)

    if (lidRef.current) {
      lidRef.current.rotation.x += (stage.lid - lidRef.current.rotation.x) * k
      const openness = Math.min(1, Math.abs(lidRef.current.rotation.x) / 1.9)
      if (glowRef.current) glowRef.current.intensity = openness * 1.1
    }
  })

  return (
    <>
      <Desk />
      <Laptop lidRef={lidRef} screenRef={screenRef} glowRef={glowRef} />
      <Props />
    </>
  )
}

export default function DeskScene() {
  const stageRef = useStageRef()
  const screenRef = useRef({ stage: 0 })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [2.9, 1.7, 3.6], fov: 38 }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog('#090909', 3.4, 8.5)
        }}
      >
        <ambientLight intensity={0.14} />
        <pointLight position={[1.0, 1.6, -0.1]} color="#E8A455" intensity={4.2} distance={7} decay={2} />
        <directionalLight position={[-3, 2, 2]} color="#45506a" intensity={0.35} />
        <Rig stageRef={stageRef} screenRef={screenRef} />
      </Canvas>
    </div>
  )
}

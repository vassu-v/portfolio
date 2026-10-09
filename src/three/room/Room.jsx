import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import Baked from './Baked'
import { Hotspot } from './common'
import { room, useRoom, wake, dirtyShadows } from './store'
import { oakFloorTexture, plasterTexture, rugTexture, walnutTexture } from './textures'

// Room shell. Corner room: back wall at z = BACK, window wall at x = LEFT.
export const BACK = -1.0
export const LEFT = -1.6
export const RIGHT = 2.6
export const FRONT = 3.2
export const CEIL = 2.7
export const WIN = { z0: -0.78, z1: 0.42, y0: 0.95, y1: 2.15 }
const T = 0.14 // wall thickness

// `wall` = [nx, ny, nz]: the inward normal. Roam mode hides a wall whenever
// the camera is behind it, so you can orbit the whole setup.
function Box({ args, position, material, cast = true, wall }) {
  const data = useMemo(() => (wall ? { wall: { normal: new THREE.Vector3(...wall), center: new THREE.Vector3(...position) } } : undefined), [wall, position])
  return (
    <mesh position={position} castShadow={cast} receiveShadow material={material} userData={data}>
      <boxGeometry args={args} />
    </mesh>
  )
}

function Sky({ sky }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color() },
      bot: { value: new THREE.Color() },
      stars: { value: 0 },
      time: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 top; uniform vec3 bot; uniform float stars; uniform float time;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 c = mix(bot, top, smoothstep(0.15, 0.95, vUv.y));
        vec2 g = floor(vUv * vec2(260.0, 160.0));
        float s = step(0.9965, h(g)) * smoothstep(0.35, 0.8, vUv.y);
        s *= 0.6 + 0.4 * sin(time * 1.7 + h(g + 3.0) * 40.0);
        c += vec3(s * stars * 1.4);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }
    `,
    depthWrite: false,
  }), [])

  useFrame((_, dt) => {
    mat.uniforms.top.value.copy(sky.skyTop)
    mat.uniforms.bot.value.copy(sky.skyBot)
    mat.uniforms.stars.value = sky.stars
    mat.uniforms.time.value += dt
  })

  return (
    <mesh position={[LEFT - 6, 2.2, -0.2]} rotation={[0, Math.PI / 2, 0]} material={mat}>
      <planeGeometry args={[30, 14]} />
    </mesh>
  )
}

// Skyline outside the window — R channel = building mass, G = lit windows.
function Skyline({ sky, depth, seed, height, x }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 2048; c.height = 512
    const ctx = c.getContext('2d')
    let s = seed
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    let px = 0
    while (px < c.width) {
      const w = 40 + r() * 120
      const h = 80 + r() * 300 * height
      ctx.fillStyle = 'rgb(255,0,0)'
      ctx.fillRect(px, c.height - h, w - 4, h)
      for (let wy = c.height - h + 8; wy < c.height - 6; wy += 9) {
        for (let wx = px + 5; wx < px + w - 8; wx += 7) {
          if (r() > 0.86) { ctx.fillStyle = 'rgb(255,255,0)'; ctx.fillRect(wx, wy, 3, 4) }
        }
      }
      px += w
    }
    const t = new THREE.CanvasTexture(c)
    t.wrapS = THREE.RepeatWrapping
    return t
  }, [seed, height])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, haze: { value: new THREE.Color() }, night: { value: 0 }, depth: { value: depth } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec3 haze; uniform float night; uniform float depth;
      varying vec2 vUv;
      void main() {
        vec4 t = texture2D(map, vUv);
        if (t.r < 0.5) discard;
        vec3 mass = mix(haze * 0.55, haze, depth);
        vec3 lit = vec3(1.0, 0.72, 0.38) * t.g * night * (1.2 - depth * 0.6);
        gl_FragColor = vec4(mass + lit, 1.0);
        #include <colorspace_fragment>
      }
    `,
  }), [tex, depth])

  useFrame(() => {
    mat.uniforms.haze.value.copy(sky.skyBot).lerp(sky.skyTop, 0.35)
    mat.uniforms.night.value = THREE.MathUtils.smoothstep(sky.stars, 0, 0.6)
  })

  return (
    <mesh position={[x, -0.4, -0.2]} rotation={[0, Math.PI / 2, 0]} material={mat}>
      <planeGeometry args={[22, 5.5]} />
    </mesh>
  )
}

// Curtains draw shut / open on click (store.curtains); shut, they cut the
// daylight (Sun in RoomScene reads the same flag).
function Curtain({ z, shutZ, flip, sway: animate }) {
  const ref = useRef()
  const shut = useRoom(s => s.curtains)
  const c = useRef(0)
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.42, 1.62, 48, 1)
    g.userData.base = g.attributes.position.array.slice()
    return g
  }, [])
  useFrame(({ clock }, dt) => {
    const moving = Math.abs(c.current - (shut ? 1 : 0)) > 0.001
    if (moving) {
      c.current = THREE.MathUtils.damp(c.current, shut ? 1 : 0, 3.5, dt)
      if (ref.current) ref.current.position.z = z + (shutZ - z) * c.current
      wake(150)
      dirtyShadows(2)
    }
    if (!animate && !moving && geo.userData.done) return
    geo.userData.done = true
    const spread = 1 + 0.5 * c.current
    const pos = geo.attributes.position
    const b = geo.userData.base
    const t = animate ? clock.elapsedTime : 0
    for (let i = 0; i < pos.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1]
      const sway = Math.sin(t * 0.6 + y * 2.0) * 0.003 * (0.81 - y)
      // soft folds, a touch deeper at the hem like real cloth
      pos.setX(i, x * spread)
      pos.setZ(i, Math.sin(x * 46) * (0.02 + (0.81 - y) * 0.004) / spread + sway)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    // hangs in front of the sill (which sticks out 0.13 m), opaque: a
    // transparent double-sided cloth sorted against the glass and flickered
    <Hotspot id="curtains" always label={shut ? 'open the curtains' : 'draw the curtains'} onClick={() => room.set({ curtains: !room.get().curtains })}>
      <mesh ref={ref} geometry={geo} position={[LEFT + 0.17, WIN.y1 + 0.13 - 0.81, z]} rotation={[0, flip ? -Math.PI / 2 : Math.PI / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e8e0d2" roughness={0.97} side={THREE.DoubleSide} />
      </mesh>
    </Hotspot>
  )
}

function Books() {
  const books = [
    ['#7a2f22', 0.21, 0.03], ['#283a4f', 0.19, 0.025], ['#c9a24a', 0.23, 0.035], ['#3d4a33', 0.2, 0.028],
    ['#1d1d1f', 0.22, 0.04], ['#8a5a34', 0.18, 0.026], ['#efe6d3', 0.2, 0.03],
  ]
  let x = 0
  return (
    <group>
      {books.map(([c, h, w], i) => {
        const lean = i === books.length - 1 ? -0.28 : 0
        const el = (
          <mesh key={i} position={[x + w / 2 + (lean ? 0.04 : 0), h / 2 - (lean ? 0.01 : 0), 0]} rotation={[0, 0, lean]} castShadow receiveShadow>
            <boxGeometry args={[w, h, 0.15]} />
            <meshStandardMaterial color={c} roughness={0.75} />
          </mesh>
        )
        x += w + 0.002
        return el
      })}
    </group>
  )
}

export default function Room({ sky, sway = true }) {
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8d0c3', map: plasterTexture(), roughness: 0.95 }), [])
  const floor = useMemo(() => new THREE.MeshStandardMaterial({ map: oakFloorTexture(), roughness: 0.62, metalness: 0 }), [])
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efeae2', roughness: 0.6 }), [])
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.45, metalness: 0.3 }), [])
  const shelfMat = useMemo(() => new THREE.MeshStandardMaterial({ map: walnutTexture(), roughness: 0.55 }), [])

  const W = RIGHT - LEFT, D = FRONT - BACK
  const cx = (LEFT + RIGHT) / 2, cz = (BACK + FRONT) / 2
  const winW = WIN.z1 - WIN.z0, winH = WIN.y1 - WIN.y0, winZ = (WIN.z0 + WIN.z1) / 2
  const lx = LEFT - T / 2

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow material={floor}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* ceiling */}
      <Box args={[W + T * 2, T, D]} position={[cx, CEIL + T / 2, cz]} material={trim} wall={[0, -1, 0]} />
      {/* back wall */}
      <Box args={[W + T * 2, CEIL, T]} position={[cx, CEIL / 2, BACK - T / 2]} material={wall} wall={[0, 0, 1]} />
      {/* right wall */}
      <Box args={[T, CEIL, D]} position={[RIGHT + T / 2, CEIL / 2, cz]} material={wall} wall={[-1, 0, 0]} />
      {/* left wall, built around the window opening */}
      <Box args={[T, WIN.y0, D]} position={[lx, WIN.y0 / 2, cz]} material={wall} wall={[1, 0, 0]} />
      <Box args={[T, CEIL - WIN.y1, D]} position={[lx, (CEIL + WIN.y1) / 2, cz]} material={wall} wall={[1, 0, 0]} />
      <Box args={[T, winH, WIN.z0 - BACK]} position={[lx, (WIN.y0 + WIN.y1) / 2, (BACK + WIN.z0) / 2]} material={wall} wall={[1, 0, 0]} />
      <Box args={[T, winH, FRONT - WIN.z1]} position={[lx, (WIN.y0 + WIN.y1) / 2, (WIN.z1 + FRONT) / 2]} material={wall} wall={[1, 0, 0]} />

      <Baked>
      {/* skirting */}
      <Box args={[W, 0.08, 0.015]} position={[cx, 0.04, BACK + 0.008]} material={trim} cast={false} />
      <Box args={[0.015, 0.08, D]} position={[LEFT + 0.008, 0.04, cz]} material={trim} cast={false} />
      <Box args={[0.015, 0.08, D]} position={[RIGHT - 0.008, 0.04, cz]} material={trim} cast={false} />

      {/* window: frame, mullions, sill, glass */}
      <group position={[LEFT - T * 0.55, 0, 0]}>
        <Box args={[0.06, 0.05, winW]} position={[0, WIN.y0 + 0.025, winZ]} material={frame} />
        <Box args={[0.06, 0.05, winW]} position={[0, WIN.y1 - 0.025, winZ]} material={frame} />
        <Box args={[0.06, winH, 0.05]} position={[0, (WIN.y0 + WIN.y1) / 2, WIN.z0 + 0.025]} material={frame} />
        <Box args={[0.06, winH, 0.05]} position={[0, (WIN.y0 + WIN.y1) / 2, WIN.z1 - 0.025]} material={frame} />
        <Box args={[0.05, winH, 0.035]} position={[0, (WIN.y0 + WIN.y1) / 2, winZ]} material={frame} />
        <Box args={[0.05, 0.035, winW]} position={[0, WIN.y0 + winH * 0.62, winZ]} material={frame} />
        <mesh position={[0, (WIN.y0 + WIN.y1) / 2, winZ]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[winW, winH]} />
          <meshPhysicalMaterial color="#cfe0ea" roughness={0.04} metalness={0} transparent opacity={0.06} envMapIntensity={1.4} depthWrite={false} />
        </mesh>
      </group>
      <Box args={[0.2, 0.035, winW + 0.16]} position={[LEFT + 0.03, WIN.y0 - 0.0175, winZ]} material={trim} />
      <mesh position={[LEFT + 0.17, WIN.y1 + 0.13, winZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, winW + 0.7, 12]} />
        <meshStandardMaterial color="#1c1a18" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* wall shelf above the desk, left */}
      <group position={[-0.5, 1.62, BACK + 0.11]}>
        <RoundedBox args={[0.7, 0.028, 0.2]} radius={0.004} castShadow receiveShadow material={shelfMat} />
        {[-0.28, 0.28].map(x => (
          <mesh key={x} position={[x, -0.04, -0.06]} castShadow>
            <boxGeometry args={[0.012, 0.08, 0.08]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <group position={[-0.32, 0.014, 0]}><Books /></group>
      </group>

      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0.06]} position={[0.1, 0.004, 0.25]} receiveShadow>
        <planeGeometry args={[2.0, 1.4]} />
        <meshStandardMaterial map={rugTexture()} roughness={1} />
      </mesh>

      {/* wall socket behind the desk */}
      <mesh position={[-0.2, 0.32, BACK + 0.006]} castShadow>
        <boxGeometry args={[0.09, 0.09, 0.012]} />
        <meshStandardMaterial color="#f2efe9" roughness={0.5} />
      </mesh>
      </Baked>

      <Curtain z={WIN.z0 - 0.05} shutZ={WIN.z0 + 0.31} sway={sway} />
      <Curtain z={WIN.z1 + 0.05} shutZ={WIN.z1 - 0.31} flip sway={sway} />

      {/* outside */}
      <Sky sky={sky} />
      <Skyline sky={sky} depth={0.25} seed={7} height={1} x={LEFT - 4.2} />
      <Skyline sky={sky} depth={0.75} seed={91} height={1.6} x={LEFT - 5.4} />
    </group>
  )
}

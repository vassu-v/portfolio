import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createModel as createLaptop } from './lib/laptop'
import { createModel as createKeyboard } from './lib/mechanical-keyboard'
import { createModel as createHeadphones } from './lib/headphones'
import { createModel as createLamp } from './lib/desk-lamp'
import { createModel as createMug } from './lib/coffee-mug'
import { AGE } from '../../utils/meta'
import { prepModel, Hotspot, damp } from './common'
import { bakeStatic } from './bake'
import { createScreen } from './screen'
import { room, live, useRoom, focusOn, dirtyShadows, off } from './store'
import { DESK } from './Desk'
import { TIERS } from './tier'
import { BACK } from './Room'

const extraProps = import.meta.glob('./props/*.js', { eager: true })
const prop = (file, fn) => extraProps[`./props/${file}.js`]?.[fn]

export const anchors = {
  screen: new THREE.Object3D(),
  screenNormal: new THREE.Vector3(0, 0, 1),
  lampBulb: new THREE.Vector3(),
}

const Y = DESK.top

function Primitive({ make, prep = {}, ...props }) {
  const obj = useMemo(() => bakeStatic(prepModel(make(), prep)), []) // eslint-disable-line react-hooks/exhaustive-deps
  return <primitive object={obj} {...props} />
}

function Laptop() {
  const model = useMemo(() => {
    const m = prepModel(createLaptop())
    m.position.set(0, 0, 0)
    // lid stays open; everything but the live screen collapses to a few meshes
    return bakeStatic(m, { keep: [m.userData.parts.screen] })
  }, [])
  const screen = useMemo(() => createScreen(), [])
  const glow = useRef()

  useEffect(() => {
    const { screen: mesh } = model.userData.parts
    mesh.material = new THREE.MeshStandardMaterial({
      color: '#000', emissive: '#fff', emissiveMap: screen.texture, emissiveIntensity: 1.5, roughness: 0.55, metalness: 0, envMapIntensity: 0.08,
    })
    mesh.castShadow = false
    mesh.add(anchors.screen)
    model.userData.display(() => {})
  }, [model, screen])

  useFrame(({ clock }) => {
    const d = THREE.MathUtils.smoothstep(live.scroll, 0.06, 0.42)
    screen.draw(d, clock.elapsedTime)
  })

  // library laptop is 4.4 units wide → ~0.31 m
  return (
    <Hotspot id="laptop" label="Laptop — the terminal" onClick={() => focusOn('laptop')} position={[-0.17, Y, -0.74]} rotation={[0, 0.06, 0]}>
      <primitive object={model} scale={0.07} />
      {!off.has('rect') && <rectAreaLight ref={glow} width={0.28} height={0.18} color="#ffd7a8" position={[0, 0.13, -0.06]} rotation={[-0.25, 0, 0]} intensity={0.55} />}
    </Hotspot>
  )
}

function Keyboard() {
  return (
    <Primitive make={() => createKeyboard({ typing: false, legends: false })} position={[-0.15, Y, -0.46]} rotation={[0, -0.05, 0]} scale={0.14} />
  )
}

function Lamp({ tier }) {
  const lampOn = useRoom(s => s.lampOn)
  const model = useMemo(() => {
    const m = prepModel(createLamp())
    m.position.set(0, 0, 0)
    m.traverse(o => { if (o.isMesh && o.material?.isMeshBasicMaterial) o.visible = false })
    m.userData.setManualControl(true)
    return bakeStatic(m, { keep: [m.userData.parts.bulb] })
  }, [])
  const spot = useRef()
  const fill = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const btn = useRef()

  useEffect(() => { model.userData.setOn(lampOn) }, [model, lampOn])

  useFrame(({ clock }, dt) => {
    const { bulb } = model.userData.parts
    bulb.getWorldPosition(anchors.lampBulb)
    const k = spot.current.userData.k = damp(spot.current.userData.k ?? 1, lampOn ? 1 : 0, 9, dt)
    spot.current.position.copy(anchors.lampBulb)
    target.position.set(0.12, Y, -0.55)
    const flicker = 1 + Math.sin(clock.elapsedTime * 23) * 0.01 + Math.sin(clock.elapsedTime * 7.3) * 0.015
    spot.current.intensity = 9 * k * flicker
    if (fill.current) {
      fill.current.position.copy(anchors.lampBulb)
      fill.current.intensity = 0.6 * k
    }
    if (btn.current) btn.current.position.y = damp(btn.current.position.y, lampOn ? 0.024 : 0.019, 18, dt)
  })

  const toggle = () => {
    const on = !room.get().lampOn
    room.set({ lampOn: on })
    document.documentElement.dataset.theme = on ? 'warm' : 'dark'
  }

  return (
    <>
      <Hotspot id="lamp" always label="Lamp — click to switch" onClick={toggle} position={[0.6, Y, -0.86]} rotation={[0, Math.PI - 0.35, 0]}>
        <primitive object={model} scale={0.1} />
        <mesh ref={btn} position={[0.045, 0.024, 0.045]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.012, 20]} />
          <meshStandardMaterial color="#C57B2B" metalness={0.6} roughness={0.35} emissive="#C57B2B" emissiveIntensity={lampOn ? 0.6 : 0} />
        </mesh>
      </Hotspot>
      <primitive object={target} />
      <spotLight
        ref={spot}
        target={target}
        color="#ffcf94"
        angle={0.95}
        penumbra={0.75}
        decay={2}
        distance={0}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={off.has('r1') ? 1 : off.has('r2') ? 2 : 6}
        shadow-camera-near={0.02}
        shadow-camera-far={4}
        castShadow={(TIERS[tier]?.lampShadow ?? false) && !off.has('shadow')}
        onUpdate={l => l.shadow.camera.layers.enable(1)}
      />
      {!off.has('fill') && <pointLight ref={fill} color="#ffcf94" distance={4} decay={2} />}
    </>
  )
}

function Headphones() {
  const ref = useRef()
  const swing = useRef({ a: 0, v: 0 })
  const model = useMemo(() => {
    const m = prepModel(createHeadphones())
    m.position.set(0, 0, 0)
    // pivot the band's top onto the hook
    // scale first, so the hook offset is measured in metres, not model units
    m.scale.setScalar(0.055)
    m.rotation.y = Math.PI / 2
    const box = new THREE.Box3().setFromObject(m)
    m.position.y = -box.max.y
    return bakeStatic(m)
  }, [])

  useFrame((_, dt) => {
    const s = swing.current
    s.v += (-s.a * 22 - s.v * 1.6) * dt
    s.a += s.v * dt
    if (Math.abs(s.v) > 0.002) dirtyShadows(2)
    if (ref.current) ref.current.rotation.x = s.a
  })

  return (
    <group position={[DESK.x0 - 0.035, Y - 0.06, -0.46]}>
      {/* hook */}
      <mesh position={[0.02, 0.02, 0]} castShadow>
        <boxGeometry args={[0.03, 0.05, 0.03]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 10]} />
        <meshStandardMaterial color="#1b1b1d" metalness={0.6} roughness={0.4} />
      </mesh>
      <Hotspot id="headphones" always label="Headphones" onClick={() => { swing.current.v += 2.2 }}>
        <group ref={ref} position={[-0.025, 0.006, 0]}>
          <primitive object={model} />
        </group>
      </Hotspot>
    </group>
  )
}

function Mug() {
  const model = useMemo(() => {
    const m = prepModel(createMug())
    m.userData.parts.wisps?.forEach?.(w => w.traverse(o => { o.castShadow = false }))
    return bakeStatic(m, { keep: [m.userData.parts.coffee, ...(m.userData.parts.wisps || [])] })
  }, [])
  useFrame(({ clock }) => model.userData.update(clock.elapsedTime))
  return <primitive object={model} position={[0.33, Y, -0.68]} scale={0.034} rotation={[0, 2.2, 0]} />
}

function noteTexture(lines, bg) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const draw = () => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 256, 256)
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, 'rgba(0,0,0,0.08)'); g.addColorStop(0.2, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#2a2018'
    ctx.font = '600 40px Caveat, cursive'
    lines.forEach((l, i) => ctx.fillText(l, 22, 70 + i * 46))
    tex.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(draw)
  return tex
}

function Sticky({ lines, color = '#f7e27a', size = 0.076, curl = 0.25, ...props }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 1, 10)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i)
      const t = (size / 2 - y) / size
      p.setZ(i, t * t * size * curl)
    }
    g.computeVertexNormals()
    return g
  }, [size, curl])
  const tex = useMemo(() => noteTexture(lines, color), [lines, color])
  return (
    <mesh geometry={geo} castShadow receiveShadow {...props}>
      <meshStandardMaterial map={tex} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Pen(props) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0045, 0.0045, 0.14, 12]} />
        <meshStandardMaterial color="#141416" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.075, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.0045, 0.012, 12]} />
        <meshStandardMaterial color="#C57B2B" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  )
}

// Cable from a point on the desk, over the back edge, down to the socket.
function Cable({ from, to, sag = 0.12 }) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
    const edge = new THREE.Vector3(a.x + (b.x - a.x) * 0.3, Y + 0.005, BACK + 0.04)
    const drop = new THREE.Vector3(edge.x, Y - 0.25, BACK + 0.03)
    const low = new THREE.Vector3((edge.x + b.x) / 2, b.y - sag, BACK + 0.05)
    const curve = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, Y + 0.004, (a.z + edge.z) / 2), edge, drop, low, b])
    return new THREE.TubeGeometry(curve, 80, 0.0028, 6)
  }, [from, to, sag])
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#141414" roughness={0.6} />
    </mesh>
  )
}

function Built() {
  const Chair = prop('chair', 'createChair')
  const Mouse = prop('mouse', 'createMouse')
  const Mousepad = prop('mouse', 'createMousepad')
  const Plant = prop('plant', 'createPlant')
  const chair = useMemo(() => {
    if (!Chair) return null
    const c = prepModel(Chair())
    bakeStatic(c.userData.seat)
    bakeStatic(c.userData.base)
    return c
  }, [Chair])
  const mouse = useMemo(() => Mouse && bakeStatic(prepModel(Mouse())), [Mouse])
  const pad = useMemo(() => Mousepad && prepModel(Mousepad()), [Mousepad])
  const plant = useMemo(() => Plant && bakeStatic(prepModel(Plant())), [Plant])
  const spin = useRef({ v: 0 })

  useFrame((_, dt) => {
    const seat = chair?.userData.seat
    if (seat && Math.abs(spin.current.v) > 0.001) {
      spin.current.v *= Math.exp(-dt * 1.4)
      seat.rotation.y += spin.current.v * dt
      dirtyShadows(2)
    }
  })

  return (
    <>
      {chair && (
        <Hotspot id="chair" always label="Chair — give it a spin" onClick={() => { spin.current.v += 5 }} position={[-0.42, 0, 0.32]} rotation={[0, Math.PI - 0.75, 0]}>
          <primitive object={chair} />
        </Hotspot>
      )}
      {pad && <primitive object={pad} position={[0.27, Y, -0.48]} rotation={[0, -0.04, 0]} />}
      {mouse && <primitive object={mouse} position={[0.29, Y + (pad ? 0.003 : 0), -0.46]} rotation={[0, Math.PI - 0.18, 0]} />}
      {plant && <primitive object={plant} position={[-0.66, Y, -0.86]} />}
    </>
  )
}

export default function Props({ tier = 'high' }) {
  return (
    <group>
      <Laptop />
      <Keyboard />
      <Lamp tier={tier} />
      <Headphones />
      <Mug />
      <Built />
      <Pen position={[-0.36, Y + 0.0045, -0.38]} rotation={[0, 0.9, 0]} />

      {/* sticky notes — on the wall by the shelf, on the laptop bezel, on the desk */}
      <Sticky lines={['hi, i\'m shorya', `${AGE} · kolkata`]} color="#f7e27a" position={[-0.62, 1.32, BACK + 0.004]} rotation={[0, 0, 0.05]} curl={0.15} />
      <Sticky lines={['open to', 'collab →']} color="#f4b98a" position={[-0.5, 1.27, BACK + 0.004]} rotation={[0, 0, -0.07]} curl={0.2} />
      <Sticky lines={['ship it.']} color="#bfe3c0" position={[-0.4, 1.35, BACK + 0.004]} rotation={[0, 0, 0.03]} curl={0.12} />
      <Sticky lines={['curl', 'shoryavardhaan', '.vercel.app']} color="#f7e27a" size={0.07} position={[0.07, Y + 0.0012, -0.58]} rotation={[-Math.PI / 2, 0, -0.25]} curl={0.02} />

      <Cable from={[-0.17, Y + 0.004, -0.86]} to={[-0.2, 0.32, BACK + 0.01]} />
      <Cable from={[0.6, Y + 0.004, -0.9]} to={[-0.17, 0.3, BACK + 0.01]} sag={0.2} />
    </group>
  )
}

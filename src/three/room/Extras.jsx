import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { prepModel, Hotspot } from './common'
import { BACK } from './Room'
import { wake } from './store'

const mods = import.meta.glob('./props/*.js', { eager: true })
const get = (file, fn) => mods[`./props/${file}.js`]?.[fn]

const Y = 0.75
const SOCKET = new THREE.Vector3(-0.2, 0.32, BACK + 0.012)
const STRIP_POS = [0.05, 0, BACK + 0.13]

// Cable from a point on the desk, over the back edge, down to `to` — the
// curve hugs the desk edge and pools a little on the floor like real cord.
function Cable({ from, to, floor = true, radius = 0.0028 }) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...from), b = to.clone()
    const edgeX = a.x + (b.x - a.x) * 0.15
    const pts = [
      a,
      new THREE.Vector3(a.x, Y + 0.004, (a.z + BACK + 0.04) / 2),
      new THREE.Vector3(edgeX, Y + 0.006, BACK + 0.035),
      new THREE.Vector3(edgeX, Y - 0.06, BACK + 0.03),
      new THREE.Vector3(edgeX + (b.x - edgeX) * 0.4, 0.25, BACK + 0.04),
    ]
    if (floor) pts.push(new THREE.Vector3(b.x + (edgeX - b.x) * 0.25, 0.006, b.z + 0.02))
    pts.push(b)
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5), 120, radius, 6)
  }, [from, to, floor, radius])
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#151515" roughness={0.6} />
    </mesh>
  )
}

function WallPlug() {
  return (
    <group position={[SOCKET.x, SOCKET.y - 0.005, SOCKET.z + 0.012]}>
      <mesh castShadow>
        <boxGeometry args={[0.034, 0.042, 0.024]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function portraitTexture() {
  const t = new THREE.TextureLoader().load('/preview (1).jpg')
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Extras() {
  const createWallClock = get('clock', 'createWallClock')
  const createBreadboard = get('breadboard', 'createBreadboard')
  const createPenCup = get('pencup', 'createPenCup')
  const createWasteBin = get('bin', 'createWasteBin')
  const createPowerStrip = get('powerstrip', 'createPowerStrip')
  const createPhotoFrame = get('frame', 'createPhotoFrame')
  const createTrophy = get('trophy', 'createTrophy')

  const clock = useMemo(() => createWallClock && prepModel(createWallClock()), [createWallClock])
  const board = useMemo(() => createBreadboard && prepModel(createBreadboard()), [createBreadboard])
  const cup = useMemo(() => createPenCup && prepModel(createPenCup()), [createPenCup])
  const bin = useMemo(() => createWasteBin && prepModel(createWasteBin()), [createWasteBin])
  const strip = useMemo(() => createPowerStrip && prepModel(createPowerStrip()), [createPowerStrip])
  const frame = useMemo(() => createPhotoFrame && prepModel(createPhotoFrame({ texture: portraitTexture(), w: 0.12, h: 0.16 })), [createPhotoFrame])
  const trophy = useMemo(() => createTrophy && prepModel(createTrophy()), [createTrophy])

  // world-space plug points so cables end exactly in the strip's plugs
  const ends = useMemo(() => {
    if (!strip) return null
    const g = new THREE.Group()
    g.position.set(...STRIP_POS)
    g.updateMatrixWorld(true)
    return {
      plugs: strip.userData.plugCableEnds.map(v => v.clone().applyMatrix4(g.matrixWorld)),
      main: strip.userData.mainCableEnd.clone().applyMatrix4(g.matrixWorld),
    }
  }, [strip])

  const mainCable = useMemo(() => {
    if (!ends) return null
    const a = ends.main
    const pts = [a, new THREE.Vector3(a.x - 0.06, 0.006, a.z - 0.04), new THREE.Vector3(SOCKET.x, 0.008, BACK + 0.03), new THREE.Vector3(SOCKET.x, 0.18, BACK + 0.022), new THREE.Vector3(SOCKET.x, SOCKET.y - 0.03, SOCKET.z + 0.02)]
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5), 80, 0.003, 6)
  }, [ends])

  const blink = useMemo(() => ({ sec: -1 }), [])
  useFrame(({ clock: c }) => {
    if (clock && Math.floor(c.elapsedTime) !== blink.sec) {
      blink.sec = Math.floor(c.elapsedTime)
      clock.userData.setTime(new Date())
    }
    // breadboard LEDs run a slow chase — a heartbeat on the maker's corner
    const leds = board?.userData.leds
    if (leds) {
      const t = c.elapsedTime
      leds.forEach((m, i) => { m.emissiveIntensity = 0.25 + 1.6 * Math.max(0, Math.sin(t * 2.2 - i * 1.3)) ** 6 })
    }
  })

  return (
    <group>
      {clock && <primitive object={clock} position={[-1.08, 1.56, BACK + 0.001]} />}
      {board && (
        <Hotspot id="breadboard" always label="LiFi node prototype" onClick={() => wake(3000)} position={[-0.47, Y, -0.86]} rotation={[0, 0.22, 0]}>
          <primitive object={board} />
        </Hotspot>
      )}
      {cup && <primitive object={cup} position={[0.12, Y, -0.88]} rotation={[0, 0.6, 0]} />}
      {bin && <primitive object={bin} position={[0.98, 0, -0.74]} />}
      {frame && <primitive object={frame} position={[-0.43, 1.634, BACK + 0.12]} rotation={[0, 0.12, 0]} />}
      {trophy && <primitive object={trophy} position={[-0.25, 1.634, BACK + 0.11]} rotation={[0, -0.3, 0]} />}
      {strip && <primitive object={strip} position={STRIP_POS} />}
      {ends && (
        <>
          <Cable from={[-0.17, Y + 0.004, -0.86]} to={ends.plugs[0]} />
          <Cable from={[0.6, Y + 0.004, -0.92]} to={ends.plugs[1]} />
          <mesh geometry={mainCable} castShadow receiveShadow>
            <meshStandardMaterial color="#151515" roughness={0.6} />
          </mesh>
          <WallPlug />
        </>
      )}
    </group>
  )
}
